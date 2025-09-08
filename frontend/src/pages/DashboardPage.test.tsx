import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import { describe, it, expect, vi } from 'vitest';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

describe('DashboardPage', () => {
  it('renders the main heading', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
  });

  it('renders the tabs', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Messages/i)).toBeInTheDocument();
    expect(screen.getByText(/Matches/i)).toBeInTheDocument();
  });

  it('switches tabs when clicked', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Matches/i));
    expect(screen.getByText(/Matches/i).className).toContain('border-purple-500');
    fireEvent.click(screen.getByText(/Messages/i));
    expect(screen.getByText(/Messages/i).className).toContain('border-purple-500');
  });

  it('navigates to edit profile page when button is clicked', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Modifier le profil/i));
    expect(navigate).toHaveBeenCalledWith('/edit-profile');
  });
});
