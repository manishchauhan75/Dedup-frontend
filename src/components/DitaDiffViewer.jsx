import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDitaElementDiff } from '../api/dedup';

const diffLineClass = (line) => {
  if (line.startsWith('+++') || line.startsWith('---')) return 'text-gray-400';
  if (line.startsWith('+')) return 'text-green-400 bg-green-500/10';
  if (line.startsWith('-')) return 'text-red-400 bg-red-500/10';
  if (line.startsWith('@@')) return 'text-cyan-400';
  return 'text-gray-300';
};

const WordDiff = ({ segments }) => (
  <p className="text-sm font-mono leading-relaxed break-words">
    {segments.map((seg, i) => {
      const spacer = i > 0 ? ' ' : '';
      if (seg.type === 'added') {
        return (
          <span key={i}>
            {spacer}
            <span className="text-green-400 bg-green-500/10 rounded px-0.5">{seg.text}</span>
          </span>
        );
      }
      if (seg.type === 'removed') {
        return (
          <span key={i}>
            {spacer}
            <span className="text-red-400 bg-red-500/10 rounded px-0.5 line-through">{seg.text}</span>
          </span>
        );
      }
      return (
        <span key={i} className="text-gray-300">
          {spacer}
          {seg.text}
        </span>
      );
    })}
  </p>
);

const CHANGE_STYLES = {
  added: 'text-green-400 bg-green-500/5 border-green-500/30',
  removed: 'text-red-400 bg-red-500/5 border-red-500/30',
  modified: 'text-yellow-400 bg-yellow-500/5 border-yellow-500/30',
};

const ChangeItem = ({ change }) => {
  if (change.type === 'unchanged') return null;
  return (
    <div className={`rounded-lg border p-3 ${CHANGE_STYLES[change.type] || 'border-slate-700'}`}>
      <div className="flex items-center space-x-2 mb-1.5">
        <span className="text-xs uppercase tracking-wider font-semibold">{change.type}</span>
        <span className="text-xs text-gray-500 font-mono">&lt;{change.element}&gt;</span>
      </div>
      {change.type === 'modified' && change.word_diff ? (
        <WordDiff segments={change.word_diff} />
      ) : (
        <p className="text-sm font-mono text-gray-300 break-words">
          {change.type === 'removed' ? change.old_text : change.new_text}
        </p>
      )}
    </div>
  );
};

// cheapDiff: the eager, inexpensive `diff` field from compareGroup() —
// {identical: true} or {identical: false, unified_diff}. The full
// element/word-level diff is fetched lazily per duplicate via
// getDitaElementDiff(), only for the duplicates the user actually opens.
const DitaDiffViewer = ({ snapshotId, groupId, cheapDiff, duplicates }) => {
  const [openDuplicateId, setOpenDuplicateId] = useState(null);
  const [diffs, setDiffs] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [viewMode, setViewMode] = useState('element');

  const loadDiff = async (duplicateId) => {
    setLoadingId(duplicateId);
    try {
      const result = await getDitaElementDiff(snapshotId, groupId, duplicateId);
      setDiffs((prev) => ({ ...prev, [duplicateId]: result }));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load diff');
    } finally {
      setLoadingId(null);
    }
  };

  const toggleDiff = (duplicateId) => {
    if (openDuplicateId === duplicateId) {
      setOpenDuplicateId(null);
      return;
    }
    setOpenDuplicateId(duplicateId);
    if (!diffs[duplicateId]) loadDiff(duplicateId);
  };

  useEffect(() => {
    if (cheapDiff && !cheapDiff.identical && duplicates.length > 0) {
      const firstId = duplicates[0].id;
      setOpenDuplicateId(firstId);
      loadDiff(firstId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  if (!cheapDiff) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-sm text-gray-400">
        No diff available for this group — normalized content wasn't captured for one of these
        topics (re-run detection on this snapshot to enable diffing).
      </div>
    );
  }

  if (cheapDiff.identical) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <p className="text-sm text-green-400 font-medium">100.00% • exact — Exact duplicate, no differences found.</p>
      </div>
    );
  }

  if (cheapDiff.error) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-sm text-red-400">
        {cheapDiff.error}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-700">
        <h3 className="text-white font-semibold">Content Diff</h3>
      </div>
      <div className="p-4 space-y-3">
        {duplicates.map((d) => {
          const isOpen = openDuplicateId === d.id;
          const diff = diffs[d.id];
          return (
            <div key={d.id}>
              <button
                type="button"
                onClick={() => toggleDiff(d.id)}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span>
                  {isOpen ? 'Hide Diff' : 'View Diff'} — {d.path || d.id}
                </span>
              </button>

              {isOpen && (
                <div className="mt-2">
                  {loadingId === d.id && <p className="text-sm text-gray-400">Loading diff…</p>}

                  {diff && diff.identical && (
                    <p className="text-sm text-green-400">Exact duplicate — no differences found.</p>
                  )}

                  {diff && diff.error && <p className="text-sm text-red-400">{diff.error}</p>}

                  {diff && !diff.identical && !diff.error && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-green-500/10 text-green-400">Added: {diff.summary?.added ?? 0}</span>
                        <span className="px-2 py-1 rounded bg-red-500/10 text-red-400">Removed: {diff.summary?.removed ?? 0}</span>
                        <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">Modified: {diff.summary?.modified ?? 0}</span>
                        <span className="px-2 py-1 rounded bg-slate-700 text-gray-300">Unchanged: {diff.summary?.unchanged ?? 0}</span>
                      </div>

                      {diff.too_large && (
                        <p className="text-xs text-orange-400">
                          This topic is too large for an element-by-element diff — showing the unified text diff only.
                        </p>
                      )}

                      {!diff.too_large && (
                        <div className="flex items-center space-x-3 text-xs">
                          <button
                            type="button"
                            className={viewMode === 'element' ? 'text-cyan-400 font-medium' : 'text-gray-500 hover:text-gray-300'}
                            onClick={() => setViewMode('element')}
                          >
                            Element View
                          </button>
                          <button
                            type="button"
                            className={viewMode === 'unified' ? 'text-cyan-400 font-medium' : 'text-gray-500 hover:text-gray-300'}
                            onClick={() => setViewMode('unified')}
                          >
                            Unified Diff
                          </button>
                        </div>
                      )}

                      {viewMode === 'element' && !diff.too_large ? (
                        <div className="space-y-2">
                          {(diff.changes || []).filter((c) => c.type !== 'unchanged').map((c, i) => (
                            <ChangeItem key={i} change={c} />
                          ))}
                          {(diff.changes || []).every((c) => c.type === 'unchanged') && (
                            <p className="text-sm text-gray-400">No element-level changes detected.</p>
                          )}
                        </div>
                      ) : (
                        <pre className="text-xs font-mono overflow-x-auto max-h-96 bg-slate-950 rounded-lg p-3">
                          {(diff.unified_diff || '').split('\n').map((line, i) => (
                            <div key={i} className={diffLineClass(line)}>
                              {line || ' '}
                            </div>
                          ))}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DitaDiffViewer;
