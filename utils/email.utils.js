const nodemailer = require('nodemailer');

// Configure email transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development/testing configuration
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
};

/**
 * Send email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise} Send result
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@hospital.com',
      to,
      subject,
      text,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send welcome email template
 * @param {object} options - Template options
 */
const sendWelcomeEmail = async (options) => {
  const { email, name, hospitalName, employeeId, password, loginUrl } = options;
  
  const subject = `Welcome to ${hospitalName} - Account Created`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #2c5aa0; color: white; padding: 20px; text-align: center;">
          <h1>${hospitalName}</h1>
          <p>Hospital Management System</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Welcome, ${name}!</h2>
          <p>Your hospital administrator account has been created successfully.</p>
          
          <div style="background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2c5aa0;">
            <h3>Login Credentials</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0;"><strong>Employee ID:</strong></td>
                <td style="padding: 5px 0;">${employeeId}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Email:</strong></td>
                <td style="padding: 5px 0;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Temporary Password:</strong></td>
                <td style="padding: 5px 0; background-color: #ffffcc; padding: 5px; border-radius: 3px;">${password}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #2c5aa0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #856404;">Important Security Notice:</h4>
            <ul style="margin-bottom: 0;">
              <li>Please change your password after your first login</li>
              <li>Do not share your credentials with anyone</li>
              <li>Always log out after using the system</li>
            </ul>
          </div>
          
          <p>If you have any questions or need assistance, please contact the system administrator.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #666;">
            This is an automated email. Please do not reply to this message.<br>
            © ${new Date().getFullYear()} ${hospitalName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail
};