import { openDatabase } from './database';
import type { Exercise, ExerciseEntry, SetEntry, TrainingSession, WorkoutCategory } from '../types/domain';

const now = () => new Date().toISOString();
const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export const DEFAULT_EXERCISES = ['Barbell Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Barbell Row'];

export async function listExercises(includeArchived = false): Promise<Exercise[]> {
  const database = await openDatabase();
  const exercises = await database.getAllFromIndex('exercises', 'by-name');
  database.close();
  const seen = new Set<string>();
  return exercises.filter((exercise) => {
    if (!includeArchived && exercise.archivedAt) return false;
    const key = exercise.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function seedExercises(): Promise<void> {
  const database = await openDatabase();
  const timestamp = now();
  const transaction = database.transaction('exercises', 'readwrite');
  const existing = await transaction.store.getAll();
  const names = new Set(existing.map((exercise) => exercise.name.trim().toLowerCase()));
  for (const name of DEFAULT_EXERCISES) {
    if (!names.has(name.toLowerCase())) await transaction.store.put({ id: id(), name, isCustom: false, createdAt: timestamp, updatedAt: timestamp });
  }
  await transaction.done;
  database.close();
}

export async function saveExercise(input: Pick<Exercise, 'name' | 'muscleGroup' | 'equipment' | 'isCustom'>, existingId?: string): Promise<Exercise> {
  const database = await openDatabase(); const timestamp = now(); const existing = existingId ? await database.get('exercises', existingId) : undefined;
  const exercise: Exercise = { id: existingId ?? id(), name: input.name.trim(), isCustom: input.isCustom, createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp, muscleGroup: input.muscleGroup?.trim() || undefined, equipment: input.equipment?.trim() || undefined };
  await database.put('exercises', exercise); database.close(); return exercise;
}
export async function archiveExercise(exerciseId: string): Promise<void> { const database = await openDatabase(); const exercise = await database.get('exercises', exerciseId); if (exercise) await database.put('exercises', { ...exercise, archivedAt: now(), updatedAt: now() }); database.close(); }
export async function getActiveSession(): Promise<TrainingSession | undefined> { const database = await openDatabase(); const sessions = await database.getAllFromIndex('sessions', 'by-status', 'in_progress'); database.close(); return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0]; }
export async function createSession(category: WorkoutCategory = 'strength'): Promise<TrainingSession> { const active = await getActiveSession(); if (active) return active; const session: TrainingSession = { id: id(), startedAt: now(), status: 'in_progress', category }; const database = await openDatabase(); await database.put('sessions', session); database.close(); return session; }
export async function finishSession(session: TrainingSession): Promise<TrainingSession> { const finished = { ...session, status: 'completed' as const, finishedAt: now() }; const database = await openDatabase(); await database.put('sessions', finished); database.close(); return finished; }
export async function listSessions(): Promise<TrainingSession[]> { const database = await openDatabase(); const sessions = await database.getAllFromIndex('sessions', 'by-started-at'); database.close(); return sessions.filter((session) => session.status === 'completed').sort((a, b) => b.startedAt.localeCompare(a.startedAt)); }
export async function getExerciseEntries(sessionId: string): Promise<ExerciseEntry[]> { const database = await openDatabase(); const entries = await database.getAllFromIndex('exerciseEntries', 'by-session-id', sessionId); database.close(); return entries.sort((a, b) => a.order - b.order); }
export async function getSetEntries(exerciseEntryId: string): Promise<SetEntry[]> { const database = await openDatabase(); const entries = await database.getAllFromIndex('setEntries', 'by-exercise-entry-id', exerciseEntryId); database.close(); return entries.sort((a, b) => a.setNumber - b.setNumber); }
export async function addExerciseToSession(sessionId: string, exercise: Exercise): Promise<ExerciseEntry> { const entries = await getExerciseEntries(sessionId); const entry = { id: id(), sessionId, exerciseId: exercise.id, exerciseNameSnapshot: exercise.name, order: entries.length }; const database = await openDatabase(); await database.put('exerciseEntries', entry); database.close(); return entry; }
export async function addSet(entryId: string, values?: Partial<Pick<SetEntry, 'weightKg' | 'reps'>>): Promise<SetEntry> { const entries = await getSetEntries(entryId); const timestamp = now(); const set = { id: id(), exerciseEntryId: entryId, setNumber: entries.length + 1, weightKg: values?.weightKg ?? 0, reps: values?.reps ?? 0, completed: false, createdAt: timestamp, updatedAt: timestamp }; const database = await openDatabase(); await database.put('setEntries', set); database.close(); return set; }
export async function updateSet(set: SetEntry): Promise<void> { const database = await openDatabase(); await database.put('setEntries', { ...set, updatedAt: now() }); database.close(); }
export async function exportData(): Promise<string> { const database = await openDatabase(); const data = { version: 1, exportedAt: now(), exercises: await database.getAll('exercises'), sessions: await database.getAll('sessions'), exerciseEntries: await database.getAll('exerciseEntries'), setEntries: await database.getAll('setEntries') }; database.close(); return JSON.stringify(data, null, 2); }

export async function importData(raw: string): Promise<void> {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object') throw new Error('Invalid Lift Log backup.');
  const record = data as Record<string, unknown>;
  if (record.version !== 1 || !Array.isArray(record.exercises) || !Array.isArray(record.sessions) || !Array.isArray(record.exerciseEntries) || !Array.isArray(record.setEntries)) throw new Error('Invalid Lift Log backup.');
  const backup = record as unknown as { exercises: unknown[]; sessions: unknown[]; exerciseEntries: unknown[]; setEntries: unknown[] };
  const database = await openDatabase();
  const transaction = database.transaction(['exercises', 'sessions', 'exerciseEntries', 'setEntries'], 'readwrite');
  for (const exercise of backup.exercises) await transaction.objectStore('exercises').put(exercise as Exercise);
  for (const session of backup.sessions) await transaction.objectStore('sessions').put(session as TrainingSession);
  for (const entry of backup.exerciseEntries) await transaction.objectStore('exerciseEntries').put(entry as ExerciseEntry);
  for (const set of backup.setEntries) await transaction.objectStore('setEntries').put(set as SetEntry);
  await transaction.done; database.close();
}

export async function getPreviousPerformance(exerciseId: string, before: string): Promise<SetEntry[]> {
  const database = await openDatabase();
  const entries = await database.getAllFromIndex('exerciseEntries', 'by-exercise-id', exerciseId);
  const sessions = await database.getAll('sessions');
  const eligible = entries.map((entry) => ({ entry, session: sessions.find((session) => session.id === entry.sessionId) })).filter((item): item is { entry: ExerciseEntry; session: TrainingSession } => Boolean(item.session && item.session.status === 'completed' && item.session.startedAt < before)).sort((a, b) => b.session.startedAt.localeCompare(a.session.startedAt));
  const latest = eligible[0]?.entry;
  if (!latest) { database.close(); return []; }
  const sets = await database.getAllFromIndex('setEntries', 'by-exercise-entry-id', latest.id);
  database.close();
  return sets.sort((a, b) => a.setNumber - b.setNumber);
}
