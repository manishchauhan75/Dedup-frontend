import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { compareGroup, promoteGroups, rejectGroups } from '../api/dedup';
import StatusBadge from '../components/StatusBadge';
import MatchBadge from '../components/MatchBadge';
import Loader from '../components/Loader';
import DitaContentViewer from '../components/DitaContentViewer';
import DitaDiffViewer from '../components/DitaDiffViewer';
import ImagePreview from '../components/ImagePreview';
import ImageDiffViewer from '../components/ImageDiffViewer';

const MODULE_LABEL = { dita: 'DITA', images: 'Image' };

const EntityDetailCard = ({ label, entity, module, snapshotId }) => (
  <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
    <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">{label}</p>
    {entity ? (
      <div className="space-y-1 text-sm">
        <p className="text-white break-all font-medium">{entity.path || entity.id}</p>
        {entity.title && <p className="text-gray-400">Title: {entity.title}</p>}
        {entity.sha256 && <p className="text-gray-500 font-mono text-xs break-all">sha256: {entity.sha256}</p>}
        {(entity.width || entity.height) && (
          <p className="text-cyan-400">{entity.width || '?'} x {entity.height || '?'}</p>
        )}
        {entity.size_bytes != null && <p className="text-gray-400">{(entity.size_bytes / 1024).toFixed(1)} KB</p>}
        {entity.phash && <p className="text-gray-500 font-mono text-xs">phash: {entity.phash}</p>}

        {module === 'dita' && <DitaContentViewer snapshotId={snapshotId} topicId={entity.id} />}
        {module === 'images' && (
          <div className="mt-3">
            <ImagePreview snapshotId={snapshotId} objectId={entity.id} alt={entity.path} />
          </div>
        )}
      </div>
    ) : (
      <p className="text-gray-500 text-sm">N/A</p>
    )}
  </div>
);

const ComparePage = () => {
  const { snapshotId, module, groupId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchCompare = async () => {
    try {
      const result = await compareGroup(snapshotId, module, groupId);
      setData(result);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId, module, groupId]);

  const runAction = async (action) => {
    setBusy(true);
    try {
      const fn = action === 'promote' ? promoteGroups : rejectGroups;
      const result = await fn(snapshotId, module, [Number(groupId)]);
      result.results.forEach((r) => {
        if (r.status === 'success') toast.success(r.message || `Group ${r.group_id} ${action}d`);
        else toast.error(r.message || r.error_code);
      });
      fetchCompare();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action}`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button
          onClick={() => navigate(`/snapshots/${snapshotId}/${module}/groups`)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Duplicate Groups</span>
        </button>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex justify-between items-start flex-wrap gap-4">
          <div className="flex items-center space-x-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">
              {MODULE_LABEL[module]} Group #{data.group_id}
            </h1>
            <MatchBadge matchPercentage={data.match_percentage} matchType={data.match_type} />
            <StatusBadge status={data.status} />
          </div>
          {data.can_decide ? (
            <div className="flex items-center space-x-3">
              <button
                disabled={busy}
                onClick={() => runAction('promote')}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Promote</span>
              </button>
              <button
                disabled={busy}
                onClick={() => runAction('reject')}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          ) : (
            <span className="text-sm text-orange-400 bg-orange-500/10 px-4 py-2 rounded-lg">
              Only 100% matches can be promoted or rejected — review only
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EntityDetailCard label="Reference" entity={data.reference} module={module} snapshotId={snapshotId} />
          {data.duplicates.map((d) => (
            <EntityDetailCard key={d.id} label="Duplicate" entity={d} module={module} snapshotId={snapshotId} />
          ))}
        </div>

        {module === 'dita' && (
          <DitaDiffViewer
            snapshotId={snapshotId}
            groupId={groupId}
            cheapDiff={data.diff}
            duplicates={data.duplicates}
          />
        )}

        {module === 'images' && data.reference && data.duplicates.length > 0 && (
          <ImageDiffViewer
            snapshotId={snapshotId}
            groupId={groupId}
            reference={data.reference}
            duplicates={data.duplicates}
            matchType={data.match_type}
          />
        )}
      </div>
    </div>
  );
};

export default ComparePage;
