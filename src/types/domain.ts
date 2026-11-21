export type SessionStatus = 'in_progress' | 'completed';
export type WorkoutCategory = 'strength' | 'cardio' | 'mobility' | 'other';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  isCustom: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingSession {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: SessionStatus;
  category?: WorkoutCategory;
  notes?: string;
}

export interface ExerciseEntry {
  id: string;
  sessionId: string;
  exerciseId: string;
  exerciseNameSnapshot: string;
  order: number;
  notes?: string;
}

export interface SetEntry {
  id: string;
  exerciseEntryId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
