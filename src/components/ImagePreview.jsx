import { useState } from 'react';
import { X } from 'lucide-react';
import { buildImageFileUrl } from '../api/dedup';

// Bounded thumbnail (preserves aspect ratio, never breaks page layout);
// click opens a full-size lightbox modeled directly on ConfirmDialog's
// existing fixed-overlay pattern — no new dependency.
const ImagePreview = ({ snapshotId, objectId, alt = 'preview' }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!snapshotId || !objectId) {
    return <p className="text-gray-500 text-sm">No preview available</p>;
  }
  if (failed) {
    return <p className="text-gray-500 text-sm">Preview unavailable</p>;
  }

  const thumbUrl = buildImageFileUrl(snapshotId, objectId, { thumbnail: true, max: 400 });
  const fullUrl = buildImageFileUrl(snapshotId, objectId);

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="block w-full bg-slate-950 rounded-lg border border-slate-700 p-2 hover:border-cyan-500/50 transition-colors"
      >
        <img
          src={thumbUrl}
          alt={alt}
          className="max-h-48 w-full object-contain mx-auto"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </button>

      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={fullUrl}
            alt={alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ImagePreview;
