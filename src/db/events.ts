import { getDb, newId } from './client';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string | null; // HH:mm
  description: string;
  created_at: number;
  updated_at: number;
}

export async function listEvents(dateFilter?: string): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (dateFilter) {
    return db.getAllAsync<CalendarEvent>(
      'SELECT * FROM events WHERE date = ? ORDER BY time ASC, title ASC',
      dateFilter
    );
  }
  return db.getAllAsync<CalendarEvent>(
    'SELECT * FROM events ORDER BY date ASC, time ASC'
  );
}

export async function getEvent(id: string): Promise<CalendarEvent | null> {
  const db = await getDb();
  return db.getFirstAsync<CalendarEvent>('SELECT * FROM events WHERE id = ?', id);
}

export async function insertEvent(data: {
  title: string;
  date: string;
  time?: string | null;
  description?: string;
}): Promise<CalendarEvent> {
  const db = await getDb();
  const now = Date.now();
  const item: CalendarEvent = {
    id: newId(),
    title: data.title.trim() || 'Untitled Event',
    date: data.date,
    time: data.time ?? null,
    description: data.description?.trim() || '',
    created_at: now,
    updated_at: now,
  };

  await db.runAsync(
    'INSERT INTO events (id, title, date, time, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    item.id,
    item.title,
    item.date,
    item.time ?? null,
    item.description,
    item.created_at,
    item.updated_at
  );
  return item;
}

export async function updateEvent(
  id: string,
  data: Partial<Pick<CalendarEvent, 'title' | 'date' | 'time' | 'description'>>
): Promise<void> {
  const db = await getDb();
  const existing = await getEvent(id);
  if (!existing) return;

  const title = data.title !== undefined ? data.title.trim() || 'Untitled Event' : existing.title;
  const date = data.date !== undefined ? data.date : existing.date;
  const time = data.time !== undefined ? data.time : existing.time;
  const description = data.description !== undefined ? data.description.trim() : existing.description;
  const now = Date.now();

  await db.runAsync(
    'UPDATE events SET title = ?, date = ?, time = ?, description = ?, updated_at = ? WHERE id = ?',
    title,
    date,
    time ?? null,
    description,
    now,
    id
  );
}

export async function deleteEvent(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM events WHERE id = ?', id);
}
