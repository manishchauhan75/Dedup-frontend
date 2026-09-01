import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DitaContentViewer from './DitaContentViewer';
import * as api from '../api/dedup';

vi.mock('../api/dedup');

describe('DitaContentViewer', () => {
  it('is collapsed by default and expands/collapses on click', async () => {
    api.getDitaTopicContent.mockResolvedValue({ content: '<concept><title>Hello world</title></concept>' });
    render(<DitaContentViewer snapshotId="s1" topicId="1" />);

    expect(screen.queryByText('Hide DITA Content')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('View DITA Content'));

    await waitFor(() => expect(screen.getByText('Hide DITA Content')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Hello world/)).toBeInTheDocument());

    fireEvent.click(screen.getByText('Hide DITA Content'));
    expect(screen.getByText('View DITA Content')).toBeInTheDocument();
  });

  it('renders XML content as safe text rather than executable markup', async () => {
    api.getDitaTopicContent.mockResolvedValue({
      content: '<concept><title><script>alert(1)</script></title></concept>',
    });
    const { container } = render(<DitaContentViewer snapshotId="s1" topicId="1" />);
    fireEvent.click(screen.getByText('View DITA Content'));

    await waitFor(() => expect(container.querySelector('script')).toBeNull());
    await waitFor(() => expect(container.textContent).toContain('script'));
    await waitFor(() => expect(container.textContent).toContain('alert(1)'));
  });

  it('shows a graceful error message when the fetch fails', async () => {
    api.getDitaTopicContent.mockRejectedValue({ response: { data: { detail: 'boom' } } });
    render(<DitaContentViewer snapshotId="s1" topicId="1" />);
    fireEvent.click(screen.getByText('View DITA Content'));
    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument());
  });
});
