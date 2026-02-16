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

  /**
   * Normalizes a string for comparison by removing non-alphanumeric characters
   * and converting to lowercase
   */
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

  newContacts.forEach(newContact => {
    const normalizedNew = normalize(newContact.name);

    existingFriends.forEach(existing => {
      const normalizedExisting = normalize(existing.name);

      // Check for exact match
      if (normalizedNew === normalizedExisting) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 100 });
        return;
      }

      // Check for partial match (one contains the other)
      if (normalizedNew.includes(normalizedExisting) || normalizedExisting.includes(normalizedNew)) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 80 });
        return;
      }

      // Check by email match
      if (newContact.email && existing.email && newContact.email.toLowerCase() === existing.email.toLowerCase()) {
        duplicates.push({ newContact, existingFriend: existing, similarity: 95 });
        return;
      }

      // Check by phone match
      if (newContact.phone && existing.phone) {
        const normalizedNewPhone = newContact.phone.replace(/\D/g, '');
        const normalizedExistingPhone = existing.phone.replace(/\D/g, '');
        if (normalizedNewPhone.length >= 7 && normalizedExistingPhone.length >= 7 &&
            (normalizedNewPhone.includes(normalizedExistingPhone) || normalizedExistingPhone.includes(normalizedNewPhone))) {
          duplicates.push({ newContact, existingFriend: existing, similarity: 90 });
        }
      }
    });
  });

  return duplicates;
};
