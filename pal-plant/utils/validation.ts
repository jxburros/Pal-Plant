/**
 * Input validation and sanitization utilities
 * @module validation
 */

/**
 * Sanitizes text input by trimming whitespace and limiting length
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed length (default: 200)
 * @returns Sanitized text
 */
export const sanitizeText = (text: string, maxLength: number = 200): string => {
  return text.trim().slice(0, maxLength);
};

/**
 * Sanitizes phone number input by removing invalid characters
 * Allows: digits, +, -, (), ., space, and "ext"
 * @param phone - The phone number to sanitize
 * @returns Sanitized phone number (max 30 characters)
 */
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/[^0-9+\-() .ext]/gi, '').trim().slice(0, 30);
};

/**
 * Validates email format using regex
 * Empty emails are considered valid (optional field)
 * @param email - The email address to validate
 * @returns true if valid or empty, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return true; // empty is OK (optional)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
