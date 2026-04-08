import { STATUS_CONFIG } from '../../utils/compliance';

const barColors = {
  compliant: 'bg-emerald-500',
  expiring: 'bg-amber-500',
  lapsed: 'bg-red-500',
  pending: 'bg-gray-400',
  under_verification: 'bg-blue-500',
};

export default function ComplianceBar({ segments, height = 'h-2' }) {
  if (!segments || segments.length === 0) {
    return <div className={`w-full ${height} bg-slate-200 rounded-full`} />;
  }

  return (
    <div className="w-full">
      <div className={`w-full ${height} bg-slate-200 rounded-full overflow-hidden flex`}>
        {segments.map((seg) => (
          <div
            key={seg.status}
            className={`${barColors[seg.status]} transition-all duration-500`}
            style={{ width: `${seg.pct}%` }}
            title={`${STATUS_CONFIG[seg.status]?.label}: ${seg.count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {segments.map((seg) => (
          <div key={seg.status} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`w-2 h-2 rounded-full ${barColors[seg.status]}`} />
            <span>{STATUS_CONFIG[seg.status]?.label}</span>
            <span className="font-semibold">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
