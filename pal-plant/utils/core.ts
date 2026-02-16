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
 * Core utility functions for common operations
 * @module core
 */

/**
 * Generates a random unique identifier
 * Uses base-36 encoding for compact, URL-safe IDs
 * @returns 7-character random ID
 * @example
 * generateId() // "x5k2m9a"
 */
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Converts a File object to a base64-encoded data URL
 * Useful for storing images in IndexedDB or displaying without external URLs
 * 
 * @param file - The file to convert
 * @returns Promise that resolves to base64 data URL
 * @throws Error if file reading fails
 * @example
 * const base64 = await fileToBase64(imageFile);
 * // Returns: "data:image/png;base64,iVBORw0KG..."
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
