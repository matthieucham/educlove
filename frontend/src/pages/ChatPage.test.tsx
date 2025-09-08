import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatPage from './ChatPage';
import { describe, it, expect, vi } from 'vitest';

describe('ChatPage', () => {
  it('renders the main heading', () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Chats/i)).toBeInTheDocument();
  });

  it('renders the list of chats', () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
    expect(screen.getByText(/Bob/i)).toBeInTheDocument();
  });

  it('calls alert when a chat is clicked', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText(/Alice/i));
    expect(alertSpy).toHaveBeenCalledWith('Opening chat with Alice');
    alertSpy.mockRestore();
  });
});
