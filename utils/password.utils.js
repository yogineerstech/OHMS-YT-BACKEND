const crypto = require('crypto');

/**
 * Generate a random password
 * @param {number} length - Password length
 * @returns {string} Generated password
 */
const generateRandomPassword = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result
 */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isValid = password.length >= minLength && hasLowercase && hasUppercase && hasNumbers && hasSpecialChar;
  
  const suggestions = [];
  if (password.length < minLength) suggestions.push(`Password must be at least ${minLength} characters long`);
  if (!hasLowercase) suggestions.push('Password must contain lowercase letters');
  if (!hasUppercase) suggestions.push('Password must contain uppercase letters');
  if (!hasNumbers) suggestions.push('Password must contain numbers');
  if (!hasSpecialChar) suggestions.push('Password must contain special characters');
  
  return {
    isValid,
    suggestions,
    strength: isValid ? 'strong' : suggestions.length <= 2 ? 'medium' : 'weak'
  };
};

module.exports = {
  generateRandomPassword,
  validatePasswordStrength
};