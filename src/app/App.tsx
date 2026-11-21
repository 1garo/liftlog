import { useEffect, useMemo, useState } from 'react';
import '../styles/app.css';
import type { Exercise, ExerciseEntry, SetEntry, TrainingSession, WorkoutCategory } from '../types/domain';
import { addExerciseToSession, addSet, archiveExercise, createSession, finishSession, getActiveSession, getExerciseEntries, getPreviousPerformance, getSetEntries, listExercises, listSessions, saveExercise, seedExercises, updateSet } from '../storage/repositories';

type Page = 'home' | 'workout' | 'library' | 'history';
const titles: Record<Page, string> = { home: 'Your training log', workout: 'Active workout', library: 'Exercise library', history: 'Training history' };
const formatSessionDate = (date: string) => { const value = new Date(date); const day = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(value); const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(value); return `${day} · ${time}`; };
const categoryLabel = (category?: WorkoutCategory) => ({ strength: 'Strength', cardio: 'Cardio', mobility: 'Mobility', other: 'Other' }[category ?? 'strength']);

export function App() {
  const [page, setPage] = useState<Page>('home');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [activeSession, setActiveSession] = useState<TrainingSession>();
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [sets, setSets] = useState<Record<string, SetEntry[]>>({});
  const [previous, setPrevious] = useState<Record<string, SetEntry[]>>({});
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);

  async function loadEntries(sessionId: string, isMounted = () => true) {
    const nextEntries = await getExerciseEntries(sessionId);
    const nextSets: Record<string, SetEntry[]> = {};
    for (const entry of nextEntries) nextSets[entry.id] = await getSetEntries(entry.id);
    if (!isMounted()) return;
    setEntries(nextEntries); setSets(nextSets);
    const previousSets: Record<string, SetEntry[]> = {};
    for (const entry of nextEntries) previousSets[entry.id] = await getPreviousPerformance(entry.exerciseId, new Date().toISOString());
    if (!isMounted()) return;
    setPrevious(previousSets);
  }
  async function refresh(isMounted = () => true) {
    await seedExercises();
    const [available, history, active] = await Promise.all([listExercises(), listSessions(), getActiveSession()]);
    if (!isMounted()) return;
    setExercises(available); setSessions(history); setActiveSession(active);
    if (active) await loadEntries(active.id, isMounted);
  }
  useEffect(() => { let disposed = false; void refresh(() => !disposed); return () => { disposed = true; }; }, []);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(''), 3000); return () => window.clearTimeout(timeout); }, [notice]);

  async function startWorkout(category: WorkoutCategory) { const session = await createSession(category); setShowStartForm(false); setActiveSession(session); setPage('workout'); await loadEntries(session.id); }
  async function addExercise(exercise: Exercise) { if (!activeSession) return; const entry = await addExerciseToSession(activeSession.id, exercise); await addSet(entry.id); await loadEntries(activeSession.id); setNotice(`${exercise.name} added.`); }
  async function changeSet(set: SetEntry, field: 'weightKg' | 'reps' | 'completed', value: number | boolean) { const next = { ...set, [field]: value }; await updateSet(next); setSets((current) => ({ ...current, [set.exerciseEntryId]: current[set.exerciseEntryId].map((item) => item.id === set.id ? next : item) })); }
  async function completeWorkout() { if (!activeSession) return; await finishSession(activeSession); setActiveSession(undefined); setEntries([]); setSets({}); await refresh(); setPage('history'); setNotice('Workout saved.'); }
  async function saveNewExercise(input: Pick<Exercise, 'name' | 'muscleGroup' | 'equipment' | 'isCustom'>) { await saveExercise(input); setShowForm(false); await refresh(); setNotice('Exercise saved.'); }
  return <main className="app-shell">
    <header className="app-header"><p className="eyebrow">LIFT LOG</p><h1>{titles[page]}</h1></header>
    <section className="page-content" aria-live="polite">
      {page === 'home' && <Home active={activeSession} sessions={sessions} onStart={() => setShowStartForm(true)} onResume={() => setPage('workout')} />}
      {page === 'workout' && <Workout active={activeSession} exercises={exercises} entries={entries} sets={sets} previous={previous} onAdd={(exercise) => void addExercise(exercise)} onChangeSet={(set, field, value) => void changeSet(set, field, value)} onAddSet={async (entry) => { await addSet(entry.id); if (activeSession) await loadEntries(activeSession.id); }} onFinish={() => void completeWorkout()} />}
      {page === 'library' && <Library exercises={exercises} onAdd={() => setShowForm(true)} onArchive={async (id) => { await archiveExercise(id); await refresh(); }} />}
      {page === 'history' && <History sessions={sessions} />}
      {showForm && <ExerciseForm onCancel={() => setShowForm(false)} onSave={(input) => void saveNewExercise(input)} />}
      {showStartForm && <WorkoutStartForm onCancel={() => setShowStartForm(false)} onStart={(category) => void startWorkout(category)} />}
      {notice && <p className="action-feedback" role="status">{notice}</p>}
    </section>
    <nav className="bottom-nav" aria-label="Main navigation">{(Object.keys(titles) as Page[]).map((item) => <button className={page === item ? 'nav-item active' : 'nav-item'} key={item} onClick={() => setPage(item)}><span aria-hidden="true">{item === 'home' ? '⌂' : item === 'workout' ? '+' : item === 'library' ? '▦' : '◷'}</span>{item[0].toUpperCase() + item.slice(1)}</button>)}</nav>
  </main>;
}

