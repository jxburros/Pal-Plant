import { getFirebaseAnalytics } from './firebase';
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
 * Sends an event to Firebase Analytics.
 */
const sendToFirebaseAnalytics = async (type: AnalyticsEventType, metadata?: AnalyticsEvent['metadata']): Promise<void> => {
  try {
    const analytics = getFirebaseAnalytics();
    if (!analytics) {
      return; // Firebase Analytics not initialized
    }

    // Import logEvent dynamically since analytics module was loaded via CDN
    const { logEvent } = await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js');

    // Convert event type to Firebase-friendly format (lowercase with underscores)
    const eventName = type.toLowerCase();

    // Send event to Firebase Analytics
    logEvent(analytics, eventName, metadata || {});
  } catch (error) {
    console.warn('Failed to send event to Firebase Analytics:', error);
  }
};

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

  // Also send to Firebase Analytics
  void sendToFirebaseAnalytics(type, metadata);
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
