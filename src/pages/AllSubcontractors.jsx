import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import StatusBadge from '../components/shared/StatusBadge';
import SearchInput from '../components/shared/SearchInput';
import { sortByComplianceUrgency, daysUntilExpiration } from '../utils/compliance';
import { formatDate } from '../utils/formatters';

export default function AllSubcontractors() {
  const { subcontractors, getPoliciesForSub, getAgentById } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const enrichedSubs = useMemo(() => {
    return subcontractors.map((sub) => {
      const policies = getPoliciesForSub(sub.id);
      const glPolicy = policies.find((p) => p.type === 'gl');
      const wcPolicy = policies.find((p) => p.type === 'wc');
      const agent = sub.agent_id ? getAgentById(sub.agent_id) : null;
      return { ...sub, glPolicy, wcPolicy, agent };
    });
  }, [subcontractors, getPoliciesForSub, getAgentById]);

  const filtered = useMemo(() => {
    let result = enrichedSubs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.company_name.toLowerCase().includes(q) ||
          s.contact_name.toLowerCase().includes(q) ||
          (s.agent?.full_name || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    return sortByComplianceUrgency(result);
  }, [enrichedSubs, search, statusFilter]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">All Subcontractors</h1>
        <p className="text-sm text-slate-500">{subcontractors.length} total subcontractors across all GC clients</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search all subcontractors..." />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'compliant', 'expiring', 'lapsed', 'pending', 'under_verification'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'all' ? 'All' : s === 'under_verification' ? 'Verifying' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Subcontractor</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">GL Exp</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">WC Exp</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Agent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => {
                const glDays = sub.glPolicy ? daysUntilExpiration(sub.glPolicy.expiration_date) : null;
                const wcDays = sub.wcPolicy ? daysUntilExpiration(sub.wcPolicy.expiration_date) : null;
                return (
                  <tr
                    key={sub.id}
                    onClick={() => navigate(`/sub/${sub.id}`)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{sub.company_name}</p>
                      <p className="text-xs text-slate-500">{sub.contact_name}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={sub.status} /></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {sub.glPolicy ? (
                        <span className={glDays !== null && glDays < 0 ? 'text-red-600 font-semibold' : glDays !== null && glDays <= 30 ? 'text-amber-600' : 'text-slate-700'}>
                          {formatDate(sub.glPolicy.expiration_date)}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {sub.wcPolicy ? (
                        <span className={wcDays !== null && wcDays < 0 ? 'text-red-600 font-semibold' : wcDays !== null && wcDays <= 30 ? 'text-amber-600' : 'text-slate-700'}>
                          {formatDate(sub.wcPolicy.expiration_date)}
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {sub.agent ? (
                        <span className="text-slate-700">{sub.agent.full_name}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <svg className="w-4 h-4 text-slate-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">No subcontractors match your filters</div>
        )}
      </div>
    </div>
  );
}
