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
// whether the topics themselves are duplicates. No promote/dismiss workflow —
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

// Promote/dismiss respond 200 with a per-group results array — a group
// failing the 100%-match rule is not an HTTP error, it's an item in
// `results` with status: "failed" and an error_code. Callers must inspect
// the array, not rely on try/catch, to report per-group outcomes.
//
// Promotion also archives the group's original files (master and
// duplicates) into archive_<module>/ once every reference points at the
// global copy; the group then ends "archived". A promote result can be
// "success" with error_code ARCHIVE_SKIPPED/ARCHIVE_FAILED (promoted, files
// not (all) archived). Each promote result carries global_path and
// archived_paths, both relative to the workspace.
export const promoteGroups = (snapshotId, module, groupIds) =>
  axios.post(`${base}/${snapshotId}/${module}/promote`, { group_ids: groupIds }).then((r) => r.data);

// Bulk: promotes every 100%-matched group for this snapshot+module in one
// call (no group_ids — the server finds them). Returns a summary
// (total/promoted/failed/skipped counts) plus the same per-group results
// array as promoteGroups, each group still applied independently.
export const promoteAllGroups = (snapshotId, module) =>
  axios.post(`${base}/${snapshotId}/${module}/promote-all`).then((r) => r.data);

// "Dismiss with Reason" — requires a reason, persisted as
// DuplicateGroup.dismiss_reason and on the activity log entry. Terminal
// status is "dismissed" (renamed from "rejected"); URL renamed from
// /reject to /dismiss to match.
export const dismissGroups = (snapshotId, module, groupIds, reason) =>
  axios.post(`${base}/${snapshotId}/${module}/dismiss`, { group_ids: groupIds, reason }).then((r) => r.data);

// "Mark as Reviewed" — a non-terminal acknowledgment checkpoint. Never
// touches a file; a reviewed group remains fully eligible for promote/
// dismiss afterward, same as a pending one.
export const markReviewed = (snapshotId, module, groupIds) =>
  axios.post(`${base}/${snapshotId}/${module}/review`, { group_ids: groupIds }).then((r) => r.data);

export const getActivity = (snapshotId, module) =>
  axios.get(`${base}/${snapshotId}/${module}/activity`).then((r) => r.data);

// Downloads everything in archive_<module>/ (every file promotion has ever
// archived into it) as a ZIP and saves it in the browser. Read-only on
// the server — nothing is moved or deleted. The archive folder belongs to
// the workspace, not one snapshot_id, so this also includes anything
// archived there under a different snapshot sharing the same
// workspace_path. Resolves with the saved filename.
export const downloadArchive = async (snapshotId, module) => {
  let response;
  try {
    response = await axios.get(`${base}/${snapshotId}/${module}/archive/download`, { responseType: 'blob' });
  } catch (error) {
    // With responseType 'blob' an error body arrives as a Blob too — parse
    // it back to JSON so callers can read error.response.data.detail as usual.
    const data = error.response?.data;
    if (data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await data.text());
      } catch {
        // Not JSON - leave as-is; callers fall back to a generic message.
      }
    }
    throw error;
  }

  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : `archive_${module}_${snapshotId}.zip`;

  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return filename;
};
