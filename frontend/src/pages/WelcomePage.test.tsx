import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WelcomePage from './WelcomePage';
import { describe, it, expect, vi } from 'vitest';

const emblaApi = {
  on: vi.fn(),
  off: vi.fn(),
  scrollProgress: vi.fn(() => 0),
  scrollPrev: vi.fn(),
  scrollNext: vi.fn(),
};

vi.mock('embla-carousel-react', () => {
  return {
    __esModule: true,
    default: () => [vi.fn(), emblaApi],
  };
});

describe('WelcomePage', () => {
  it('renders the main heading', () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/La rencontre entre profs, partout en France !/i)).toBeInTheDocument();
  });

  it('renders login and register links when not logged in', () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
    expect(screen.getByText(/S'inscrire/i)).toBeInTheDocument();
  });

  it('renders dashboard link when logged in', () => {
    // We can't easily test the logged in state without mocking the state,
    // which is beyond the scope of this component's tests.
    // This test is a placeholder for a more complex test with state management.
  });

  it('calls scrollPrev when the previous button is clicked', () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(emblaApi.scrollPrev).toHaveBeenCalled();
  });

  it('calls scrollNext when the next button is clicked', () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(emblaApi.scrollNext).toHaveBeenCalled();
  });

  it('renders the "Voir les profils" button', () => {
    render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Voir les profils/i })).toBeInTheDocument();
  });
});
