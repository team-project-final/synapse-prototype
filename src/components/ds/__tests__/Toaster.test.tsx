import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Toaster, toast } from '../Toaster';

describe('Toaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('shows a toast added via toast() and removes after duration', () => {
    render(<Toaster />);
    act(() => {
      toast({ message: '저장됨', tone: 'success', duration: 1500 });
    });
    expect(screen.getByText('저장됨')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(screen.queryByText('저장됨')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
