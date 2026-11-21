# Project: Strength Training Logbook

## 1. Project Overview

Build a simple, mobile-first web application for tracking personal strength training sessions.

The application is intended to work as a personal digital training logbook.

The user maintains a reusable exercise library containing exercises such as:
- Barbell Squat
- Deadlift
- Bench Press
- Overhead Press
- Barbell Row

When going to the gym, the user starts a new training session, selects the exercises they intend to perform, and records the weight and repetitions for each set.

Every session is stored independently, allowing the user to review previous training days and compare performance.

### Core principles

1. Fast data entry during training.
2. Mobile-first interface.
3. Local-first data storage.
4. No unnecessary complexity.
5. Historical records must remain accurate.
6. Incremental development with explicit user approval between milestones.

This is a personal tool, not a commercial fitness platform.

---

## 2. MVP Scope

### Included

- Reusable exercise library.
- Create, edit and delete exercises.
- Start a new training session.
- Select exercises for each session.
- Add exercises from previous sessions, e.g. auto-select deadlift and just just series and the weight used.
- Record multiple sets per exercise.
- Record weight in kilograms.
- Record repetitions.
- Mark individual sets as completed.
- Automatically save session progress.
- Display previous performance for each exercise.
- View training history.
- Inspect historical sessions.
- Mobile-responsive interface.
- Basic PWA support.
- A simple historical visualization of the progression on each exercise.

### Explicitly excluded

Do not implement these features in the MVP:

- Workout templates or predefined splits.
- User accounts.
- Cloud synchronization.
- Backend services.
- Social features.
- Nutrition tracking.
- AI-generated training plans.
- Wearable integrations.
- Advanced strength metrics.
- Rest timers.

The application should focus on recording and retrieving training information.

---

## 3. Technology Stack

Use a minimal and maintainable stack.

| Component | Technology |
|---|---|
| Language | TypeScript |
| Frontend | React |
| Build tooling | Vite |
| Styling | CSS or lightweight Tailwind |
| Persistence | IndexedDB |
| IndexedDB helper | idb |
| Testing | Vitest + React Testing Library |
| PWA | Vite PWA plugin |
| Hosting | Cloudflare Pages | Either start with something free or very cheap.

No backend is required.

Avoid unnecessary dependencies and abstractions.

Use TypeScript strict mode.

---

## 4. Domain Model

The application should have four primary entities.

### 4.1 Exercise

Represents a reusable exercise in the user's library.

Fields:
- id
- name
- muscleGroup (optional)
- equipment (optional)
- isCustom
- createdAt
- updatedAt

Examples:
- Barbell Squat
- Deadlift
- Bench Press
- Overhead Press

Exercise definitions are reusable across multiple training sessions.

Deleting an exercise must not destroy historical training records. Prefer soft deletion or an equivalent archival strategy.

### 4.2 TrainingSession

Represents one specific training day.

Fields:
- id
- startedAt
- finishedAt (optional)
- status (in_progress / completed)
- notes (optional)

A session does not need to be associated with a predefined routine.

The user decides which exercises to perform on each training day.

### 4.3 ExerciseEntry

Represents an exercise performed during a particular session.

Fields:
- id
- sessionId
- exerciseId
- exerciseNameSnapshot
- order
- notes (optional)

The exercise name snapshot ensures that historical records remain understandable even if the exercise is renamed later.

### 4.4 SetEntry

Represents an individual set performed during an exercise.

Fields:
- id
- exerciseEntryId
- setNumber
- weightKg
- reps
- completed
- createdAt
- updatedAt

Weight and repetitions must be editable independently for each set.

Use numeric values internally and validate inputs.

---

## 5. Core User Flows

### 5.1 Exercise Library

The user can:
- View all available exercises.
- Search exercises by name.
- Add custom exercises.
- Edit exercise details.
- Archive or delete exercises that are no longer used.

The library is the reusable foundation of the application.

Do not require the user to create workout templates.

### 5.2 Starting a Training Session

The user should be able to:

1. Open the application.
2. Select "Start Workout".
3. Create a new session with the current date and time.
4. Select exercises from the exercise library.
5. Optionally add exercises performed in a previous session.

