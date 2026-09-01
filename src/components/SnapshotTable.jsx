import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { formatDate } from '../utils/formatters';

// Replaces JobTable.jsx — fed by GET /api/v1/dedup/snapshots instead of the
// old GET /v1/jobs job list.
const SnapshotTable = ({ snapshots }) => {
  const navigate = useNavigate();

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
        <p className="text-gray-400">No snapshots yet. Run detection above to create one.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Snapshot ID</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Workspace Path</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Detected</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Groups</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pending</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Promoted</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {snapshots.map((s) => (
              <tr key={s.snapshot_id} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{s.snapshot_id}</td>
                <td className="px-6 py-4 text-sm text-gray-400 break-all max-w-xs">{s.workspace_path}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(s.created_at)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{s.total_groups}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-400">{s.pending}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">{s.promoted}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => navigate(`/snapshots/${s.snapshot_id}`)}
                    className="flex items-center space-x-1 text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Open</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SnapshotTable;
