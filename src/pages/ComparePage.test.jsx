import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ComparePage from './ComparePage';
import * as api from '../api/dedup';

vi.mock('../api/dedup');

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/snapshots/snap1/dita/compare/5']}>
      <Routes>
        <Route path="/snapshots/:snapshotId/:module/compare/:groupId" element={<ComparePage />} />
      </Routes>
    </MemoryRouter>
  );

describe('ComparePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the group header and existing metadata cards, and Promote still calls promoteGroups unchanged', async () => {
    api.compareGroup.mockResolvedValue({
      group_id: 5,
      match_percentage: 100,
      match_type: 'exact',
      status: 'pending',
      can_decide: true,
      reference: { id: '1', path: 'ref.dita', sha256: 'abc' },
      duplicates: [{ id: '2', path: 'dup.dita', sha256: 'abc' }],
      diff: { identical: true },
      comparison: null,
    });
    api.promoteGroups.mockResolvedValue({ results: [{ group_id: 5, status: 'success' }] });

    renderPage();

    await waitFor(() => expect(screen.getByText(/DITA Group #5/)).toBeInTheDocument());
    expect(screen.getByText('ref.dita')).toBeInTheDocument();
    expect(screen.getByText('dup.dita')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Promote'));

    await waitFor(() => expect(api.promoteGroups).toHaveBeenCalledWith('snap1', 'dita', [5]));
  });

  it('shows the review-only notice (no Promote/Reject) when the group cannot be decided', async () => {
    api.compareGroup.mockResolvedValue({
      group_id: 5,
      match_percentage: 90,
      match_type: 'near',
      status: 'pending',
      can_decide: false,
      reference: { id: '1', path: 'ref.dita' },
      duplicates: [{ id: '2', path: 'dup.dita' }],
      diff: null,
      comparison: null,
    });

    renderPage();

    await waitFor(() => expect(screen.getByText(/review only/)).toBeInTheDocument());
    expect(screen.queryByText('Promote')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });

  it('renders a graceful fallback when no diff is available, without crashing', async () => {
    api.compareGroup.mockResolvedValue({
      group_id: 5,
      match_percentage: 90,
      match_type: 'near',
      status: 'pending',
      can_decide: false,
      reference: { id: '1', path: 'ref.dita' },
      duplicates: [{ id: '2', path: 'dup.dita' }],
      diff: null,
      comparison: null,
    });

    renderPage();
    await waitFor(() => expect(screen.getByText(/No diff available/)).toBeInTheDocument());
  });
});
