import {
  Files,
  Layers,
  Copy,
  CheckCircle,
  Sparkles,
  AlertTriangle,
  Upload,
  XCircle,
  Trash2,
  Clock,
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

// Generic over one EntityTypeAnalytics-shaped object (dita or images) from
// GET /api/v1/dedup/{snapshot_id}/analytics — replaces the old separate
// SummaryCards/DitaSummaryCards, which were hardcoded to two different,
// now-obsolete report shapes.
const AnalyticsCards = ({ title, analytics }) => {
  const a = analytics || {};

  const cards = [
    { label: 'Total Files', value: a.total_files, icon: Files, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Duplicate Groups', value: a.duplicate_groups, icon: Layers, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    { label: 'Duplicate Files', value: a.duplicate_files, icon: Copy, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Exact Matches', value: a.exact_matches, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Near Duplicates', value: a.near_duplicates, icon: Sparkles, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Review Required', value: a.review_required, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Promoted', value: a.promoted, icon: Upload, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Rejected', value: a.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Deleted', value: a.deleted, icon: Trash2, color: 'text-slate-400', bg: 'bg-slate-500/10' },
    { label: 'Remaining', value: a.remaining, icon: Clock, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  ];

  return (
    <div>
      {title && <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{formatNumber(card.value || 0)}</p>
              </div>
              <div className={`${card.bg} p-2 rounded-lg`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsCards;
