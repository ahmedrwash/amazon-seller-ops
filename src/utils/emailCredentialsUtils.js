import CryptoJS from 'crypto-js';

// In a real production app, this key should be an environment variable 
// injected at build time or retrieved from a secure vault.
// For this demo environment, we use a fallback if the env var isn't set.
const ENCRYPTION_KEY = import.meta.env.VITE_EMAIL_ENCRYPTION_KEY || 'demo-encryption-key-do-not-use-in-prod';

/**
 * Encrypts a password string using AES encryption
 * @param {string} password - The password to encrypt
 * @returns {string} - The encrypted password string
 */
export const encryptPassword = (password) => {
  if (!password) return '';
  try {
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return '';
  }
};

/**
 * Decrypts an encrypted password string
 * @param {string} encryptedPassword - The encrypted password string
 * @returns {string} - The decrypted original password
 */
export const decryptPassword = (encryptedPassword) => {
  if (!encryptedPassword) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
};

/**
 * Validates basic email credential fields
 */
export const validateCredentialData = (data) => {
  const errors = {};
  
  if (!data.email_address) errors.email_address = "Email address is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email_address)) errors.email_address = "Invalid email format";

  if (!data.imap_server) errors.imap_server = "IMAP server is required";
  if (!data.imap_username) errors.imap_username = "IMAP username is required";
  if (!data.imap_password && !data.id) errors.imap_password = "IMAP password is required"; // Only required for new records

  if (data.imap_port && (data.imap_port < 1 || data.imap_port > 65535)) {
    errors.imap_port = "Invalid port number";
  }

  if (data.smtp_port && (data.smtp_port < 1 || data.smtp_port > 65535)) {
    errors.smtp_port = "Invalid port number";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};