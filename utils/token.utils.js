const crypto = require('crypto');

/**
 * Hash a token using SHA-256
 * @param {string} token - The token to hash
 * @returns {string} - The hashed token
 */
const hashToken = (token) => {
  if (!token) {
    throw new Error('Token is required for hashing');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a secure random token
 * @param {number} length - Length of the token in bytes (default: 32)
 * @returns {string} - The generated token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Compare a plain token with a hashed token
 * @param {string} plainToken - The plain text token
 * @param {string} hashedToken - The hashed token to compare against
 * @returns {boolean} - True if tokens match, false otherwise
 */
const compareToken = (plainToken, hashedToken) => {
  if (!plainToken || !hashedToken) {
    return false;
  }
  
  const hashedPlainToken = hashToken(plainToken);
  return hashedPlainToken === hashedToken;
};

/**
 * Generate a token identifier for session tracking
 * @param {string} token - The token to generate identifier for
 * @returns {string} - A short identifier for the token
 */
const generateTokenIdentifier = (token) => {
  if (!token) {
    throw new Error('Token is required for identifier generation');
  }
  
  // Generate a short identifier from the token hash (first 8 characters)
  const hash = hashToken(token);
  return hash.substring(0, 8);
};

/**
 * Validate token format (basic JWT structure check)
 * @param {string} token - The token to validate
 * @returns {boolean} - True if token has valid JWT format
 */
const isValidJWTFormat = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Extract token expiry from JWT payload (without verification)
 * @param {string} token - The JWT token
 * @returns {Date|null} - The expiry date or null if not found
 */
const extractTokenExpiry = (token) => {
  try {
    if (!isValidJWTFormat(token)) {
      return null;
    }
    
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    if (payload.exp) {
      return new Date(payload.exp * 1000); // Convert from seconds to milliseconds
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if a token is expired based on its payload
 * @param {string} token - The JWT token
 * @returns {boolean} - True if token is expired
 */
const isTokenExpired = (token) => {
  const expiry = extractTokenExpiry(token);
  if (!expiry) {
    return false; // If we can't determine expiry, assume it's not expired
  }
  
  return new Date() > expiry;
};

module.exports = {
  hashToken,
  generateSecureToken,
  compareToken,
  generateTokenIdentifier,
  isValidJWTFormat,
  extractTokenExpiry,
  isTokenExpired
};
