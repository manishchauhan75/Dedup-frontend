import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImagePreview from './ImagePreview';

describe('ImagePreview', () => {
  it('renders a thumbnail image with the expected src', () => {
    render(<ImagePreview snapshotId="s1" objectId="obj1" alt="test image" />);
    const img = screen.getByAltText('test image');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/api/v1/dedup/s1/images/objects/obj1/file');
    expect(img.src).toContain('thumbnail=true');
  });

  it('shows a fallback message when identifiers are missing', () => {
    render(<ImagePreview snapshotId={null} objectId={null} />);
    expect(screen.getByText('No preview available')).toBeInTheDocument();
  });
});
