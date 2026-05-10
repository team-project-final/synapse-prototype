import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TechSidebar } from '../TechSidebar';
import type { TechMeta } from '@/lib/tech-manifest';

const techs: TechMeta[] = [
  {
    slug: 'flutter-3-x', title: 'Flutter', version: '3.x', layer: 'Client Layer',
    layerSlug: 'client', layerOrder: 1, techOrder: 1, summary: '', outline: [],
    originalSection: '2.1', chunkAnchor: 'a',
  },
  {
    slug: 'dart-3-x', title: 'Dart', version: '3.x', layer: 'Client Layer',
    layerSlug: 'client', layerOrder: 1, techOrder: 2, summary: '', outline: [],
    originalSection: '2.2', chunkAnchor: 'b',
  },
];

describe('TechSidebar', () => {
  it('renders layer header + tech links', () => {
    render(
      <MemoryRouter>
        <TechSidebar techs={techs} currentSlug="flutter-3-x" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Client Layer')).toBeInTheDocument();
    expect(screen.getByText('Flutter')).toBeInTheDocument();
    expect(screen.getByText('Dart')).toBeInTheDocument();
  });
  it('marks current item with aria-current', () => {
    render(
      <MemoryRouter>
        <TechSidebar techs={techs} currentSlug="dart-3-x" />
      </MemoryRouter>,
    );
    const current = screen.getByText('Dart').closest('a')!;
    expect(current.getAttribute('aria-current')).toBe('page');
  });
});
