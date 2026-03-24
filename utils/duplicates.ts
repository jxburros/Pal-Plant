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
 * Duplicate contact detection utilities
 * @module duplicates
 */

import { Friend } from '../types';

/**
 * Detects duplicate contacts using multiple matching strategies
 * 
 * Matching strategies (in order of confidence):
 * 1. Exact name match (normalized): 100% similarity
 * 2. Email match: 95% similarity
 * 3. Phone match (7+ digits): 90% similarity
 * 4. Partial name match (substring): 80% similarity
 * 
 * @param newContacts - Array of new contacts to check for duplicates
 * @param existingFriends - Array of existing friends to compare against
 * @returns Array of detected duplicates with similarity scores
 * @example
 * const duplicates = detectDuplicates(importedContacts, currentFriends);
 * // Returns: [{ newContact, existingFriend, similarity: 100 }, ...]
 */
export const detectDuplicates = (
  newContacts: Array<{ name: string; phone?: string; email?: string }>,
  existingFriends: Friend[]
): Array<{ 
  newContact: { name: string; phone?: string; email?: string }; 
  existingFriend: Friend; 
  similarity: number 
}> => {
  const duplicates: Array<{ 
    newContact: { name: string; phone?: string; email?: string }; 
    existingFriend: Friend; 
    similarity: number 
  }> = [];

  const normalizeName = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizeEmail = (value?: string): string | null => value?.toLowerCase() ?? null;
  const normalizePhone = (value?: string): string => value?.replace(/\D/g, '') ?? '';
  const isPhoneDuplicate = (a: string, b: string): boolean => {
    if (a.length < 7 || b.length < 7) return false;
    return a.includes(b) || b.includes(a);
  };

  const normalizedExistingFriends = existingFriends.map(existing => ({
    existing,
    normalizedName: normalizeName(existing.name),
    normalizedEmail: normalizeEmail(existing.email),
    normalizedPhone: normalizePhone(existing.phone),
  }));

  newContacts.forEach(newContact => {
    const normalizedNewName = normalizeName(newContact.name);
    const normalizedNewEmail = normalizeEmail(newContact.email);
    const normalizedNewPhone = normalizePhone(newContact.phone);

    normalizedExistingFriends.forEach(({
      existing,
      normalizedName: normalizedExistingName,
      normalizedEmail: normalizedExistingEmail,
      normalizedPhone: normalizedExistingPhone,
    }) => {

      // Check for exact match
      if (normalizedNewName === normalizedExistingName) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 100 });
        return;
      }

      // Check for partial match (one contains the other)
      if (normalizedNewName.includes(normalizedExistingName) || normalizedExistingName.includes(normalizedNewName)) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 80 });
        return;
      }

      // Check by email match
      if (normalizedNewEmail && normalizedExistingEmail && normalizedNewEmail === normalizedExistingEmail) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 95 });
        return;
      }

      // Check by phone match
      if (isPhoneDuplicate(normalizedNewPhone, normalizedExistingPhone)) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 90 });
      }
    });
  });

  return duplicates;
};
