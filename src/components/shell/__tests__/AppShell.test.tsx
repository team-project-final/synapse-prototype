import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppShell } from '../AppShell';

describe('AppShell', () => {
  it('renders children inside main region', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell>
          <div data-testid="content">콘텐츠</div>
        </AppShell>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders Sidebar with navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell>
          <div />
        </AppShell>
      </MemoryRouter>,
    );
    expect(screen.getByRole('navigation', { name: /주 메뉴/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /대시보드/ })).toBeInTheDocument();
  });

  it('renders AppBar with brand', () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AppShell>
          <div />
        </AppShell>
      </MemoryRouter>,
    );
    expect(screen.getByText('Synapse')).toBeInTheDocument();
  });
});
