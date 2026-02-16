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
 * Calendar integration utilities for ICS export and Google Calendar links
 * @module calendar
 */

import { MeetingRequest } from '../types';

/**
 * Formats a Date object to ICS format (YYYYMMDDTHHMMSSZ)
 * @param d - Date to format
 * @returns ICS-formatted date string
 */
const formatICSDate = (d: Date): string => {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

/**
 * Generates an ICS (iCalendar) file content for a meeting
 * Creates a 1-hour calendar event with meeting details
 * @param meeting - The meeting request data
 * @returns ICS file content as string, or empty string if no scheduled date
 * @example
 * const icsContent = generateICSEvent(meeting);
 * // Returns: "BEGIN:VCALENDAR\nVERSION:2.0\n..."
 */
export const generateICSEvent = (meeting: MeetingRequest): string => {
  if (!meeting.scheduledDate) return '';

  const startDate = new Date(meeting.scheduledDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  const uid = `${meeting.id}@palplant`;
  const dtstamp = formatICSDate(new Date());
  const dtstart = formatICSDate(startDate);
  const dtend = formatICSDate(endDate);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pal Plant//Meeting//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:Meeting with ${meeting.name}`,
    `DESCRIPTION:${meeting.notes || 'Meeting scheduled via Pal Plant'}`,
    `LOCATION:${meeting.location || 'TBD'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
};

/**
 * Triggers browser download of an ICS calendar file for a meeting
 * @param meeting - The meeting request data
 */
export const downloadCalendarEvent = (meeting: MeetingRequest): void => {
  const icsContent = generateICSEvent(meeting);
  if (!icsContent) return;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meeting_${meeting.name.replace(/\s+/g, '_')}_${new Date(meeting.scheduledDate!).toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generates a Google Calendar event URL for a meeting
 * Opens Google Calendar in "add event" mode with pre-filled data
 * @param meeting - The meeting request data
 * @returns Google Calendar URL or empty string if no scheduled date
 */
export const getGoogleCalendarUrl = (meeting: MeetingRequest): string => {
  if (!meeting.scheduledDate) return '';

  const startDate = new Date(meeting.scheduledDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Meeting with ${meeting.name}`,
    dates: `${formatICSDate(startDate)}/${formatICSDate(endDate)}`,
    details: meeting.notes || 'Meeting scheduled via Pal Plant',
    location: meeting.location || 'TBD'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
