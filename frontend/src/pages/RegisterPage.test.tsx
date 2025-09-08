import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { describe, it, expect } from 'vitest';

describe('RegisterPage', () => {
  it('renders the main heading', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Créer votre profil/i)).toBeInTheDocument();
  });

  it('renders all input fields', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/Prénom/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Matière enseignée/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Années d'expérience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Vous recherchez/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Photo de profil/i)).toBeInTheDocument();
  });

  it('renders the register button', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /S'inscrire/i })).toBeInTheDocument();
  });
});
