/**
 * CSV parsing utilities for importing contacts
 * @module csv
 */

import { sanitizeText, sanitizePhone } from './validation';

/**
 * Parses a single CSV line respecting quoted fields and escaped quotes
 * Handles RFC 4180 CSV format including:
 * - Quoted fields with commas
 * - Escaped quotes (double quotes within quotes)
 * 
 * @param line - A single line from a CSV file
 * @returns Array of field values
 * @example
 * parseCSVLine('John,Doe,"123 Main St, Apt 4"')
 * // Returns: ['John', 'Doe', '123 Main St, Apt 4']
 */
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  values.push(current.trim());
  return values;
};

/**
 * Parses CSV contact data into structured contact objects
 * Automatically detects common header names for name, phone, email, and category
 * 
 * Supported header variations:
 * - Name: "name", "full name", "fullname"
 * - Phone: "phone", "mobile", "telephone"
 * - Email: "email", "e-mail"
 * - Category: "category", "group", "type"
 * 
 * @param csvContent - The complete CSV file content as a string
 * @returns Array of contact objects with sanitized data
 * @example
 * const contacts = parseCSVContacts(csvFileContent);
 * // Returns: [{ name: "John Doe", phone: "555-1234", email: "john@example.com", category: "Friends" }, ...]
 */
export const parseCSVContacts = (csvContent: string): Array<{ 
  name: string; 
  phone?: string; 
  email?: string; 
  category?: string 
}> => {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/"/g, ''));
  const nameIndex = headers.findIndex(h => h === 'name' || h === 'full name' || h === 'fullname');
  const phoneIndex = headers.findIndex(h => h === 'phone' || h === 'mobile' || h === 'telephone');
  const emailIndex = headers.findIndex(h => h === 'email' || h === 'e-mail');
  const categoryIndex = headers.findIndex(h => h === 'category' || h === 'group' || h === 'type');

  if (nameIndex === -1) return [];

  const contacts: Array<{ name: string; phone?: string; email?: string; category?: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const name = sanitizeText(values[nameIndex] || '', 100);
    if (!name) continue;

    contacts.push({
      name,
      phone: phoneIndex !== -1 ? sanitizePhone(values[phoneIndex] || '') : undefined,
      email: emailIndex !== -1 ? sanitizeText(values[emailIndex] || '', 254) : undefined,
      category: categoryIndex !== -1 ? sanitizeText(values[categoryIndex] || '', 50) : undefined
    });
  }

  return contacts;
};
