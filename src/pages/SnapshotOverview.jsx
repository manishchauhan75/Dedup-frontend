import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, FileText, Image as ImageIcon, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAnalytics, listSnapshots } from '../api/dedup';
import AnalyticsCards from '../components/AnalyticsCards';
import AnalyticsCharts from '../components/AnalyticsCharts';
import Loader from '../components/Loader';
import { formatDate } from '../utils/formatters';

const SnapshotOverview = () => {
  const { snapshotId } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchData = async () => {
    try {
      const [analyticsData, snapshotsData] = await Promise.all([getAnalytics(snapshotId), listSnapshots()]);
      setAnalytics(analyticsData);
      setMeta(snapshotsData.snapshots.find((s) => s.snapshot_id === snapshotId) || null);
      setNotFound(false);
    } catch (error) {
      if (error.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error('Failed to fetch snapshot analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId]);

  if (loading) return <Loader />;

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <p className="text-gray-400">Snapshot "{snapshotId}" not found. Run detection first.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{snapshotId}</h1>
            {meta && <p className="text-gray-400 break-all mt-1">{meta.workspace_path}</p>}
            {meta && <p className="text-gray-500 text-sm mt-1">Detected {formatDate(meta.created_at)}</p>}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <Link
              to={`/?snapshot_id=${encodeURIComponent(snapshotId)}&workspace_path=${encodeURIComponent(meta?.workspace_path || '')}`}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <span>Re-detect</span>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>DITA</span>
            </h2>
            <div className="flex space-x-4">
              <Link to={`/snapshots/${snapshotId}/dita/groups`} className="text-blue-500 hover:text-blue-400 text-sm font-medium">
                Duplicate Groups &rarr;
              </Link>
              <Link
                to={`/snapshots/${snapshotId}/dita/activity`}
                className="text-blue-500 hover:text-blue-400 text-sm font-medium flex items-center space-x-1"
              >
                <History className="w-4 h-4" />
                <span>Activity</span>
              </Link>
            </div>
          </div>
          <AnalyticsCards analytics={analytics?.dita} />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-blue-400" />
              <span>Images</span>
            </h2>
            <div className="flex space-x-4">
              <Link to={`/snapshots/${snapshotId}/images/groups`} className="text-blue-500 hover:text-blue-400 text-sm font-medium">
                Duplicate Groups &rarr;
              </Link>
              <Link
                to={`/snapshots/${snapshotId}/images/activity`}
                className="text-blue-500 hover:text-blue-400 text-sm font-medium flex items-center space-x-1"
              >
                <History className="w-4 h-4" />
                <span>Activity</span>
              </Link>
            </div>
          </div>
          <AnalyticsCards analytics={analytics?.images} />
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">DITA Charts</h3>
            <AnalyticsCharts analytics={analytics?.dita} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Image Charts</h3>
            <AnalyticsCharts analytics={analytics?.images} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnapshotOverview;
