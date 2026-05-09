import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WikilinkAutocomplete } from '../WikilinkAutocomplete';

const candidates = [
  { id: '1', title: '과적합' },
  { id: '2', title: '정규화' },
  { id: '3', title: '경사하강법' },
];

describe('WikilinkAutocomplete', () => {
  it('shows candidates filtered by query', () => {
    render(<WikilinkAutocomplete query="과" candidates={candidates} onSelect={() => {}} />);
    expect(screen.getByText('📄 과적합')).toBeInTheDocument();
    expect(screen.queryByText('📄 정규화')).not.toBeInTheDocument();
  });

  it('calls onSelect when item clicked', async () => {
    const onSelect = vi.fn();
    render(<WikilinkAutocomplete query="과" candidates={candidates} onSelect={onSelect} />);
    await userEvent.click(screen.getByText('📄 과적합'));
    expect(onSelect).toHaveBeenCalledWith('과적합');
  });

  it('shows "+ 새 노트로 만들기" when query has no exact match', () => {
    render(
      <WikilinkAutocomplete query="없는제목" candidates={candidates} onSelect={() => {}} />,
    );
    expect(screen.getByText(/새 노트로 만들기/)).toBeInTheDocument();
  });
});
