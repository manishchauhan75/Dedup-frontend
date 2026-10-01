import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDitaContentDuplicates } from '../api/dedup';
import MatchBadge from '../components/MatchBadge';
import ElementTypeBadge from '../components/ElementTypeBadge';
import Loader from '../components/Loader';
import { formatNumber } from '../utils/formatters';

const MATCH_TYPES = ['exact', 'near'];

const ContentDuplicatesPage = () => {
  const { snapshotId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elementTypeFilter, setElementTypeFilter] = useState('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    getDitaContentDuplicates(snapshotId)
      .then(setGroups)
      .catch(() => toast.error('Failed to fetch content duplicates'))
      .finally(() => setLoading(false));
  }, [snapshotId]);

  const elementTypes = useMemo(
    () => [...new Set(groups.map((g) => g.element_type))].sort(),
    [groups]
  );

  const filteredGroups = groups.filter(
    (g) =>
      (elementTypeFilter === 'all' || g.element_type === elementTypeFilter) &&
      (matchTypeFilter === 'all' || g.match_type === matchTypeFilter)
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button
          onClick={() => navigate(`/snapshots/${snapshotId}`)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-white">DITA Content Reuse Candidates</h1>
          <p className="text-gray-400 mt-1">
            Snapshot: {snapshotId} &bull; {formatNumber(groups.length)} duplicate content group(s) found
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Read-only report of duplicate/near-duplicate paragraphs, list items, tables, steps and notes
            across topics — independent of whether the topics themselves are duplicates. There is no
            promote/reject action here.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider mr-1">Element:</span>
          <button
            onClick={() => setElementTypeFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              elementTypeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {elementTypes.map((type) => (
            <button
              key={type}
              onClick={() => setElementTypeFilter(type)}
              className={`transition-opacity ${elementTypeFilter === type ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
            >
              <ElementTypeBadge elementType={type} />
            </button>
          ))}

          <span className="text-xs text-gray-400 uppercase tracking-wider ml-4 mr-1">Match:</span>
          <button
            onClick={() => setMatchTypeFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              matchTypeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          {MATCH_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setMatchTypeFilter(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                matchTypeFilter === type ? 'bg-blue-500 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {filteredGroups.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <p className="text-gray-400">
              {groups.length === 0
                ? 'No duplicate content found for this snapshot.'
                : 'No groups match the selected filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div
                key={`${group.element_type}-${group.group_number}`}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
              >
                <div className="px-6 py-3 border-b border-slate-700 bg-slate-900/50 flex items-center flex-wrap gap-3">
                  <h3 className="text-lg font-semibold text-white">Group #{group.group_number}</h3>
                  <ElementTypeBadge elementType={group.element_type} />
                  <MatchBadge matchPercentage={group.similarity} matchType={group.match_type} />
                  <span className="text-xs text-gray-500">{group.members.length} occurrences</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">Topic</th>
                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase">Content</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {group.members.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-700/50">
                          <td className="px-6 py-2 text-sm text-gray-300 break-all align-top">
                            {m.topic_path || `topic #${m.topic_id}`}
                          </td>
                          <td className="px-6 py-2 text-sm text-gray-300">{m.text_preview}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentDuplicatesPage;
