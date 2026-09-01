import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDuplicateGroups, promoteGroups, rejectGroups } from '../api/dedup';
import StatusBadge from '../components/StatusBadge';
import MatchBadge from '../components/MatchBadge';
import Loader from '../components/Loader';

const MODULE_LABEL = { dita: 'DITA', images: 'Image' };

const DuplicateGroupsPage = () => {
  const { snapshotId, module } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);

  const fetchGroups = async () => {
    try {
      const data = await getDuplicateGroups(snapshotId, module);
      setGroups(data);
    } catch {
      toast.error('Failed to fetch duplicate groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchGroups();
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId, module]);

  const toggleSelect = (groupId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Promote/reject respond 200 with a per-group results array — never a
  // plain HTTP error for a business-rule rejection like PROMOTION_NOT_ALLOWED.
  const applyResults = (results) => {
    results.forEach((r) => {
      if (r.status === 'success') toast.success(`Group ${r.group_id}: ${r.message || 'success'}`);
      else toast.error(`Group ${r.group_id}: ${r.message || r.error_code}`);
    });
    fetchGroups();
    setSelected(new Set());
  };

  const runAction = async (action, groupIds) => {
    if (groupIds.length === 0) return;
    setBusy(true);
    try {
      const data = action === 'promote' ? await promoteGroups(snapshotId, module, groupIds) : await rejectGroups(snapshotId, module, groupIds);
      applyResults(data.results);
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${action}`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  const selectableGroups = groups.filter((g) => g.can_decide);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button
          onClick={() => navigate(`/snapshots/${snapshotId}`)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{MODULE_LABEL[module]} Duplicate Groups</h1>
            <p className="text-gray-400 mt-1">Snapshot: {snapshotId}</p>
          </div>
          {selectableGroups.length > 0 && (
            <div className="flex items-center space-x-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-400">{selected.size} selected</span>
              <button
                disabled={busy || selected.size === 0}
                onClick={() => runAction('promote', [...selected])}
                className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Promote</span>
              </button>
              <button
                disabled={busy || selected.size === 0}
                onClick={() => runAction('reject', [...selected])}
                className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </div>
          )}
        </div>

        {groups.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <p className="text-gray-400">No duplicate groups found for this module.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.group_id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-700 bg-slate-900/50 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center space-x-3">
                    {group.can_decide && (
                      <input
                        type="checkbox"
                        checked={selected.has(group.group_id)}
                        onChange={() => toggleSelect(group.group_id)}
                        className="w-4 h-4 text-blue-500 bg-slate-800 border-slate-700 rounded focus:ring-blue-500"
                      />
                    )}
                    <h3 className="text-lg font-semibold text-white">Group #{group.group_id}</h3>
                    <MatchBadge matchPercentage={group.match_percentage} matchType={group.match_type} />
                    <StatusBadge status={group.status} />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Link
                      to={`/snapshots/${snapshotId}/${module}/compare/${group.group_id}`}
                      className="flex items-center space-x-1 text-blue-500 hover:text-blue-400 text-sm font-medium"
                    >
                      <Search className="w-4 h-4" />
                      <span>Compare</span>
                    </Link>
                    {group.can_decide ? (
                      <>
                        <button
                          disabled={busy}
                          onClick={() => runAction('promote', [group.group_id])}
                          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                        >
                          Promote
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => runAction('reject', [group.group_id])}
                          className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      group.status === 'pending' && (
                        <span className="text-xs text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg">
                          Review only — below 100% match
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="px-6 py-3 border-b border-slate-700">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Reference</p>
                  <p className="text-white break-all font-medium">{group.reference_member?.path || 'N/A'}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">Duplicate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {group.members
                        .filter((m) => !m.is_reference)
                        .map((m) => (
                          <tr key={m.id} className="hover:bg-slate-700/50">
                            <td className="px-6 py-2 text-sm text-gray-300 break-all">{m.path || m.id}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateGroupsPage;
