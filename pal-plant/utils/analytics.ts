/**
 * Local-only analytics for Pal-Plant
 * 
 * IMPORTANT: This is a LOCAL analytics system only.
 * No data is sent to external services (Firebase Analytics is NOT used).
 * All analytics events are stored locally for user's personal insights only.
 * This maintains the app's local-first privacy model.
 */

import { getMetadata, saveMetadata } from './storage';

export type AnalyticsEventType =
  | 'FRIEND_ADDED'
  | 'FRIEND_EDITED'
  | 'FRIEND_DELETED'
  | 'CONTACT_LOGGED'
  | 'MEETING_CREATED'
  | 'MEETING_SCHEDULED'
  | 'MEETING_COMPLETED'
  | 'MEETING_CLOSED'
  | 'BULK_IMPORT';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

const EVENT_KEY = 'friendkeep_analytics_events';
const EVENT_LIMIT = 500;

const generateEventId = (): string => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Retrieves all locally stored analytics events.
 * Events are stored in local storage only and never sent externally.
 */
export const getAnalyticsEvents = async (): Promise<AnalyticsEvent[]> => {
  try {
    const raw = await getMetadata(EVENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Tracks an event locally for personal analytics and insights.
 * Events are stored locally only and never sent to external services.
 */
export const trackEvent = async (type: AnalyticsEventType, metadata?: AnalyticsEvent['metadata']): Promise<void> => {
  const current = await getAnalyticsEvents();
  const next: AnalyticsEvent[] = [
    {
      id: generateEventId(),
      type,
      timestamp: new Date().toISOString(),
      metadata
    },
    ...current
  ].slice(0, EVENT_LIMIT);

  await saveMetadata(EVENT_KEY, JSON.stringify(next));
};

export const getAnalyticsSummary = async (days = 7): Promise<Record<AnalyticsEventType, number>> => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const summary = {
    FRIEND_ADDED: 0,
    FRIEND_EDITED: 0,
    FRIEND_DELETED: 0,
    CONTACT_LOGGED: 0,
    MEETING_CREATED: 0,
    MEETING_SCHEDULED: 0,
    MEETING_COMPLETED: 0,
    MEETING_CLOSED: 0,
    BULK_IMPORT: 0
  } satisfies Record<AnalyticsEventType, number>;

  const events = await getAnalyticsEvents();
  events.forEach(event => {
    if (new Date(event.timestamp).getTime() >= cutoff) {
      summary[event.type] += 1;
    }
  });

  return summary;
};
