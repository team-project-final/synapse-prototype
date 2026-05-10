import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TechPager } from '../TechPager';
import type { TechMeta } from '@/lib/tech-manifest';

const list: TechMeta[] = [
  { slug: 'a', title: 'A', version: null, layer: 'L', layerSlug: 'client',
    layerOrder: 1, techOrder: 1, summary: '', outline: [], originalSection: null, chunkAnchor: 'a' },
  { slug: 'b', title: 'B', version: null, layer: 'L', layerSlug: 'client',
    layerOrder: 1, techOrder: 2, summary: '', outline: [], originalSection: null, chunkAnchor: 'b' },
  { slug: 'c', title: 'C', version: null, layer: 'L2', layerSlug: 'gateway',
    layerOrder: 2, techOrder: 1, summary: '', outline: [], originalSection: null, chunkAnchor: 'c' },
];

describe('TechPager', () => {
  it('shows next only on first item', () => {
    render(
      <MemoryRouter>
        <TechPager techs={list} currentSlug="a" />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/← 이전/)).not.toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
  it('shows both prev and next in the middle, crossing layers', () => {
    render(
      <MemoryRouter>
        <TechPager techs={list} currentSlug="b" />
      </MemoryRouter>,
    );
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });
  it('shows prev only on last item', () => {
    render(
      <MemoryRouter>
        <TechPager techs={list} currentSlug="c" />
      </MemoryRouter>,
    );
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText(/다음 →/)).not.toBeInTheDocument();
  });
});
