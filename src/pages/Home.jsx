import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw, Play, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { runDetection, listSnapshots } from '../api/dedup';
import SnapshotTable from '../components/SnapshotTable';
import Loader from '../components/Loader';

const SNAPSHOT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

const emptyForm = (params) => ({
  snapshot_id: params.get('snapshot_id') || '',
  workspace_path: params.get('workspace_path') || '',
});

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState(() => emptyForm(searchParams));
  const [running, setRunning] = useState(false);
  const [jumpId, setJumpId] = useState('');

  const [snapshots, setSnapshots] = useState([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);

  const fetchSnapshots = async () => {
    try {
      const data = await listSnapshots();
      setSnapshots(data.snapshots || []);
    } catch {
      toast.error('Failed to fetch snapshots');
    } finally {
      setLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!SNAPSHOT_ID_PATTERN.test(formData.snapshot_id)) {
      toast.error('snapshot_id must contain only letters, digits, underscores, and hyphens');
      return;
    }

    // Windows' "Copy as path" wraps the value in literal double quotes
    // when it contains a space — pasted as-is, that breaks absolute-path
    // detection on the server. Strip one matching pair before sending.
    const workspacePath = formData.workspace_path.trim().replace(/^"(.*)"$/, '$1');
    if (!workspacePath) {
      toast.error('workspace_path is required');
      return;
    }

    setRunning(true);
    try {
      const result = await runDetection({
        ...formData,
        workspace_path: workspacePath,
      });

      if (result.status === 'failed') {
        toast.error(result.error || 'Detection failed');
      } else if (result.status === 'partial') {
        toast.error(
          `Detection partially failed — image: ${result.image?.error || 'ok'}, dita: ${result.dita?.error || 'ok'}`
        );
      } else {
        toast.success('Detection completed');
      }
      navigate(`/snapshots/${result.snapshot_id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to run detection');
    } finally {
      setRunning(false);
    }
  };

  const handleJump = (e) => {
    e.preventDefault();
    if (jumpId.trim()) navigate(`/snapshots/${jumpId.trim()}`);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Run Detection</h1>
          <p className="text-gray-400 mt-2">
            Scans a workspace once, runs image and/or DITA dedup, and persists every duplicate group as
            "pending" for review. Never promotes, rejects, or deletes anything itself.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 border border-slate-700 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Snapshot ID <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Letters, digits, underscores, and hyphens only. Reusing an existing snapshot_id re-detects and
              wipes its previous pending groups; a different workspace_path under the same snapshot_id is
              rejected.
            </p>
            <input
              type="text"
              value={formData.snapshot_id}
              onChange={(e) => setFormData({ ...formData, snapshot_id: e.target.value })}
              placeholder="proj-2026-08-20"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Workspace Path <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.workspace_path}
              onChange={(e) => setFormData({ ...formData, workspace_path: e.target.value })}
              placeholder="C:\path\to\workspace"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={running}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            <span>{running ? 'Running detection...' : 'Run Detection'}</span>
          </button>
        </form>

        <form onSubmit={handleJump} className="flex items-end space-x-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">Open existing snapshot</label>
            <input
              type="text"
              value={jumpId}
              onChange={(e) => setJumpId(e.target.value)}
              placeholder="snapshot_id"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span>Open</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Snapshots</h2>
            <button
              onClick={fetchSnapshots}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          {loadingSnapshots ? <Loader /> : <SnapshotTable snapshots={snapshots} />}
        </div>
      </div>
    </div>
  );
};

export default Home;