function Home({ active, sessions, onStart, onResume }: { active?: TrainingSession; sessions: TrainingSession[]; onStart: () => void; onResume: () => void }) { return <div className="home-panel"><p className="muted">{active ? 'You have an unfinished workout.' : 'Ready when you are.'}</p><button className="primary-action start-action" onClick={active ? onResume : onStart}>{active ? 'Resume workout' : 'Start workout'} <span>→</span></button><section className="recent-section"><h2>Recent workouts</h2>{sessions.length === 0 ? <div className="empty-card"><strong>No recent sessions</strong><span>Completed workouts will appear here.</span></div> : sessions.slice(0, 3).map((session) => <article className="history-card" key={session.id}><strong><em>{categoryLabel(session.category)}</em>{formatSessionDate(session.startedAt)}</strong><span>Duration · {session.finishedAt ? `${Math.max(1, Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))} min` : 'in progress'}</span></article>)}</section></div>; }

function WorkoutStartForm({ onCancel, onStart }: { onCancel: () => void; onStart: (category: WorkoutCategory) => void }) { const [category, setCategory] = useState<WorkoutCategory>('strength'); return <div className="modal-backdrop"><form className="modal" onSubmit={(event) => { event.preventDefault(); onStart(category); }}><h2>Start workout</h2><p className="muted">What kind of workout are you doing?</p><select aria-label="Workout category" value={category} onChange={(event) => setCategory(event.target.value as WorkoutCategory)}><option value="strength">Strength</option><option value="cardio">Cardio</option><option value="mobility">Mobility</option><option value="other">Other</option></select><div className="form-actions"><button type="button" className="secondary-action" onClick={onCancel}>Cancel</button><button className="primary-action" type="submit">Start workout</button></div></form></div>; }

