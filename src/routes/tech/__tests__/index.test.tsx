import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import TechHub from '../index';
import * as manifestMod from '@/lib/tech-manifest';
import type { TechManifest } from '@/lib/tech-manifest';

const fakeManifest: TechManifest = {
  overview: {
    intro: 'Intro text',
    diagramHtml: '<figure class="mermaid-svg"><svg data-stub="hub"></svg></figure>',
    principles: [{ title: 'Production-ready', body: '운영 검증.' }],
    tableMd: '| L | T |\n|---|---|\n| Client | Flutter |',
  },
  techs: [
    {
      slug: 'flutter-3-x', title: 'Flutter', version: '3.x', layer: 'Client Layer',
      layerSlug: 'client', layerOrder: 1, techOrder: 1, summary: 'UI', outline: [],
      originalSection: '2.1', chunkAnchor: '21-flutter-3x',
    },
  ],
  extras: { matrixSlug: 'matrix', auditSlug: null },
};

describe('TechHub', () => {
  beforeEach(() => {
    vi.spyOn(manifestMod, 'loadTechManifest').mockResolvedValue(fakeManifest);
  });

  it('renders hero, diagram, principles, layer section, appendix', async () => {
    render(
      <MemoryRouter>
        <TechHub />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('heading', { level: 1, name: '기술 스택' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Client Layer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Flutter' })).toBeInTheDocument();
    expect(screen.getByText('Production-ready')).toBeInTheDocument();
    expect(document.querySelector('[data-stub="hub"]')).toBeInTheDocument();
    expect(screen.getByText('10. 기술 선택 요약 매트릭스')).toBeInTheDocument();
  });

  it('shows fallback message when manifest fetch fails', async () => {
    vi.spyOn(manifestMod, 'loadTechManifest').mockRejectedValueOnce(new Error('manifest 404 (404)'));
    render(
      <MemoryRouter>
        <TechHub />
      </MemoryRouter>,
    );
    await waitFor(() =>
      expect(screen.getByText(/기술 스택을 불러올 수 없습니다/)).toBeInTheDocument(),
    );
  });
});
