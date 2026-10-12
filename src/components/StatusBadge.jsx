const STATUS_CONFIG = {
  // Duplicate-group status — reviewed is non-terminal (still awaiting
  // promote/dismiss), unlike promoted/dismissed/deleted.
  pending: { bg: 'bg-gray-500', text: 'Pending' },
  reviewed: { bg: 'bg-blue-500', text: 'Reviewed' },
  promoted: { bg: 'bg-green-500', text: 'Promoted' },
  dismissed: { bg: 'bg-red-500', text: 'Dismissed' },
  deleted: { bg: 'bg-slate-600', text: 'Archived' },
  // Activity status
  success: { bg: 'bg-green-500', text: 'Success' },
  failed: { bg: 'bg-red-500', text: 'Failed' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { bg: 'bg-gray-500', text: status || 'Unknown' };

  return (
    <span className={`${config.bg} text-white px-3 py-1 rounded-full text-sm font-medium`}>
      {config.text}
    </span>
  );
};

export default StatusBadge;
