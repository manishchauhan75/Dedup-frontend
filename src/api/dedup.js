import axios from './axios';

const base = '/api/v1/dedup';

// Detection is the only call that runs the dedup engines. Everything below
// reads/writes DB state the detection call already persisted.
export const runDetection = (payload) => axios.post(`${base}/`, payload).then((r) => r.data);

export const listSnapshots = () => axios.get(`${base}/snapshots`).then((r) => r.data);

export const getAnalytics = (snapshotId) =>
  axios.get(`${base}/${snapshotId}/analytics`).then((r) => r.data);

export const getDuplicateGroups = (snapshotId, module) =>
  axios.get(`${base}/${snapshotId}/${module}/duplicate-groups`).then((r) => r.data);

// Read-only report: duplicate/near-duplicate content fragments (paragraphs,
// list items, tables, steps, notes, ...) across DITA topics, independent of
// whether the topics themselves are duplicates. No promote/reject workflow —
// this is purely for finding reuse candidates.
export const getDitaContentDuplicates = (snapshotId) =>
  axios.get(`${base}/${snapshotId}/dita/content-duplicates`).then((r) => r.data);

export const compareGroup = (snapshotId, module, groupId) =>
  axios.get(`${base}/${snapshotId}/${module}/compare/${groupId}`).then((r) => r.data);

// The expensive element/word-level diff is a separate, on-demand call —
// compareGroup() above only ever returns a cheap identical/unified_diff
// status, computed once per duplicate the user actually opens.
export const getDitaElementDiff = (snapshotId, groupId, duplicateId) =>
  axios
    .get(`${base}/${snapshotId}/dita/compare/${groupId}/element-diff`, { params: { duplicate_id: duplicateId } })
    .then((r) => r.data);

export const getDitaTopicContent = (snapshotId, topicId) =>
  axios.get(`${base}/${snapshotId}/dita/topics/${topicId}/content`).then((r) => r.data);

export const getImageVisualDiff = (snapshotId, groupId) =>
  axios.get(`${base}/${snapshotId}/images/compare/${groupId}/diff-image`).then((r) => r.data);

// Binary endpoints, built as plain URLs for direct <img src> use rather
// than routed through axios — derived from the same axios baseURL so this
// can't silently drift from the JSON API's origin.
export const buildImageFileUrl = (snapshotId, objectId, { thumbnail, max } = {}) => {
  const params = new URLSearchParams();
  if (thumbnail) params.set('thumbnail', 'true');
  if (max) params.set('max', String(max));
  const query = params.toString();
  return `${axios.defaults.baseURL}${base}/${snapshotId}/images/objects/${objectId}/file${query ? `?${query}` : ''}`;
};

// Promote/reject respond 200 with a per-group results array — a group
// failing the 100%-match rule is not an HTTP error, it's an item in
// `results` with status: "failed" and an error_code. Callers must inspect
// the array, not rely on try/catch, to report per-group outcomes.
export const promoteGroups = (snapshotId, module, groupIds) =>
  axios.post(`${base}/${snapshotId}/${module}/promote`, { group_ids: groupIds }).then((r) => r.data);

// Bulk: promotes every 100%-matched group for this snapshot+module in one
// call (no group_ids — the server finds them). Returns a summary
// (total/promoted/failed/skipped counts) plus the same per-group results
// array as promoteGroups, each group still applied independently.
export const promoteAllGroups = (snapshotId, module) =>
  axios.post(`${base}/${snapshotId}/${module}/promote-all`).then((r) => r.data);

export const rejectGroups = (snapshotId, module, groupIds) =>
  axios.post(`${base}/${snapshotId}/${module}/reject`, { group_ids: groupIds }).then((r) => r.data);

export const getActivity = (snapshotId, module) =>
  axios.get(`${base}/${snapshotId}/${module}/activity`).then((r) => r.data);

// group_ids omitted (or empty) archives every eligible (promoted) group's
// duplicate files for this snapshot+module (moved into archive_<module>/,
// never permanently deleted).
export const deleteGroups = (snapshotId, module, groupIds) =>
  axios
    .delete(`${base}/${snapshotId}/${module}/delete`, {
      data: groupIds && groupIds.length ? { group_ids: groupIds } : {},
    })
    .then((r) => r.data);
