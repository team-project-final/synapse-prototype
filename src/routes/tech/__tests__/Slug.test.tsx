import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import TechSlug from '../Slug';
import * as manifestMod from '@/lib/tech-manifest';
import * as loaderMod from '@/lib/docs-loader';
import type { TechManifest } from '@/lib/tech-manifest';

const fakeManifest: TechManifest = {
  overview: { intro: '', diagramHtml: '', principles: [], tableMd: '' },
  techs: [
    {
      slug: 'flutter-3-x', title: 'Flutter', version: '3.x', layer: 'Client Layer',
      layerSlug: 'client', layerOrder: 1, techOrder: 1, summary: 'UI framework.',
      outline: [{ level: 4, text: 'Install', slug: 'install' }],
      originalSection: '2.1', chunkAnchor: '21-flutter-3x',
    },
  ],
  extras: { matrixSlug: null, auditSlug: null },
};

function renderAt(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/tech/${slug}`]}>
      <Routes>
        <Route path="/tech/:slug" element={<TechSlug />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TechSlug', () => {
  beforeEach(() => {
    vi.spyOn(manifestMod, 'loadTechManifest').mockResolvedValue(fakeManifest);
    vi.spyOn(loaderMod, 'loadDoc').mockResolvedValue('#### Install\n\nGuide.\n');
  });

  it('renders meta panel + article + sidebar entry', async () => {
    renderAt('flutter-3-x');
    await waitFor(() => screen.getByRole('heading', { level: 1, name: 'Flutter' }));
    expect(screen.getAllByText('Client Layer').length).toBeGreaterThan(0);
    expect(screen.getByText('UI framework.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Install').length).toBeGreaterThan(0));
  });

  it('shows fallback for unknown slug', async () => {
    renderAt('zzz');
    await waitFor(() =>
      expect(screen.getByText(/기술을 찾을 수 없습니다/)).toBeInTheDocument(),
    );
  });
});
