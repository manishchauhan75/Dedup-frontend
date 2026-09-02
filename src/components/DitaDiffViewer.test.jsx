import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DitaDiffViewer from './DitaDiffViewer';
import * as api from '../api/dedup';

vi.mock('../api/dedup');

const MODIFIED_DIFF = {
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
  unified_diff: '--- a\n+++ b\n@@ -1 +1 @@\n-Java 17\n+Java 21\n',
};

describe('DitaDiffViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the exact-duplicate message without fetching an element diff, but still shows the duplicate card', () => {
    render(
      <DitaDiffViewer snapshotId="s1" groupId="1" cheapDiff={{ identical: true }} duplicates={[{ id: '2', path: 'dup.dita', title: 'Comments' }]} />
    );
    expect(screen.getByText(/Exact duplicate/)).toBeInTheDocument();
    expect(screen.getByText('dup.dita')).toBeInTheDocument();
    expect(screen.getByText('Title: Comments')).toBeInTheDocument();
    expect(api.getDitaElementDiff).not.toHaveBeenCalled();
  });

  it('shows a fallback message when no diff is available, but still shows the duplicate card', () => {
    render(
      <DitaDiffViewer snapshotId="s1" groupId="1" cheapDiff={null} duplicates={[{ id: '2', path: 'dup.dita' }]} />
    );
    expect(screen.getByText(/No diff available/)).toBeInTheDocument();
    expect(screen.getByText('dup.dita')).toBeInTheDocument();
    expect(api.getDitaElementDiff).not.toHaveBeenCalled();
  });

  it('auto-loads and shows the git-style unified diff by default, with no click required', async () => {
    api.getDitaElementDiff.mockResolvedValue(MODIFIED_DIFF);

    render(
      <DitaDiffViewer
        snapshotId="s1"
        groupId="1"
        cheapDiff={{ identical: false, unified_diff: '...' }}
        duplicates={[{ id: '2', path: 'dup.dita' }]}
      />
    );

    // Fetched automatically - no button click needed anywhere in this flow.
    await waitFor(() => expect(api.getDitaElementDiff).toHaveBeenCalledWith('s1', '1', '2'));

    const removedLine = await screen.findByText('-Java 17');
    const addedLine = await screen.findByText('+Java 21');
    expect(removedLine.className).toContain('text-red-400');
    expect(addedLine.className).toContain('text-green-400');
  });

  it('auto-loads every duplicate in the group, not just the first', async () => {
    api.getDitaElementDiff.mockResolvedValue(MODIFIED_DIFF);

    render(
      <DitaDiffViewer
        snapshotId="s1"
        groupId="1"
        cheapDiff={{ identical: false, unified_diff: '...' }}
        duplicates={[{ id: '2', path: 'dup-a.dita' }, { id: '3', path: 'dup-b.dita' }]}
      />
    );

    await waitFor(() => expect(api.getDitaElementDiff).toHaveBeenCalledWith('s1', '1', '2'));
    await waitFor(() => expect(api.getDitaElementDiff).toHaveBeenCalledWith('s1', '1', '3'));
    expect(api.getDitaElementDiff).toHaveBeenCalledTimes(2);
  });

  it('switches to the element/word-diff view on toggle', async () => {
    api.getDitaElementDiff.mockResolvedValue(MODIFIED_DIFF);

    render(
      <DitaDiffViewer
        snapshotId="s1"
        groupId="1"
        cheapDiff={{ identical: false, unified_diff: '...' }}
        duplicates={[{ id: '2', path: 'dup.dita' }]}
      />
    );

    await screen.findByText('-Java 17');
    fireEvent.click(screen.getByText('Element View'));

    const removed = await screen.findByText('17');
    const added = await screen.findByText('21');
    expect(removed.className).toContain('line-through');
    expect(added.className).toContain('text-green-400');
  });
});
