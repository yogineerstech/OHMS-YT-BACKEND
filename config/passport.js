const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { prisma } = require('./database');
const { comparePassword } = require('../utils/bcrypt.utils');

// Local Strategy for email/password authentication
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Find user with credentials - Updated approach for JSON fields
    const userCredentials = await prisma.userCredential.findMany({
      where: {
        credentialType: 'email',
        isActive: true
      },
      include: {
        user: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            },
            hospital: true,
            department: true
          }
        }
      }
    });

    // Filter by email
    const userCredential = userCredentials.find(cred => 
      cred.user && 
      cred.user.isActive &&
      cred.user.personalDetails &&
      typeof cred.user.personalDetails === 'object' &&
      cred.user.personalDetails.email === email
    );

    if (!userCredential) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    const isValidPassword = await comparePassword(password, userCredential.credentialDataHash);
    if (!isValidPassword) {
      // Update failed attempts
      await prisma.userCredential.update({
        where: { id: userCredential.id },
        data: { 
          failedAttempts: { increment: 1 },
          lastUsed: new Date()
        }
      });
      return done(null, false, { message: 'Invalid email or password' });
    }

    // Reset failed attempts on successful login
    await prisma.userCredential.update({
      where: { id: userCredential.id },
      data: { 
        failedAttempts: 0,
        lastUsed: new Date()
      }
    });

    return done(null, userCredential.user);
  } catch (error) {
    return done(error);
  }
}));

// JWT Strategy for token authentication
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
}, async (payload, done) => {
  try {
    console.log('JWT Strategy - Payload received:', payload);
    
    let user = null;
    
    // Check if it's a SuperAdmin token
    if (payload.userType === 'super_admin') {
      user = await prisma.superAdmin.findUnique({
        where: { id: payload.userId },
        include: {
          credentials: {
            where: { isActive: true }
          }
        }
      });
      console.log('JWT Strategy - SuperAdmin found:', user ? 'Yes' : 'No');
      
      // Add userType to the user object for middleware
      if (user) {
        user.userType = 'super_admin';
      }
    } else {
      // Handle Staff token
      user = await prisma.staff.findUnique({
        where: { id: payload.userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          hospital: true,
          department: true
        }
      });
      console.log('JWT Strategy - Staff found:', user ? 'Yes' : 'No');
      
      // Add userType to the user object for middleware
      if (user) {
        user.userType = 'staff';
      }
    }

    if (user) {
      console.log('JWT Strategy - User ID:', user.id);
      console.log('JWT Strategy - User isActive:', user.isActive);
      console.log('JWT Strategy - User type:', user.userType);
    }

    if (user && user.isActive) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    console.error('JWT Strategy Error:', error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.staff.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true
              }
            }
          }
        },
        hospital: true,
        department: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;