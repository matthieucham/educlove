import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyMatchesPage from './MyMatchesPage';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe('MyMatchesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setTimeout to execute immediately
    (globalThis as any).setTimeout = ((fn: Function) => fn()) as any;
  });

  afterEach(() => {
    // Restore original setTimeout
    (globalThis as any).setTimeout = setTimeout;
  });

  it('renders the list of matched profiles', () => {
    render(
      <MemoryRouter>
        <MyMatchesPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob/i)).toBeInTheDocument();
  });

  it('navigates to the profile page when "Voir profil" is clicked', () => {
    render(
      <MemoryRouter>
        <MyMatchesPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getAllByText(/Voir profil/i)[0]);
    expect(navigate).toHaveBeenCalledWith('/profile/1');
  });

  it('hides a profile when the hide button is clicked', () => {
    render(
      <MemoryRouter>
        <MyMatchesPage />
      </MemoryRouter>
    );
    
    // Profile is initially visible
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    
    // Click hide button
    const hideButton = screen.getAllByRole('button', { name: /hide/i })[0];
    fireEvent.click(hideButton);
    
    // Profile should now be hidden (setTimeout is mocked to execute immediately)
    expect(screen.queryByText(/Alice/i)).not.toBeInTheDocument();
  });

  it('unhides all profiles when the unhide all button is clicked', () => {
    render(
      <MemoryRouter>
        <MyMatchesPage />
      </MemoryRouter>
    );
    
    // Hide a profile first
    fireEvent.click(screen.getAllByRole('button', { name: /hide/i })[0]);
    
    // Verify profile is hidden
    expect(screen.queryByText(/Alice/i)).not.toBeInTheDocument();
    
    // Click unhide all button
    fireEvent.click(screen.getByRole('button', { name: /unhide all/i }));
    
    // Profile should be visible again
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
  });

  it('can hide and unhide multiple profiles', () => {
    render(
      <MemoryRouter>
        <MyMatchesPage />
      </MemoryRouter>
    );
    
    // Hide multiple profiles
    const hideButtons = screen.getAllByRole('button', { name: /hide/i });
    fireEvent.click(hideButtons[0]); // Hide Alice
    fireEvent.click(hideButtons[1]); // Hide Bob
    
    // Verify both profiles are hidden
    expect(screen.queryByText(/Alice/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bob/i)).not.toBeInTheDocument();
    
    // Unhide all profiles
    fireEvent.click(screen.getByRole('button', { name: /unhide all/i }));
    
    // Both profiles should be visible again
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob/i)).toBeInTheDocument();
  });
});