function Workout({ active, exercises, entries, sets, previous, onAdd, onChangeSet, onAddSet, onFinish }: { active?: TrainingSession; exercises: Exercise[]; entries: ExerciseEntry[]; sets: Record<string, SetEntry[]>; previous: Record<string, SetEntry[]>; onAdd: (exercise: Exercise) => void; onChangeSet: (set: SetEntry, field: 'weightKg' | 'reps' | 'completed', value: number | boolean) => void; onAddSet: (entry: ExerciseEntry) => Promise<void>; onFinish: () => void }) { const [picker, setPicker] = useState(false); return <div className="stack"><div className="toolbar"><span className="muted">{active ? new Date(active.startedAt).toLocaleString() : ''}</span><button className="secondary-action" onClick={() => setPicker(!picker)}>{picker ? 'Close' : 'Add exercise'}</button></div>{picker && <div className="picker">{exercises.map((exercise) => <button className="list-row" key={exercise.id} onClick={() => { onAdd(exercise); setPicker(false); }}>{exercise.name}<span>＋</span></button>)}</div>}{entries.length === 0 && <div className="empty-card"><strong>No exercises yet</strong><span>Add the exercises you plan to perform.</span></div>}{entries.map((entry) => <article className="exercise-card" key={entry.id}><h2>{entry.exerciseNameSnapshot}</h2>{previous[entry.id]?.length > 0 && <p className="previous">Previous: {previous[entry.id].map((set) => `${set.weightKg} kg × ${set.reps}`).join(' · ')}</p>}<div className="set-header"><span>Set</span><span>Weight (kg)</span><span>Reps</span><span>Done</span></div>{sets[entry.id]?.map((set) => <div className="set-row" key={set.id}><span>{set.setNumber}</span><input aria-label={`${entry.exerciseNameSnapshot} set ${set.setNumber} weight in kilograms`} type="number" min="0" step="0.5" value={set.weightKg} onChange={(event) => onChangeSet(set, 'weightKg', Number(event.target.value))} /><input aria-label={`${entry.exerciseNameSnapshot} set ${set.setNumber} repetitions`} type="number" min="0" value={set.reps} onChange={(event) => onChangeSet(set, 'reps', Number(event.target.value))} /><input className="done-checkbox" type="checkbox" aria-label={`Mark set ${set.setNumber} complete`} checked={set.completed} onChange={(event) => onChangeSet(set, 'completed', event.target.checked)} /></div>)}<button className="text-action" onClick={() => void onAddSet(entry)}>＋ Add set</button></article>)}{entries.length > 0 && <button className="primary-action" onClick={onFinish}>Finish workout <span>✓</span></button>}</div>; }

function Library({ exercises, onAdd, onArchive }: { exercises: Exercise[]; onAdd: () => void; onArchive: (id: string) => Promise<void> }) { const [query, setQuery] = useState(''); const filtered = useMemo(() => exercises.filter((exercise) => exercise.name.toLowerCase().includes(query.toLowerCase())), [exercises, query]); return <div className="stack"><div className="toolbar"><input className="search" aria-label="Search exercises" placeholder="Search exercises" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="secondary-action" onClick={onAdd}>＋ Add</button></div>{filtered.map((exercise) => <div className="list-row" key={exercise.id}><span><strong>{exercise.name}</strong><small>{exercise.equipment ?? 'Standard exercise'}</small></span><button className="archive-action" onClick={() => void onArchive(exercise.id)}>Archive</button></div>)}{filtered.length === 0 && <div className="empty-card">No exercises found.</div>}</div>; }

function ExerciseForm({ onCancel, onSave }: { onCancel: () => void; onSave: (input: Pick<Exercise, 'name' | 'muscleGroup' | 'equipment' | 'isCustom'>) => void }) { return <div className="modal-backdrop"><form className="modal" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave({ name: String(form.get('name')), muscleGroup: String(form.get('muscleGroup')), equipment: String(form.get('equipment')), isCustom: true }); }}><h2>Add exercise</h2><input name="name" required placeholder="Exercise name" autoFocus /><input name="muscleGroup" placeholder="Muscle group (optional)" /><input name="equipment" placeholder="Equipment (optional)" /><div className="form-actions"><button type="button" className="secondary-action" onClick={onCancel}>Cancel</button><button className="primary-action" type="submit">Save exercise</button></div></form></div>; }
function History({ sessions }: { sessions: TrainingSession[] }) { return <div className="stack">{sessions.map((session) => <article className="history-card" key={session.id}><strong><em>{categoryLabel(session.category)}</em>{formatSessionDate(session.startedAt)}</strong><span>Duration · {session.finishedAt ? `${Math.max(1, Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000))} min` : 'in progress'}</span></article>)}{sessions.length === 0 && <div className="empty-card">No completed sessions yet.</div>}</div>; }
