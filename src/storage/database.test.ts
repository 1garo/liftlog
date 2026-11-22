import { deleteDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';
import { DATABASE_NAME, DATABASE_VERSION, openDatabase } from './database';
import { addExerciseToSession, addSet, createSession, deleteSession, finishSession, getExerciseEntries, getSetEntries, listExercises, listSessions, saveExercise, seedExercises } from './repositories';

afterEach(async () => { await deleteDB(DATABASE_NAME); });

describe('logbook database', () => {
  it('initializes the versioned stores and indexes', async () => {
    const database = await openDatabase();
    expect(database.version).toBe(DATABASE_VERSION);
    expect(database.objectStoreNames).toContain('exercises');
    expect(database.objectStoreNames).toContain('sessions');
    expect(database.objectStoreNames).toContain('exerciseEntries');
    expect(database.objectStoreNames).toContain('setEntries');
    database.close();
  });

  it('reopens without losing the schema', async () => {
    const first = await openDatabase();
    first.close();
    const second = await openDatabase();
    expect(second.objectStoreNames.length).toBe(4);
    second.close();
  });

  it('seeds the default exercises idempotently', async () => {
    await Promise.all([seedExercises(), seedExercises()]);
    const exercises = await listExercises();
    expect(exercises.map((exercise) => exercise.name)).toEqual(['Barbell Row', 'Barbell Squat', 'Bench Press', 'Deadlift', 'Overhead Press']);
  });

  it('deletes a session and its exercise entries and sets', async () => {
    const session = await createSession();
    const exercise = await saveExercise({ name: 'Squat', isCustom: true });
    const entry = await addExerciseToSession(session.id, exercise);
    await addSet(entry.id, { weightKg: 100, reps: 5 });
    await finishSession(session);

    await deleteSession(session.id);

    expect(await listSessions()).toEqual([]);
    expect(await getExerciseEntries(session.id)).toEqual([]);
    expect(await getSetEntries(entry.id)).toEqual([]);
  });
});
