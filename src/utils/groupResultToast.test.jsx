import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import toast from 'react-hot-toast';
import { isPromotedNotArchived, toastGroupResult } from './groupResultToast';

vi.mock('react-hot-toast', () => {
  const fn = vi.fn();
  fn.success = vi.fn();
  fn.error = vi.fn();
  return { default: fn };
});

const renderContent = (mockFn) => render(mockFn.mock.calls[0][0]);

describe('toastGroupResult', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the global path and archived duplicate paths on a promoted+archived result', () => {
    toastGroupResult({
      group_id: 7408,
      status: 'success',
      error_code: null,
      message: 'Promoted and archived 3 original file(s)',
      global_path: 'global_topics/SBS-OP-102_comments.dita',
      archived_paths: [
        'archive_topics/SBS-Documentation/SBS-OP-123/SBS-OP-123_comments.dita',
        'archive_topics/SBS-Documentation/SBS-OP-136B/SBS-OP-136B_comments.dita',
      ],
    }, 'Group 7408: ');

    expect(toast.success).toHaveBeenCalledTimes(1);
    renderContent(toast.success);
    expect(screen.getByText('Group 7408: Promoted and archived 3 original file(s)')).toBeInTheDocument();
    expect(screen.getByText('global_topics/SBS-OP-102_comments.dita')).toBeInTheDocument();
    expect(screen.getByText('archive_topics/SBS-Documentation/SBS-OP-136B/SBS-OP-136B_comments.dita')).toBeInTheDocument();
  });

  it('warns (not plain success) when promoted but files were not archived', () => {
    const result = {
      group_id: 5,
      status: 'success',
      error_code: 'ARCHIVE_SKIPPED',
      message: 'Promoted, but original files were not archived: 1 reference rewrite(s) failed',
      global_path: 'global_topics/a.dita',
      archived_paths: [],
    };
    toastGroupResult(result);

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ icon: '⚠️' }));
    expect(isPromotedNotArchived(result)).toBe(true);
  });

  it('shows an error for a failed result, and plain results without paths still work', () => {
    toastGroupResult({ group_id: 9, status: 'failed', error_code: 'GROUP_NOT_FOUND', message: null });
    expect(toast.error).toHaveBeenCalledWith('GROUP_NOT_FOUND');

    toastGroupResult({ group_id: 9, status: 'success', message: 'Already reviewed' });
    renderContent(toast.success);
    expect(screen.getByText('Already reviewed')).toBeInTheDocument();
    expect(screen.queryByText(/Global:/)).not.toBeInTheDocument();
    expect(isPromotedNotArchived({ status: 'success', error_code: null })).toBe(false);
  });
});
