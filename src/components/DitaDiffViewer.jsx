import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getDitaElementDiff } from '../api/dedup';
import DitaContentViewer from './DitaContentViewer';

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

const UnifiedDiffBlock = ({ unifiedDiff }) => (
  <pre className="text-xs font-mono overflow-x-auto max-h-[32rem] bg-slate-950 rounded-lg p-3">
    {(unifiedDiff || '').split('\n').map((line, i) => (
      <div key={i} className={diffLineClass(line)}>
        {line || ' '}
      </div>
    ))}
  </pre>
);

// One duplicate's full card — metadata + optional raw content + its diff
// vs the reference, all in one place (not split across a separate "compare"
// grid and a separate "diff" list elsewhere on the page). The diff itself
// is fetched and shown automatically, git-style (unified diff, red/green
// per line) by default, with an optional toggle to the structured
// element/word-level breakdown. No click is required to see the diff.
const DuplicateDiffPanel = ({ snapshotId, groupId, duplicate, skipDiff, skipMessage }) => {
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(!skipDiff);
  const [viewMode, setViewMode] = useState('unified');

  useEffect(() => {
    if (skipDiff) return undefined;
    let cancelled = false;
    setLoading(true);
    getDitaElementDiff(snapshotId, groupId, duplicate.id)
      .then((result) => {
        if (!cancelled) setDiff(result);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.response?.data?.detail || 'Failed to load diff');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId, groupId, duplicate.id, skipDiff]);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 space-y-1">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Duplicate</p>
        <p className="text-white break-all font-medium">{duplicate.path || duplicate.id}</p>
        {duplicate.title && <p className="text-gray-400 text-sm">Title: {duplicate.title}</p>}
        {duplicate.sha256 && <p className="text-gray-500 font-mono text-xs break-all">sha256: {duplicate.sha256}</p>}
        {duplicate.size_bytes != null && <p className="text-gray-400 text-sm">{(duplicate.size_bytes / 1024).toFixed(1)} KB</p>}
        <DitaContentViewer snapshotId={snapshotId} topicId={duplicate.id} />
      </div>
      <div className="p-4">
        {skipDiff && <p className="text-sm text-gray-400">{skipMessage}</p>}

        {!skipDiff && loading && <p className="text-sm text-gray-400">Loading diff…</p>}

        {!skipDiff && !loading && diff && diff.identical && (
          <p className="text-sm text-green-400">Exact duplicate — no differences found.</p>
        )}

        {!skipDiff && !loading && diff && diff.error && <p className="text-sm text-red-400">{diff.error}</p>}

        {!skipDiff && !loading && diff && !diff.identical && !diff.error && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-green-500/10 text-green-400">Added: {diff.summary?.added ?? 0}</span>
              <span className="px-2 py-1 rounded bg-red-500/10 text-red-400">Removed: {diff.summary?.removed ?? 0}</span>
              <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">Modified: {diff.summary?.modified ?? 0}</span>
              <span className="px-2 py-1 rounded bg-slate-700 text-gray-300">Unchanged: {diff.summary?.unchanged ?? 0}</span>

              {!diff.too_large && (
                <div className="ml-auto flex items-center space-x-3">
                  <button
                    type="button"
                    className={viewMode === 'unified' ? 'text-cyan-400 font-medium' : 'text-gray-500 hover:text-gray-300'}
                    onClick={() => setViewMode('unified')}
                  >
                    Unified Diff
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'element' ? 'text-cyan-400 font-medium' : 'text-gray-500 hover:text-gray-300'}
                    onClick={() => setViewMode('element')}
                  >
                    Element View
                  </button>
                </div>
              )}
            </div>

            {diff.too_large && (
              <p className="text-xs text-orange-400">
                This topic is too large for an element-by-element diff — showing the unified text diff only.
              </p>
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
              <UnifiedDiffBlock unifiedDiff={diff.unified_diff} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// cheapDiff: the eager, inexpensive `diff` field from compareGroup() —
// {identical: true} or {identical: false, unified_diff} or {error}. Since
// every duplicate in a group is diffed against the SAME reference, this
// group-wide check reliably predicts every pair's outcome — used to skip
// the expensive per-duplicate fetch entirely when we already cheaply know
// the answer (exact groups, or a reference whose content isn't diffable),
// while still always rendering every duplicate's metadata/content card.
const DitaDiffViewer = ({ snapshotId, groupId, cheapDiff, duplicates }) => {
  let skipDiff = false;
  let skipMessage = null;

  if (!cheapDiff) {
    skipDiff = true;
    skipMessage = 'No diff available — normalized content wasn\'t captured for this topic (re-run detection on this snapshot to enable diffing).';
  } else if (cheapDiff.identical) {
    skipDiff = true;
    skipMessage = 'Exact duplicate — no differences found.';
  } else if (cheapDiff.error) {
    skipDiff = true;
    skipMessage = cheapDiff.error;
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-700">
        <h3 className="text-white font-semibold">Content Diff</h3>
      </div>
      <div className="p-4 space-y-4">
        {duplicates.map((d) => (
          <DuplicateDiffPanel
            key={d.id}
            snapshotId={snapshotId}
            groupId={groupId}
            duplicate={d}
            skipDiff={skipDiff}
            skipMessage={skipMessage}
          />
        ))}
      </div>
    </div>
  );
};

export default DitaDiffViewer;
