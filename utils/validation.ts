/*
 * Copyright 2026 Jeffrey Guntly (JX Holdings, LLC)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
