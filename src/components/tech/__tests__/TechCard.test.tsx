import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TechCard } from '../TechCard';
import type { TechMeta } from '@/lib/tech-manifest';

const t: TechMeta = {
  slug: 'flutter-3-x',
  title: 'Flutter',
  version: '3.x',
  layer: 'Client Layer',
  layerSlug: 'client',
  layerOrder: 1,
  techOrder: 1,
  summary: '크로스플랫폼 UI 프레임워크.',
  outline: [],
  originalSection: '2.1',
  chunkAnchor: '21-flutter-3x',
};

describe('TechCard', () => {
  it('renders title, version badge, summary', () => {
    render(
      <MemoryRouter>
        <TechCard tech={t} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Flutter' })).toBeInTheDocument();
    expect(screen.getByText('3.x')).toBeInTheDocument();
    expect(screen.getByText('크로스플랫폼 UI 프레임워크.')).toBeInTheDocument();
  });

  it('omits version badge when version is null', () => {
    render(
      <MemoryRouter>
        <TechCard tech={{ ...t, version: null }} />
      </MemoryRouter>,
    );
    expect(screen.queryByText('3.x')).not.toBeInTheDocument();
  });

  it('applies layer color to the accent bar via inline style', () => {
    const { container } = render(
      <MemoryRouter>
        <TechCard tech={t} />
      </MemoryRouter>,
    );
    const link = container.querySelector('a')!;
    expect(link.getAttribute('style')).toContain('var(--tech-client)');
  });

  it('links to /tech/<slug>', () => {
    render(
      <MemoryRouter>
        <TechCard tech={t} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link').getAttribute('href')).toBe('/tech/flutter-3-x');
  });
});
