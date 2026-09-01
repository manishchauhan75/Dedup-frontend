import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Same recharts bar/pie pattern as the old Charts.jsx, fed by the new
// analytics shape (group-status breakdown) instead of the old
// same_name_groups/scanned_images fields.
const AnalyticsCharts = ({ analytics }) => {
  const a = analytics || {};

  const barData = [
    { name: 'Exact Matches', value: a.exact_matches || 0, fill: '#a855f7' },
    { name: 'Near Duplicates', value: a.near_duplicates || 0, fill: '#eab308' },
    { name: 'Review Required', value: a.review_required || 0, fill: '#f97316' },
  ];

  const pieData = [
    { name: 'Promoted', value: a.promoted || 0 },
    { name: 'Rejected', value: a.rejected || 0 },
    { name: 'Deleted', value: a.deleted || 0 },
    { name: 'Remaining', value: a.remaining || 0 },
  ];

  const COLORS = ['#22c55e', '#ef4444', '#64748b', '#ec4899'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Match Breakdown</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Decision Status</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => (value ? `${name}: ${value}` : '')}
              outerRadius={90}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
