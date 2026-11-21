import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import type { Exercise, ExerciseEntry, SetEntry, TrainingSession } from '../types/domain';

export const DATABASE_NAME = 'strength-training-logbook';
export const DATABASE_VERSION = 1;

interface LogbookSchema extends DBSchema {
  exercises: { key: string; value: Exercise; indexes: { 'by-name': string; 'by-updated-at': string } };
  sessions: { key: string; value: TrainingSession; indexes: { 'by-status': string; 'by-started-at': string } };
  exerciseEntries: { key: string; value: ExerciseEntry; indexes: { 'by-session-id': string; 'by-exercise-id': string } };
  setEntries: { key: string; value: SetEntry; indexes: { 'by-exercise-entry-id': string } };
}

export type LogbookDatabase = IDBPDatabase<LogbookSchema>;

export function openDatabase(): Promise<LogbookDatabase> {
  return openDB<LogbookSchema>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      const exercises = database.createObjectStore('exercises', { keyPath: 'id' });
      exercises.createIndex('by-name', 'name');
      exercises.createIndex('by-updated-at', 'updatedAt');

      const sessions = database.createObjectStore('sessions', { keyPath: 'id' });
      sessions.createIndex('by-status', 'status');
      sessions.createIndex('by-started-at', 'startedAt');

      const exerciseEntries = database.createObjectStore('exerciseEntries', { keyPath: 'id' });
      exerciseEntries.createIndex('by-session-id', 'sessionId');
      exerciseEntries.createIndex('by-exercise-id', 'exerciseId');

      const setEntries = database.createObjectStore('setEntries', { keyPath: 'id' });
      setEntries.createIndex('by-exercise-entry-id', 'exerciseEntryId');
    },
  });
}