The application should also provide a convenient way to repeat the exercise selection from the previous session.

This should only copy the exercise selection, not overwrite or modify historical records.

### 5.3 Active Training Session

This is the most important screen in the application.

Each selected exercise should display:

- Exercise name.
- Previous performance.
- Current sets.
- Weight input.
- Repetition input.
- Set completion control.
- Add set action.
- Remove set action.

Requirements:

- Inputs must be comfortable to use on a phone.
- Minimize unnecessary navigation.
- Allow independent weight and repetition editing.
- Automatically persist changes.
- Allow adding exercises during an active session.
- Allow reordering exercises.
- Allow adding and removing sets.
- Allow finishing a workout explicitly.
- Preserve an unfinished session after application reload.

Previous performance should be displayed as a reference.

Do not automatically assume the user will repeat previous weights or repetitions. The current session must have its own independent set entries.

After a session would be nice to compare with the previous session.

### 5.4 Previous Performance

When an exercise is selected, retrieve its most recent completed performance.

Example:

Deadlift

Previous session:
- Set 1: 100 kg × 5
- Set 2: 100 kg × 5
- Set 3: 100 kg × 4

Display this information without changing current session data.

Previous performance should be based on the latest completed session containing that exercise, not necessarily the immediately preceding training day.

This should be light information tho, just so you can understand what happened previously, since sure the focus is on the current session.

### 5.5 Workout History

Display completed training sessions chronologically.

Each session should show:
- Date.
- Duration when available.
- Number of exercises.
- Exercises performed.
- Sets, weights and repetitions.

Allow opening an individual session to inspect its full details.

Historical sessions should be read-only in the MVP unless an explicit editing feature is later approved.

### 5.6 Session Persistence

An unfinished session must survive:
- Browser refresh.
- Closing and reopening the application.
- Temporary loss of internet connectivity.

The application should prevent accidental creation of multiple simultaneous active sessions.

For the MVP, allow one active session at a time.

---

## 6. UX and Interface Requirements

The application is primarily intended for use inside a gym.

### Design principles

- Mobile-first.
- Large touch targets.
- High contrast.
- Minimal navigation.
- Minimal typing.
- No unnecessary animations.
- Focus on fast data entry.

### Suggested navigation

- Home
- Start Workout
- Exercise Library
- History

### Home screen

Display:
- Start workout action.
- Active session, if one exists.
- Recent sessions.
- Quick access to exercise library.

### Active workout screen

Prioritize:
- Exercise selection.
- Set recording.
- Previous performance.
- Session completion.

Avoid unnecessary dashboard elements.

---

## 7. Local Storage and Data Safety

Use IndexedDB as the primary storage mechanism.

Requirements:

- No authentication.
- No remote database.
- No network dependency for recording workouts.
- Database schema must support future migrations.
- Storage operations must be separated from UI components.
- Implement JSON export and import.
- Validate imported data before modifying existing records.

Important:

The user's workout history is valuable personal data. Avoid destructive operations and provide a simple backup mechanism.

The application should not depend on localStorage as its primary database.

---

## 8. Architecture and Suggested Folder Structure

Start with a straightforward architecture.

Suggested structure:

    src/
      app/
        App.tsx
      components/
        ExerciseCard.tsx
        SetRow.tsx
        WorkoutHeader.tsx
      features/
        exercises/
          components/
          services/
        sessions/
          components/
          services/
        history/
          components/
          services/
      storage/
        database.ts
        repositories/
          exerciseRepository.ts
          sessionRepository.ts
      types/
        index.ts
      styles/
      main.tsx

This is a suggested structure, not a requirement to create every file immediately.

Keep domain logic independent of React components.

Avoid premature abstractions.

---

## 9. Development Milestones

IMPORTANT: Implement only one milestone at a time.

At the end of each milestone, stop and wait for explicit user approval before continuing.

### Milestone 1 — Project Foundation

Tasks:
- Initialize React + TypeScript + Vite.
- Configure basic styling.
- Create application shell.
- Implement basic navigation.
- Define core domain types.
- Set up IndexedDB.
- Implement database initialization.
- Add basic storage tests.

