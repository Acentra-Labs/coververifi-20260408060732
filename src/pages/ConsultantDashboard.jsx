import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import StatsCard from '../components/shared/StatsCard';
import ComplianceBar from '../components/shared/ComplianceBar';
import StatusBadge from '../components/shared/StatusBadge';
import SearchInput from '../components/shared/SearchInput';
import Modal from '../components/shared/Modal';
import { getComplianceStats, getComplianceBarSegments, sortByComplianceUrgency } from '../utils/compliance';
import { validateRequired, validateEmail, validatePhone } from '../utils/validators';

export default function ConsultantDashboard() {
  const { user } = useAuth();
  const { gcClients, getSubsForGC, addGCClient } = useData();
  const { success: toastSuccess } = useToast();
  const [search, setSearch] = useState('');
  const [showAddGC, setShowAddGC] = useState(false);

  const myGCs = gcClients.filter((gc) => gc.consultant_id === user.id);

  const gcData = useMemo(() => {
    return myGCs.map((gc) => {
      const subs = getSubsForGC(gc.id);
      const stats = getComplianceStats(subs);
      const segments = getComplianceBarSegments(stats);
      return { ...gc, subs, stats, segments };
    });
  }, [myGCs, getSubsForGC]);

  const filteredGCs = gcData.filter((gc) =>
    gc.company_name.toLowerCase().includes(search.toLowerCase()) ||
    gc.contact_name.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: worst compliance first
  const sortedGCs = [...filteredGCs].sort((a, b) => a.stats.complianceRate - b.stats.complianceRate);

  const totals = useMemo(() => {
    const allSubs = gcData.flatMap((gc) => gc.subs);
    const uniqueSubs = [...new Map(allSubs.map((s) => [s.id, s])).values()];
    return getComplianceStats(uniqueSubs);
  }, [gcData]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of all GC clients and compliance status</p>
        </div>
        <button
          onClick={() => setShowAddGC(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add GC Client
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatsCard
          label="GC Clients"
          value={myGCs.length}
          color="teal"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatsCard
          label="Total Subs"
          value={totals.total}
          color="slate"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatsCard
          label="Compliant"
          value={totals.compliant}
          color="emerald"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>}
        />
        <StatsCard
          label="Expiring"
          value={totals.expiring}
          color="amber"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatsCard
          label="Lapsed"
          value={totals.lapsed}
          color="red"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search GC clients..." />
      </div>

      {/* GC Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {sortedGCs.map((gc) => (
          <Link
            key={gc.id}
            to={`/gc/${gc.id}/subs`}
            className="block bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-teal-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">
                  {gc.company_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{gc.contact_name} &middot; {gc.address}</p>
              </div>
              <span className="text-2xl font-bold text-slate-800">{gc.stats.complianceRate}%</span>
            </div>

            <ComplianceBar segments={gc.segments} height="h-2" />

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">{gc.subs.length} subcontractors &middot; {gc.active_jobs} active jobs</span>
              <div className="flex gap-1">
                {gc.stats.lapsed > 0 && <StatusBadge status="lapsed" />}
                {gc.stats.expiring > 0 && <StatusBadge status="expiring" />}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {sortedGCs.length === 0 && search && (
        <div className="text-center py-12">
          <p className="text-slate-500">No GC clients match "{search}"</p>
        </div>
      )}

      {/* Add GC Modal */}
      <AddGCModal
        isOpen={showAddGC}
        onClose={() => setShowAddGC(false)}
        onAdd={(gc) => {
          addGCClient({ ...gc, consultant_id: user.id });
          toastSuccess(`${gc.company_name} added as a GC client`);
          setShowAddGC(false);
        }}
      />
    </div>
  );
}

function AddGCModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    const nameErr = validateRequired(form.company_name, 'Company name');
    if (nameErr) newErrors.company_name = nameErr;
    const contactErr = validateRequired(form.contact_name, 'Contact name');
    if (contactErr) newErrors.contact_name = contactErr;
    const emailErr = validateEmail(form.contact_email);
    if (emailErr) newErrors.contact_email = emailErr;
    const phoneErr = validatePhone(form.contact_phone);
    if (phoneErr) newErrors.contact_phone = phoneErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onAdd(form);
    setForm({ company_name: '', contact_name: '', contact_email: '', contact_phone: '', address: '' });
  };

  const fields = [
    { key: 'company_name', label: 'Company Name', type: 'text', placeholder: 'e.g. Valley Builders Inc' },
    { key: 'contact_name', label: 'Contact Name', type: 'text', placeholder: 'e.g. John Smith' },
    { key: 'contact_email', label: 'Contact Email', type: 'email', placeholder: 'john@valleybuilders.com' },
    { key: 'contact_phone', label: 'Phone', type: 'tel', placeholder: '(208) 555-0000' },
    { key: 'address', label: 'Address', type: 'text', placeholder: '123 Main St, Boise, ID 83702' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add GC Client">
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
            <input
              type={f.type}
              value={form[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
                errors[f.key] ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {errors[f.key] && <p className="mt-1 text-xs text-red-500">{errors[f.key]}</p>}
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
            Add Client
          </button>
        </div>
      </form>
    </Modal>
  );
}
