import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import StatusBadge from '../components/shared/StatusBadge';
import ComplianceBar from '../components/shared/ComplianceBar';
import SearchInput from '../components/shared/SearchInput';
import { getComplianceStats, getComplianceBarSegments, sortByComplianceUrgency, daysUntilExpiration } from '../utils/compliance';
import { formatDate, formatCurrency } from '../utils/formatters';

export default function SubcontractorTable() {
  const { gcId } = useParams();
  const { user } = useAuth();
  const { gcClients, getSubsForGC, getPoliciesForSub, getAgentById } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('status');
  const [sortDir, setSortDir] = useState('asc');

  const gc = gcClients.find((g) => g.id === gcId);
  const subs = getSubsForGC(gcId);
  const stats = getComplianceStats(subs);
  const segments = getComplianceBarSegments(stats);

  const enrichedSubs = useMemo(() => {
    return subs.map((sub) => {
      const policies = getPoliciesForSub(sub.id);
      const glPolicy = policies.find((p) => p.type === 'gl');
      const wcPolicy = policies.find((p) => p.type === 'wc');
      const agent = sub.agent_id ? getAgentById(sub.agent_id) : null;
      return { ...sub, policies, glPolicy, wcPolicy, agent };
    });
  }, [subs, getPoliciesForSub, getAgentById]);

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
    return result;
  }, [enrichedSubs, search, statusFilter]);

  const sorted = useMemo(() => {
    if (sortField === 'status') return sortByComplianceUrgency(filtered);
    return [...filtered].sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'name': aVal = a.company_name; bVal = b.company_name; break;
        case 'gl_exp': aVal = a.glPolicy?.expiration_date || ''; bVal = b.glPolicy?.expiration_date || ''; break;
        case 'wc_exp': aVal = a.wcPolicy?.expiration_date || ''; bVal = b.wcPolicy?.expiration_date || ''; break;
        default: aVal = a.company_name; bVal = b.company_name;
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-slate-300 ml-1">&uarr;&darr;</span>;
    return <span className="text-teal-500 ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>;
  };

  if (!gc) {
    return <div className="text-center py-12 text-slate-500">GC client not found</div>;
  }

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      {user?.role === 'consultant' && (
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Link to="/dashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">{gc.company_name}</span>
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{gc.company_name}</h1>
          <p className="text-sm text-slate-500">{gc.contact_name} &middot; {subs.length} subcontractors</p>
        </div>
        <Link
          to={user?.role === 'consultant' ? `/gc/${gcId}/add-sub` : '/gc/add-sub'}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Subcontractor
        </Link>
      </div>

      {/* Compliance summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <span className="text-sm font-medium text-slate-600">Compliance Overview</span>
            <span className="ml-3 text-2xl font-bold text-slate-800">{stats.complianceRate}%</span>
          </div>
        </div>
        <ComplianceBar segments={segments} height="h-3" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Search subs, agents..." />
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                  Subcontractor <SortIcon field="name" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  Status <SortIcon field="status" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort('gl_exp')}>
                  GL Exp <SortIcon field="gl_exp" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 cursor-pointer select-none hidden md:table-cell" onClick={() => toggleSort('wc_exp')}>
                  WC Exp <SortIcon field="wc_exp" />
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Agent</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">GL Limit</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((sub) => {
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
                    <td className="px-4 py-3">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {sub.glPolicy ? (
                        <div>
                          <span className={`text-sm ${glDays !== null && glDays < 0 ? 'text-red-600 font-semibold' : glDays !== null && glDays <= 30 ? 'text-amber-600 font-medium' : 'text-slate-700'}`}>
                            {formatDate(sub.glPolicy.expiration_date)}
                          </span>
                          {glDays !== null && glDays <= 30 && glDays >= 0 && (
                            <span className="block text-[10px] text-amber-600">{glDays}d remaining</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {sub.wcPolicy ? (
                        <div>
                          <span className={`text-sm ${wcDays !== null && wcDays < 0 ? 'text-red-600 font-semibold' : wcDays !== null && wcDays <= 30 ? 'text-amber-600 font-medium' : 'text-slate-700'}`}>
                            {formatDate(sub.wcPolicy.expiration_date)}
                          </span>
                          {wcDays !== null && wcDays <= 30 && wcDays >= 0 && (
                            <span className="block text-[10px] text-amber-600">{wcDays}d remaining</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          {sub.tax_classification === 'sole_proprietor' ? 'Exempt?' : 'Missing'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {sub.agent ? (
                        <div>
                          <p className="text-sm text-slate-700">{sub.agent.full_name}</p>
                          <p className="text-xs text-slate-500">{sub.agent.agency_name}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-slate-700">
                      {sub.glPolicy ? formatCurrency(sub.glPolicy.limit_per_occurrence) : '—'}
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
        {sorted.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            {search || statusFilter !== 'all' ? 'No subcontractors match your filters' : 'No subcontractors yet'}
          </div>
        )}
      </div>
    </div>
  );
}