Acceptance criteria:
- Application runs locally.
- Navigation works.
- Database initializes successfully.
- TypeScript strict mode is enabled.
- Project structure is understandable.
- Basic tests pass.

STOP HERE.

Do not implement exercise or session functionality.

### Milestone 2 — Exercise Library

Tasks:
- Implement exercise repository.
- Display exercise catalog.
- Add custom exercises.
- Edit exercise information.
- Archive or delete exercises.
- Implement exercise search.

Acceptance criteria:
- User can create and manage exercises.
- Exercises persist after refresh.
- Archived exercises do not appear in the default selection list.
- Historical references are not destroyed.
- Repository tests cover basic CRUD operations.

STOP HERE.

### Milestone 3 — Training Sessions and Set Recording

Tasks:
- Create a new training session.
- Select exercises from the library.
- Add exercises to an active session.
- Add and remove sets.
- Record weight and repetitions.
- Mark sets as completed.
- Reorder exercises.
- Automatically save changes.
- Finish a session.

Acceptance criteria:
- User can start and complete a training session.
- Multiple exercises can be recorded.
- Each exercise can have multiple independent sets.
- Data survives page refresh.
- Finishing a session preserves all recorded information.
- Previous sessions are not modified by new sessions.
- Only one active session exists at a time.

STOP HERE.

### Milestone 4 — History and Previous Performance

Tasks:
- Implement training history.
- Display completed sessions chronologically.
- Show session details.
- Retrieve previous performance for each exercise.
- Display previous performance during active sessions.
- Allow copying exercise selections from the previous session.
- Implement JSON export and import.

Acceptance criteria:
- Previous performance is retrieved correctly.
- Historical sessions remain independent.
- Copying exercises does not duplicate historical set records.
- Export and import preserve session information.
- Tests cover historical retrieval and backup operations.

STOP HERE.

### Milestone 5 — Mobile Experience and Deployment

Tasks:
- Refine responsive layout.
- Improve touch interactions.
- Configure PWA manifest.
- Configure service worker.
- Verify offline application functionality.
- Test installation on iPhone.
- Deploy using Cloudflare Pages.

Acceptance criteria:
- Application is accessible through HTTPS.
- Application can be installed on iPhone through Safari.
- Application shell loads offline after initial setup.
- Workout recording works without an internet connection.
- Data persists after closing and reopening the application.
- Manual testing on an actual phone is completed.

STOP HERE.

MVP COMPLETE.

---

## 10. Quality Requirements

- Use TypeScript strict mode.
- Avoid `any` unless justified.
- Keep domain logic separate from UI.
- Validate weight and repetition inputs.
- Use stable identifiers.
- Use consistent timestamps.
- Handle IndexedDB errors gracefully.
- Write tests for important domain and persistence operations.
- Avoid unnecessary dependencies.
- Do not introduce additional functionality without approval.

---

## 11. Future Improvements (Out of Scope)

Potential future improvements:
- Strength progression charts.
- Personal records.
- Training volume statistics.
- Rest timer.
- Exercise categories and filters.
- Cloud synchronization.
- Multiple device synchronization.
- More detailed training metrics.

Do not implement these during the MVP.

---

# Instructions for Codex

You are assisting with an incremental software engineering project.

Read this entire PROJECT.md before making any changes.

The user wants to understand and own the implementation. Your role is to assist with engineering decisions, not generate an entire application in one operation.

Rules:

1. Never implement the entire project at once.
2. Only implement the milestone explicitly requested.
3. Before coding, inspect the existing repository.
4. Explain your proposed implementation before modifying files.
5. Keep changes limited to the current milestone.
6. Run relevant tests.
7. Explain architectural decisions and trade-offs.
8. Do not introduce unrequested functionality.
9. Ask questions when an architectural decision is ambiguous.
10. Never proceed to the next milestone without explicit approval.

At the end of each milestone, report:

- What was implemented.
- Files created or modified.
- Important architectural decisions.
- Tests executed and results.
- Known limitations.
- Manual verification instructions.
- Confirmation that you have stopped.

Start with Milestone 1 only.

Do not proceed to Milestone 2 automatically.
