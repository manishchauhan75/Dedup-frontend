import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getActivity, deleteGroups } from '../api/dedup';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';
import { formatDate } from '../utils/formatters';

const MODULE_LABEL = { dita: 'DITA', images: 'Image' };

const ACTION_LABEL = {
  promote: 'Promoted',
  reject: 'Rejected',
  reference_update: 'Reference Updated',
  delete: 'Deleted',
};

const SummaryPill = ({ label, value, color }) => (
  <div className="bg-slate-800 rounded-lg border border-slate-700 px-4 py-3 text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-gray-400 text-xs mt-1">{label}</p>
  </div>
);

const ActivityPage = () => {
  const { snapshotId, module } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchActivity = async () => {
    try {
      const result = await getActivity(snapshotId, module);
      setData(result);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fetch activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId, module]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteGroups(snapshotId, module, null);
      if (result.deleted_count === 0 && result.failed_count === 0) {
        toast('Nothing eligible to delete right now.');
      } else {
        toast.success(`Deleted ${result.deleted_count} file(s)${result.failed_count ? `, ${result.failed_count} failed` : ''}`);
      }
      setConfirmOpen(false);
      fetchActivity();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Loader />;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button
          onClick={() => navigate(`/snapshots/${snapshotId}`)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{MODULE_LABEL[module]} Activity</h1>
            <p className="text-gray-400 mt-1">Snapshot: {snapshotId}</p>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!data.summary.promoted}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white px-4 py-2 rounded-lg transition-colors"
            title={!data.summary.promoted ? 'No promoted groups eligible for deletion' : undefined}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Superseded Files</span>
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <SummaryPill label="Total Groups" value={data.summary.total_groups} color="text-white" />
          <SummaryPill label="Promoted" value={data.summary.promoted} color="text-green-400" />
          <SummaryPill label="Rejected" value={data.summary.rejected} color="text-red-400" />
          <SummaryPill label="Deleted" value={data.summary.deleted} color="text-slate-400" />
          <SummaryPill label="Pending" value={data.summary.pending} color="text-yellow-400" />
          <SummaryPill label="Remaining" value={data.summary.remaining} color="text-pink-400" />
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto max-h-[32rem]">
            <table className="w-full">
              <thead className="bg-slate-900 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data.activity.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      No activity recorded yet for this module.
                    </td>
                  </tr>
                )}
                {data.activity.map((entry) => (
                  <tr key={entry.activity_id} className="hover:bg-slate-700/50">
                    <td className="px-6 py-3 text-sm text-white font-medium">{ACTION_LABEL[entry.action] || entry.action}</td>
                    <td className="px-6 py-3 text-sm text-gray-300">{entry.group_id ?? 'N/A'}</td>
                    <td className="px-6 py-3 text-sm text-gray-300 break-all max-w-xs">{entry.source_path || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-300 break-all max-w-xs">{entry.destination_path || '—'}</td>
                    <td className="px-6 py-3 text-sm">
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400 whitespace-nowrap">{formatDate(entry.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete superseded files?"
        message={`This physically removes every non-reference file from ${MODULE_LABEL[module].toLowerCase()} groups already promoted for this snapshot. The promoted (reference) copy is never touched. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default ActivityPage;
