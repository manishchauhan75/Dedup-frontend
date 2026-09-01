const STATUS_CONFIG = {
  // Duplicate-group status
  pending: { bg: 'bg-gray-500', text: 'Pending' },
  promoted: { bg: 'bg-green-500', text: 'Promoted' },
  rejected: { bg: 'bg-red-500', text: 'Rejected' },
  deleted: { bg: 'bg-slate-600', text: 'Deleted' },
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
