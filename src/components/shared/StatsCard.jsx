export default function StatsCard({ label, value, icon, color = 'teal', subtext }) {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
