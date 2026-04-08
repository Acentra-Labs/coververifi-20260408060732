import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import StatsCard from '../components/shared/StatsCard';
import ComplianceBar from '../components/shared/ComplianceBar';
import StatusBadge from '../components/shared/StatusBadge';
import SearchInput from '../components/shared/SearchInput';
import { getComplianceStats, getComplianceBarSegments, sortByComplianceUrgency, daysUntilExpiration } from '../utils/compliance';
import { formatDate } from '../utils/formatters';

export default function GCDashboard() {
  const { user } = useAuth();
  const { getSubsForGC, getPoliciesForSub, getAgentById } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const subs = getSubsForGC(user.id);
  const stats = getComplianceStats(subs);
  const segments = getComplianceBarSegments(stats);

  const enrichedSubs = useMemo(() => {
    return subs.map((sub) => {
      const policies = getPoliciesForSub(sub.id);
      const glPolicy = policies.find((p) => p.type === 'gl');
      const wcPolicy = policies.find((p) => p.type === 'wc');
      const agent = sub.agent_id ? getAgentById(sub.agent_id) : null;
      return { ...sub, glPolicy, wcPolicy, agent };
    });
  }, [subs, getPoliciesForSub, getAgentById]);

  const filtered = useMemo(() => {
    let result = enrichedSubs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.company_name.toLowerCase().includes(q) || s.contact_name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    return sortByComplianceUrgency(result);
  }, [enrichedSubs, search, statusFilter]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subcontractor Compliance</h1>
          <p className="text-sm text-slate-500">{user.company_name} — {subs.length} subcontractors</p>
        </div>
        <button
          onClick={() => navigate('/gc/add-sub')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Subcontractor
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Subs"
          value={stats.total}
          color="slate"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatsCard label="Compliant" value={stats.compliant} color="emerald" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>} />
        <StatsCard label="Expiring" value={stats.expiring} color="amber" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatsCard label="Lapsed" value={stats.lapsed} color="red" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
      </div>

      {/* Compliance bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <p className="text-sm font-medium text-slate-600 mb-3">
          Compliance Rate: <span className="text-xl font-bold text-slate-800">{stats.complianceRate}%</span>
        </p>
        <ComplianceBar segments={segments} height="h-3" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search subcontractors..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'compliant', 'expiring', 'lapsed', 'pending'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sub cards (mobile-friendly) */}
      <div className="space-y-3">
        {filtered.map((sub) => {
          const glDays = sub.glPolicy ? daysUntilExpiration(sub.glPolicy.expiration_date) : null;
          const wcDays = sub.wcPolicy ? daysUntilExpiration(sub.wcPolicy.expiration_date) : null;
          return (
            <div
              key={sub.id}
              onClick={() => navigate(`/sub/${sub.id}`)}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{sub.company_name}</h3>
                  <p className="text-xs text-slate-500">{sub.contact_name}</p>
                </div>
                <StatusBadge status={sub.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                <div>
                  <span className="text-slate-500">GL Expires:</span>
                  <p className={`font-medium ${glDays !== null && glDays < 0 ? 'text-red-600' : glDays !== null && glDays <= 30 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {sub.glPolicy ? formatDate(sub.glPolicy.expiration_date) : 'No policy'}
                    {glDays !== null && glDays >= 0 && glDays <= 30 && ` (${glDays}d)`}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">WC Expires:</span>
                  <p className={`font-medium ${wcDays !== null && wcDays < 0 ? 'text-red-600' : wcDays !== null && wcDays <= 30 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {sub.wcPolicy ? formatDate(sub.wcPolicy.expiration_date) : sub.tax_classification === 'sole_proprietor' ? 'Exempt?' : 'No policy'}
                  </p>
                </div>
              </div>
              {sub.agent && (
                <p className="text-xs text-slate-500 mt-2">
                  Agent: {sub.agent.full_name} ({sub.agent.agency_name})
                </p>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          {search || statusFilter !== 'all' ? 'No subcontractors match your filters' : 'No subcontractors yet. Add your first sub to get started.'}
        </div>
      )}
    </div>
  );
}
