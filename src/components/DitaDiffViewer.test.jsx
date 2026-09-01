import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DitaDiffViewer from './DitaDiffViewer';
import * as api from '../api/dedup';

vi.mock('../api/dedup');

describe('DitaDiffViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the exact-duplicate message without fetching an element diff', () => {
    render(
      <DitaDiffViewer snapshotId="s1" groupId="1" cheapDiff={{ identical: true }} duplicates={[{ id: '2', path: 'dup.dita' }]} />
    );
    expect(screen.getByText(/Exact duplicate/)).toBeInTheDocument();
    expect(api.getDitaElementDiff).not.toHaveBeenCalled();
  });

  it('shows a fallback message when no diff is available', () => {
    render(<DitaDiffViewer snapshotId="s1" groupId="1" cheapDiff={null} duplicates={[]} />);
    expect(screen.getByText(/No diff available/)).toBeInTheDocument();
  });

  it('auto-loads and renders added/removed word-diff highlighting for the first duplicate', async () => {
    api.getDitaElementDiff.mockResolvedValue({
      identical: false,
      summary: { added: 0, removed: 0, modified: 1, unchanged: 0 },
      changes: [
        {
          type: 'modified',
          element: 'p',
          old_text: 'Java 17',
          new_text: 'Java 21',
          word_diff: [
            { type: 'unchanged', text: 'Java' },
            { type: 'removed', text: '17' },
            { type: 'added', text: '21' },
          ],
        },
      ],
      unified_diff: '--- a\n+++ b\n',
    });

    render(
      <DitaDiffViewer
        snapshotId="s1"
        groupId="1"
        cheapDiff={{ identical: false, unified_diff: '...' }}
        duplicates={[{ id: '2', path: 'dup.dita' }]}
      />
    );

    await waitFor(() => expect(api.getDitaElementDiff).toHaveBeenCalledWith('s1', '1', '2'));

    const removed = await screen.findByText('17');
    const added = await screen.findByText('21');
    expect(removed.className).toContain('line-through');
    expect(added.className).toContain('text-green-400');
  });
});
