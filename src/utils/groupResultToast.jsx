import toast from 'react-hot-toast';

const MAX_LISTED_PATHS = 5;

// One toast per item of a promote/dismiss/review `results` array.
// Promotion also archives the group's original files, so a promote result
// can be "success" with error_code ARCHIVE_SKIPPED/ARCHIVE_FAILED: the
// master was promoted but its original files were not (all) archived -
// shown as a warning, not a plain success. Promote results also carry
// global_path and archived_paths (workspace-relative), listed here.
export const toastGroupResult = (r, prefix = '') => {
  if (r.status !== 'success') {
    toast.error(`${prefix}${r.message || r.error_code}`);
    return;
  }

  const archived = r.archived_paths || [];
  const content = (
    <div className="text-sm">
      <p>{`${prefix}${r.message || 'success'}`}</p>
      {r.global_path && (
        <p className="mt-1 break-all">
          <span className="font-semibold">Global:</span> {r.global_path}
        </p>
      )}
      {archived.length > 0 && (
        <div className="mt-1">
          <p className="font-semibold">Archived duplicates:</p>
          <ul className="list-disc pl-4 break-all">
            {archived.slice(0, MAX_LISTED_PATHS).map((p) => <li key={p}>{p}</li>)}
          </ul>
          {archived.length > MAX_LISTED_PATHS && <p>…and {archived.length - MAX_LISTED_PATHS} more</p>}
        </div>
      )}
    </div>
  );

  if (r.error_code) toast(content, { icon: '⚠️', duration: 8000 });
  else toast.success(content, { duration: r.global_path ? 6000 : undefined });
};

// Promoted, but the original files were not (all) archived.
export const isPromotedNotArchived = (r) => r.status === 'success' && Boolean(r.error_code);
