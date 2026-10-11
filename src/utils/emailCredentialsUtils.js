// Frontend environment variables are public. Credential encryption belongs in
// a server-side secret store; fail closed until that workflow is available.
export const encryptPassword = (password) => {
  if (!password) return '';
  throw new Error('Password changes require secure server-side credential storage. Contact your administrator.');
};

/**
 * Decrypts an encrypted password string
 * @param {string} encryptedPassword - The encrypted password string
 * @returns {string} - The decrypted original password
 */
export const decryptPassword = (encryptedPassword) => {
  if (!encryptedPassword) return '';
  throw new Error('Stored passwords cannot be decrypted in the browser.');
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
