# 🛠️ AI Implementation Specification: Dynamic Interactions & Offline-First Persistence

This document provides a technical roadmap for implementing weighted relationship interactions, dynamic communication buttons, and offline-first infrastructure in the **Pal-Plant** application.

---

## 1. Core Data Structures (`pal-plant/types.ts`)

Update the `Friend` interface and define a new `InteractionType` enum to support weighted logic.

```typescript
export enum InteractionType {
  TEXT = 'TEXT',
  PHONE_CALL = 'PHONE_CALL',
  VIDEO_CALL = 'VIDEO_CALL',
  IN_PERSON = 'IN_PERSON'
}

export interface Friend {
  id: string;
  name: string;
  category: string;
  frequencyDays: number;
  lastContacted: string; // ISO String
  phone?: string;        // New Field
  email?: string;        // New Field
  notes?: string;
  logs: ContactLog[];
  // ... existing fields
}

export const INTERACTION_WEIGHTS = {
  [InteractionType.TEXT]: 0.65,
  [InteractionType.PHONE_CALL]: 1.0,
  [InteractionType.VIDEO_CALL]: 1.25,
  [InteractionType.IN_PERSON]: 1.25,
};
