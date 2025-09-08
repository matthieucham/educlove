import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { describe, it, expect } from 'vitest';

describe('LoginPage', () => {
  it('renders the main heading', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/EducLove/i)).toBeInTheDocument();
  });

  it('renders the email input field', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Adresse email/i)).toBeInTheDocument();
  });

  it('renders the password input field', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
  });

  it('renders the login button', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  it('renders the link to the register page', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /Créer un compte/i })).toBeInTheDocument();
  });
});
