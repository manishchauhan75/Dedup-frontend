import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCheck, CheckCircle, XCircle, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDuplicateGroups, promoteAllGroups, promoteGroups, dismissGroups, markReviewed } from '../api/dedup';
import StatusBadge from '../components/StatusBadge';
import MatchBadge from '../components/MatchBadge';
import TopicTypeBadge from '../components/TopicTypeBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Loader from '../components/Loader';

const MODULE_LABEL = { dita: 'DITA', images: 'Image' };

const DuplicateGroupsPage = () => {
  const { snapshotId, module } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [dismissTarget, setDismissTarget] = useState(null); // group_ids[] currently being dismissed

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

  // Promote/dismiss/review respond 200 with a per-group results array —
  // never a plain HTTP error for a business-rule failure like
  // PROMOTION_NOT_ALLOWED.
  const applyResults = (results) => {
    results.forEach((r) => {
      if (r.status === 'success') toast.success(`Group ${r.group_id}: ${r.message || 'success'}`);
      else toast.error(`Group ${r.group_id}: ${r.message || r.error_code}`);
    });
    fetchGroups();
    setSelected(new Set());
  };

  const runPromote = async (groupIds) => {
    if (groupIds.length === 0) return;
    setBusy(true);
    try {
      const data = await promoteGroups(snapshotId, module, groupIds);
      applyResults(data.results);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to promote');
    } finally {
      setBusy(false);
    }
  };

  const runMarkReviewed = async (groupIds) => {
    if (groupIds.length === 0) return;
    setBusy(true);
    try {
      const data = await markReviewed(snapshotId, module, groupIds);
      applyResults(data.results);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark reviewed');
    } finally {
      setBusy(false);
    }
  };

  const handleDismissConfirm = async (reason) => {
    const groupIds = dismissTarget;
    setBusy(true);
    try {
      const data = await dismissGroups(snapshotId, module, groupIds, reason);
      applyResults(data.results);
      setDismissTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to dismiss');
    } finally {
      setBusy(false);
    }
  };

  // Bulk promote — no selection needed, the server finds every 100%-matched
  // group itself. Distinct from runPromote(selected): that only ever
  // promotes what's checked here; this ignores selection entirely.
  const runPromoteAll = async () => {
    setBusy(true);
    try {
      const data = await promoteAllGroups(snapshotId, module);
      if (data.total_groups === 0) {
        toast('No 100% matched groups to promote.');
      } else {
        const extra = [
          data.skipped_count ? `${data.skipped_count} skipped` : null,
          data.failed_count ? `${data.failed_count} failed` : null,
        ].filter(Boolean).join(', ');
        toast.success(`Promoted ${data.promoted_count}/${data.total_groups} group(s)${extra ? ` (${extra})` : ''}`);
      }
      fetchGroups();
      setSelected(new Set());
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to promote all');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  const selectableGroups = groups.filter((g) => g.can_decide);
  const reviewableGroupIds = groups.filter((g) => g.available_actions?.includes('review')).map((g) => g.group_id);

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
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            {reviewableGroupIds.length > 0 && (
              <button
                disabled={busy}
                onClick={() => runMarkReviewed(reviewableGroupIds)}
                title="Marks every still-pending group as reviewed — an acknowledgment only, never promotes or dismisses anything"
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Mark All Reviewed ({reviewableGroupIds.length})</span>
              </button>
            )}
            {selectableGroups.length > 0 && (
              <>
                <button
                  disabled={busy}
                  onClick={runPromoteAll}
                  title="Promotes every 100%-matched pending/reviewed group for this snapshot+module in one call"
                  className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Promote All ({selectableGroups.length})</span>
                </button>
                <div className="flex items-center space-x-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
                  <span className="text-sm text-gray-400">{selected.size} selected</span>
                  <button
                    disabled={busy || selected.size === 0}
                    onClick={() => runPromote([...selected])}
                    className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Promote</span>
                  </button>
                  <button
                    disabled={busy || selected.size === 0}
                    onClick={() => setDismissTarget([...selected])}
                    className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <p className="text-gray-400">No duplicate groups found for this module.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              const actions = group.available_actions || [];
              return (
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
                    {actions.includes('promote') && (
                      <button
                        disabled={busy}
                        onClick={() => runPromote([group.group_id])}
                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        Promote
                      </button>
                    )}
                    {actions.includes('dismiss') && (
                      <button
                        disabled={busy}
                        onClick={() => setDismissTarget([group.group_id])}
                        className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                    {actions.includes('review') && (
                      <button
                        disabled={busy}
                        onClick={() => runMarkReviewed([group.group_id])}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Mark Reviewed</span>
                      </button>
                    )}
                    {actions.length === 0 && group.status === 'reviewed' && (
                      <span className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
                        Reviewed — below match threshold, no further action
                      </span>
                    )}
                  </div>
                </div>

                {actions.includes('review') && !actions.includes('promote') && (
                  <div className="px-6 py-2 bg-orange-500/10 border-b border-slate-700">
                    <span className="text-xs text-orange-400">Review only — below 100% match</span>
                  </div>
                )}

                {group.status === 'dismissed' && group.dismiss_reason && (
                  <div className="px-6 py-2 border-b border-slate-700 bg-red-500/5">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Dismissal Reason</p>
                    <p className="text-sm text-gray-300">{group.dismiss_reason}</p>
                  </div>
                )}

                <div className="px-6 py-3 border-b border-slate-700">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Reference</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white break-all font-medium">{group.reference_member?.path || 'N/A'}</p>
                    {module === 'dita' && <TopicTypeBadge topicType={group.reference_member?.topic_type} />}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">Duplicate</th>
                        {module === 'dita' && (
                          <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">Topic Type</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {group.members
                        .filter((m) => !m.is_reference)
                        .map((m) => (
                          <tr key={m.id} className="hover:bg-slate-700/50">
                            <td className="px-6 py-2 text-sm text-gray-300 break-all">{m.path || m.id}</td>
                            {module === 'dita' && (
                              <td className="px-6 py-2 text-sm">
                                <TopicTypeBadge topicType={m.topic_type} />
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={dismissTarget !== null}
        title={`Dismiss ${dismissTarget?.length > 1 ? `${dismissTarget.length} groups` : 'group'} with reason?`}
        message="This permanently marks the group(s) as dismissed — they will never be promoted or re-surfaced for decision. No file is moved, deleted, or modified."
        confirmLabel="Dismiss"
        loading={busy}
        reasonRequired
        reasonLabel="Dismissal reason (required)"
        reasonPlaceholder="e.g. These files are intentionally different and should not be treated as duplicates."
        onConfirm={handleDismissConfirm}
        onCancel={() => setDismissTarget(null)}
      />
    </div>
  );
};

export default DuplicateGroupsPage;
