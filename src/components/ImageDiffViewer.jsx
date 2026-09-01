import { useState } from 'react';
import toast from 'react-hot-toast';
import ImagePreview from './ImagePreview';
import { getImageVisualDiff } from '../api/dedup';

// The existing image-similarity algorithm remains the sole source of truth
// for match_type/similarity — this component only ever renders whatever
// the backend already decided, plus an on-demand pixel-diff visualization.
const ImageDiffViewer = ({ snapshotId, groupId, reference, duplicates, matchType }) => {
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const firstDuplicate = duplicates[0];
  const isExactGroup = matchType === 'exact';

  const showDifference = async () => {
    if (shown) {
      setShown(false);
      return;
    }
    setShown(true);
    if (diff) return;
    setLoading(true);
    try {
      const result = await getImageVisualDiff(snapshotId, groupId);
      setDiff(result);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load visual diff');
      setShown(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-700">
        <h3 className="text-white font-semibold">Image Comparison</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Reference Image</p>
            <ImagePreview snapshotId={snapshotId} objectId={reference?.id} />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Duplicate Image</p>
            <ImagePreview snapshotId={snapshotId} objectId={firstDuplicate?.id} />
          </div>
        </div>

        {isExactGroup ? (
          <p className="text-sm text-green-400 font-medium">100% • exact — no visual differences found.</p>
        ) : (
          <div>
            <button type="button" onClick={showDifference} className="text-sm text-cyan-400 hover:text-cyan-300">
              {shown ? 'Hide Difference' : 'Show Difference'}
            </button>

            {shown && (
              <div className="mt-3">
                {loading && <p className="text-sm text-gray-400">Computing visual diff…</p>}
                {!loading && diff && diff.status === 'diff' && (
                  <div className="bg-slate-950 rounded-lg border border-slate-700 p-2">
                    <img
                      src={`data:image/png;base64,${diff.image_base64}`}
                      alt="Visual difference"
                      className="max-h-64 w-full object-contain mx-auto"
                    />
                  </div>
                )}
                {!loading && diff && diff.status === 'identical' && (
                  <p className="text-sm text-green-400">{diff.message || 'No visual differences found.'}</p>
                )}
                {!loading && diff && (diff.status === 'unsupported' || diff.status === 'dimensions_differ') && (
                  <p className="text-sm text-gray-400">{diff.message || 'Visual diff not available for this pair.'}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDiffViewer;
