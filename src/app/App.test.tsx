import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App, History } from './App';
import { addExerciseToSession, addSet, createSession, finishSession, listSessions, saveExercise } from '../storage/repositories';

describe('application shell actions', () => {
  it('starts a workout and opens exercise selection', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /start workout/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /start workout/i })[1]);
    await waitFor(() => expect(screen.getByRole('heading', { name: /^active workout$/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /add exercise/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /deadlift/i })).toBeInTheDocument());
  });

  it('opens the add exercise form from the library', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^library/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.getByRole('heading', { name: /^add exercise$/i })).toBeInTheDocument();
  });

  it('opens a previous session and shows its recorded sets', async () => {
    const session = await createSession();
    const exercise = await saveExercise({ name: 'Deadlift', isCustom: true });
    const entry = await addExerciseToSession(session.id, exercise);
    await addSet(entry.id, { weightKg: 100, reps: 5 });
    await finishSession(session);

    render(<History sessions={await listSessions()} onDelete={async () => undefined} />);
    fireEvent.click(screen.getAllByRole('button', { name: /view details/i })[0]);

    await waitFor(() => expect(screen.getByText('100 kg × 5')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /back to history/i })).toBeInTheDocument();
    expect(screen.queryByText(/duration/i)).not.toBeInTheDocument();
  });

  it('confirms before requesting deletion of a previous session', async () => {
    const session = await createSession();
    const exercise = await saveExercise({ name: 'Bench Press', isCustom: true });
    const entry = await addExerciseToSession(session.id, exercise);
    await addSet(entry.id, { weightKg: 60, reps: 8 });
    await finishSession(session);

    const onDelete = vi.fn(async () => undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<History sessions={await listSessions()} onDelete={onDelete} />);
    fireEvent.click(screen.getAllByRole('button', { name: /view details/i })[0]);
    await waitFor(() => expect(screen.getByRole('button', { name: /delete workout/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /delete workout/i }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(session.id));
    vi.restoreAllMocks();
  });
});
