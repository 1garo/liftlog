import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

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
});
