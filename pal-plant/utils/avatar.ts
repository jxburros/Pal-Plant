/**
 * Avatar utility functions for generating user initials and colors
 * @module avatar
 */

/**
 * Extracts initials from a person's name
 * @param name - The full name of the person
 * @returns The initials (1-2 characters) in uppercase
 * @example
 * getInitials("John Doe") // "JD"
 * getInitials("Alice") // "A"
 * getInitials("") // "?"
 */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generates a consistent color for an avatar based on the person's name
 * Uses a hash function to ensure the same name always gets the same color
 * @param name - The person's name
 * @returns An HSL color string
 * @example
 * getAvatarColor("John Doe") // "hsl(123, 55%, 55%)"
 */
export const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
};
