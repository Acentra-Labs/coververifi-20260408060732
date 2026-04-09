import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import StatusBadge from '../components/shared/StatusBadge';
import { formatDate, formatDateTime, formatCurrency, formatPolicyType, formatTaxClassification, formatPhone, formatEmailType } from '../utils/formatters';
import Modal from '../components/shared/Modal';
import { daysUntilExpiration, calculatePolicyStatus, getIdahoWCWarning } from '../utils/compliance';
import { validateRequired, validatePolicyNumber, validateDate, validateCoverage } from '../utils/validators';

const TABS = ['Overview', 'Certificates', 'W-9', 'Activity'];

export default function SubcontractorDetail() {
  const { subId } = useParams();
  const { user } = useAuth();
  const {
    subcontractors, getPoliciesForSub, getAgentById, getCertsForSub,
    getEmailsForSub, getVerificationsForSub, getW9ForSub,
    addPolicy, addCertificate, addW9Record, sendVerificationEmail, gcSubcontractors, gcClients,
  } = useData();
  const { success: toastSuccess } = useToast();
  const [activeTab, setActiveTab] = useState('Overview');
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const sub = subcontractors.find((s) => s.id === subId);
  if (!sub) return <div className="text-center py-12 text-slate-500">Subcontractor not found</div>;

  const policies = getPoliciesForSub(sub.id);
  const agent = sub.agent_id ? getAgentById(sub.agent_id) : null;
  const certs = getCertsForSub(sub.id);
  const emails = getEmailsForSub(sub.id);
  const verifications = getVerificationsForSub(sub.id);
  const w9 = getW9ForSub(sub.id);
  const wcWarning = getIdahoWCWarning(sub.tax_classification);

  // Find which GC this sub belongs to for breadcrumb
  const gcLink = gcSubcontractors.find((gs) => gs.sub_id === subId);
  const gc = gcLink ? gcClients.find((g) => g.id === gcLink.gc_id) : null;

  const handleSendVerification = async () => {
    if (!agent) return;
    setSendingEmail(true);
    await sendVerificationEmail(sub.id, agent.id, gc?.id || null);
    setSendingEmail(false);
    toastSuccess(`Verification email sent to ${agent.full_name}`);
  };

  const handleAddPolicy = (policyData) => {
    addPolicy({ ...policyData, sub_id: sub.id, agent_id: sub.agent_id });
    toastSuccess(`${policyData.type === 'gl' ? 'General Liability' : "Workers' Comp"} policy added`);
    setShowAddPolicy(false);
  };

  return (
    <div className="animate-fade-in">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link to={user?.role === 'consultant' ? '/dashboard' : '/gc/dashboard'} className="hover:text-teal-600 transition-colors">
          Dashboard
        </Link>
        {gc && user?.role === 'consultant' && (
          <>
            <span>/</span>
            <Link to={`/gc/${gc.id}/subs`} className="hover:text-teal-600 transition-colors">{gc.company_name}</Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-800 font-medium">{sub.company_name}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-800">{sub.company_name}</h1>
              <StatusBadge status={sub.status} size="lg" />
            </div>
            {sub.business_name_dba && (
              <p className="text-sm text-slate-500 mb-1">DBA: {sub.business_name_dba}</p>
            )}
            <p className="text-sm text-slate-600">{sub.contact_name} &middot; {sub.contact_email}</p>
            <p className="text-sm text-slate-500">{formatPhone(sub.contact_phone)} &middot; {sub.address}</p>
            <p className="text-xs text-slate-400 mt-1">{formatTaxClassification(sub.tax_classification)} &middot; EIN: {sub.ein || 'N/A'}</p>
          </div>
          {agent && (
            <div className="bg-slate-50 rounded-lg p-4 min-w-[220px]">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Insurance Agent</p>
              <p className="text-sm font-medium text-slate-800">{agent.full_name}</p>
              <p className="text-xs text-slate-600">{agent.agency_name}</p>
              <p className="text-xs text-slate-500 mt-1">{agent.email}</p>
              <p className="text-xs text-slate-500">{formatPhone(agent.phone)}</p>
            </div>
          )}
        </div>

        {wcWarning && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 font-medium flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {wcWarning}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddPolicy(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Policy
          </button>
          {agent && (
            <button
              onClick={handleSendVerification}
              disabled={sendingEmail}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {sendingEmail ? 'Sending...' : 'Send Verification Email'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-5">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && <OverviewTab policies={policies} sub={sub} />}
      {activeTab === 'Certificates' && <CertificatesTab certs={certs} policies={policies} sub={sub} onUpload={(certData) => {
        addCertificate({ ...certData, sub_id: sub.id, uploaded_by: user?.id });
        toastSuccess('Certificate uploaded successfully');
      }} />}
      {activeTab === 'W-9' && <W9Tab w9={w9} sub={sub} onUpload={(w9Data) => {
        addW9Record({ ...w9Data, sub_id: sub.id });
        toastSuccess('W-9 record saved');
      }} />}
      {activeTab === 'Activity' && <ActivityTab emails={emails} verifications={verifications} />}

      <AddPolicyModal isOpen={showAddPolicy} onClose={() => setShowAddPolicy(false)} onAdd={handleAddPolicy} />
    </div>
  );
}

function OverviewTab({ policies, sub }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Insurance Policies</h3>
      {policies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No policies on file
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {policies.map((pol) => {
            const days = daysUntilExpiration(pol.expiration_date);
            const polStatus = calculatePolicyStatus(pol.expiration_date);
            return (
              <div key={pol.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-800">{formatPolicyType(pol.type)}</span>
                  <StatusBadge status={polStatus} />
                </div>
                <div className="space-y-2 text-sm">
                  <Row label="Policy #" value={pol.policy_number} />
                  <Row label="Carrier" value={pol.carrier} />
                  <Row label="Effective" value={formatDate(pol.effective_date)} />
                  <Row label="Expires" value={
                    <span className={days < 0 ? 'text-red-600 font-semibold' : days <= 30 ? 'text-amber-600 font-medium' : ''}>
                      {formatDate(pol.expiration_date)}
                      {days >= 0 && days <= 30 && ` (${days}d)`}
                      {days < 0 && ` (expired)`}
                    </span>
                  } />
                  <Row label="Per Occurrence" value={formatCurrency(pol.limit_per_occurrence)} />
                  <Row label="Aggregate" value={formatCurrency(pol.limit_aggregate)} />
                  <Row label="Addl Insured" value={pol.additional_insured ? 'Yes' : 'No'} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CertificatesTab({ certs, policies, sub, onUpload }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    policy_id: '',
    certificate_holder: '',
    file_name: '',
  });
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFileSelect = () => {
    const policyLabel = form.policy_id
      ? policies.find((p) => p.id === form.policy_id)?.type?.toUpperCase() || 'COI'
      : 'COI';
    const fileName = `ACORD25_${sub.company_name.replace(/\s+/g, '')}_${policyLabel}_${new Date().getFullYear()}.pdf`;
    set('file_name', fileName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.certificate_holder.trim()) errs.certificate_holder = 'Certificate holder is required';
    if (!form.policy_id) errs.policy_id = 'Select a policy';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onUpload({
      policy_id: form.policy_id,
      certificate_holder: form.certificate_holder,
      file_name: form.file_name || `ACORD25_${sub.company_name.replace(/\s+/g, '')}_${new Date().getFullYear()}.pdf`,
    });
    setForm({ policy_id: '', certificate_holder: '', file_name: '' });
    setShowForm(false);
  };

  const inputClass = (field) =>
    `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-slate-200'
    }`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">ACORD Certificates</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload Certificate
          </button>
        )}
      </div>

      {/* Upload form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File drop area */}
            <div
              onClick={handleFileSelect}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                form.file_name ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
              }`}
            >
              {form.file_name ? (
                <div className="text-emerald-600">
                  <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-medium">{form.file_name}</p>
                  <p className="text-xs text-emerald-500 mt-1">Click to change file</p>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-slate-600 font-medium">Click to upload ACORD certificate</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, PNG, or JPG up to 10MB</p>
                </>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Linked Policy *</label>
                <select value={form.policy_id} onChange={(e) => set('policy_id', e.target.value)} className={inputClass('policy_id')}>
                  <option value="">Select a policy...</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPolicyType(p.type)} — {p.policy_number}
                    </option>
                  ))}
                </select>
                {errors.policy_id && <p className="mt-1 text-xs text-red-500">{errors.policy_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Certificate Holder *</label>
                <input value={form.certificate_holder} onChange={(e) => set('certificate_holder', e.target.value)} className={inputClass('certificate_holder')} placeholder="e.g. Treasure Valley Builders" />
                {errors.certificate_holder && <p className="mt-1 text-xs text-red-500">{errors.certificate_holder}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setErrors({}); }} className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
                Upload Certificate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Certificate list */}
      {certs.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-500">No certificates uploaded yet</p>
          <p className="text-xs text-slate-400 mt-1">Click &ldquo;Upload Certificate&rdquo; above to add an ACORD 25</p>
        </div>
      )}

      {certs.map((cert) => {
        const linkedPolicy = policies.find((p) => p.id === cert.policy_id);
        return (
          <div key={cert.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{cert.file_name}</p>
              <p className="text-xs text-slate-500">
                Uploaded {formatDate(cert.upload_date)} &middot; Holder: {cert.certificate_holder}
                {linkedPolicy && <span> &middot; {formatPolicyType(linkedPolicy.type)} ({linkedPolicy.policy_number})</span>}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TAX_OPTIONS = [
  { value: 'sole_proprietor', label: 'Individual/Sole Proprietor' },
  { value: 'c_corp', label: 'C Corporation' },
  { value: 's_corp', label: 'S Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llc_c', label: 'LLC (taxed as C Corp)' },
  { value: 'llc_s', label: 'LLC (taxed as S Corp)' },
  { value: 'llc_p', label: 'LLC (taxed as Partnership)' },
  { value: 'trust_estate', label: 'Trust/Estate' },
];

function W9Tab({ w9, sub, onUpload }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    legal_name: sub.company_name || '',
    business_name: sub.business_name_dba || '',
    tax_classification: sub.tax_classification || 'llc_c',
    ein: sub.ein || '',
    address: '', city: '', state: 'ID', zip: '',
    signature_date: new Date().toISOString().split('T')[0],
    file_name: '',
  });
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFileSelect = () => {
    // Simulate file selection (no real FS access in browser demo)
    const fileName = `W9_${sub.company_name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;
    set('file_name', fileName);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.legal_name.trim()) errs.legal_name = 'Legal name is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.zip.trim()) errs.zip = 'ZIP is required';
    if (!form.signature_date) errs.signature_date = 'Signature date is required';
    if (form.ein && !/^\d{2}-\d{7}$/.test(form.ein)) errs.ein = 'EIN must be XX-XXXXXXX';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onUpload({
      ...form,
      ssn: null,
      exempt_payee_code: '',
      fatca_code: '',
      file_name: form.file_name || `W9_${sub.company_name.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`,
    });
    setShowForm(false);
  };

  if (w9 && !showForm) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">W-9 Record</h3>
          <span className="text-xs text-slate-500">Signed {formatDate(w9.signature_date)}</span>
        </div>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Row label="Legal Name" value={w9.legal_name} />
          <Row label="Business Name" value={w9.business_name || '—'} />
          <Row label="Tax Classification" value={formatTaxClassification(w9.tax_classification)} />
          <Row label="EIN" value={w9.ein || '—'} />
          <Row label="Address" value={`${w9.address}, ${w9.city}, ${w9.state} ${w9.zip}`} />
          <Row label="File" value={w9.file_name} />
        </div>
      </div>
    );
  }

  if (!showForm && !w9) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-slate-500 mb-3">No W-9 on file</p>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Upload W-9
        </button>
      </div>
    );
  }

  const inputClass = (field) =>
    `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-slate-200'
    }`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">W-9 Information</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File upload area */}
        <div
          onClick={handleFileSelect}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            form.file_name ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50/30'
          }`}
        >
          {form.file_name ? (
            <div className="text-emerald-600">
              <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm font-medium">{form.file_name}</p>
              <p className="text-xs text-emerald-500 mt-1">Click to change file</p>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-slate-600 font-medium">Click to upload W-9 document</p>
              <p className="text-xs text-slate-400 mt-1">PDF or image up to 10MB</p>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Legal Name *</label>
            <input value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} className={inputClass('legal_name')} />
            {errors.legal_name && <p className="mt-1 text-xs text-red-500">{errors.legal_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Business Name / DBA</label>
            <input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} className={inputClass('business_name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tax Classification</label>
            <select value={form.tax_classification} onChange={(e) => set('tax_classification', e.target.value)} className={inputClass('tax_classification')}>
              {TAX_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">EIN (XX-XXXXXXX)</label>
            <input value={form.ein} onChange={(e) => set('ein', e.target.value)} className={inputClass('ein')} placeholder="82-1234567" />
            {errors.ein && <p className="mt-1 text-xs text-red-500">{errors.ein}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Street Address *</label>
            <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass('address')} />
            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
              <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass('city')} />
              {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
              <input value={form.state} onChange={(e) => set('state', e.target.value)} className={inputClass('state')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label>
              <input value={form.zip} onChange={(e) => set('zip', e.target.value)} className={inputClass('zip')} />
              {errors.zip && <p className="mt-1 text-xs text-red-500">{errors.zip}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Signature Date *</label>
            <input type="date" value={form.signature_date} onChange={(e) => set('signature_date', e.target.value)} className={inputClass('signature_date')} />
            {errors.signature_date && <p className="mt-1 text-xs text-red-500">{errors.signature_date}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
            Save W-9 Record
          </button>
        </div>
      </form>
    </div>
  );
}

function ActivityTab({ emails, verifications }) {
  const allActivity = [
    ...emails.map((e) => ({ ...e, activityType: 'email', timestamp: e.sent_at })),
    ...verifications.map((v) => ({ ...v, activityType: 'verification', timestamp: v.verified_at })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (allActivity.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allActivity.map((item) => (
        <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            item.activityType === 'email' ? 'bg-blue-50' : 'bg-emerald-50'
          }`}>
            {item.activityType === 'email' ? (
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {item.activityType === 'email' ? (
              <>
                <p className="text-sm font-medium text-slate-800">{formatEmailType(item.type)}: {item.subject}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sent {formatDateTime(item.sent_at)} &middot; Status: {item.status}
                  {item.opened_at && ` &middot; Opened ${formatDateTime(item.opened_at)}`}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-800">Verification: {item.result}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(item.verified_at)} &middot; {item.method}</p>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-500 min-w-[120px] shrink-0">{label}:</span>
      <span className="text-slate-800 font-medium">{value || '—'}</span>
    </div>
  );
}

function AddPolicyModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({
    type: 'gl', policy_number: '', carrier: '',
    effective_date: '', expiration_date: '',
    limit_per_occurrence: '1000000', limit_aggregate: '2000000',
    additional_insured: false,
  });
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    const pnErr = validatePolicyNumber(form.policy_number);
    if (pnErr) errs.policy_number = pnErr;
    const carrierErr = validateRequired(form.carrier, 'Carrier');
    if (carrierErr) errs.carrier = carrierErr;
    const effErr = validateDate(form.effective_date);
    if (effErr) errs.effective_date = effErr;
    const expErr = validateDate(form.expiration_date);
    if (expErr) errs.expiration_date = expErr;
    const limErr = validateCoverage(form.limit_per_occurrence);
    if (limErr) errs.limit_per_occurrence = limErr;

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    onAdd({
      ...form,
      limit_per_occurrence: Number(form.limit_per_occurrence),
      limit_aggregate: Number(form.limit_aggregate),
      status: 'active',
    });
    setForm({
      type: 'gl', policy_number: '', carrier: '',
      effective_date: '', expiration_date: '',
      limit_per_occurrence: '1000000', limit_aggregate: '2000000',
      additional_insured: false,
    });
    setErrors({});
  };

  const inputClass = (field) =>
    `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 ${
      errors[field] ? 'border-red-300' : 'border-slate-200'
    }`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Insurance Policy">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Policy Type</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputClass('type')}>
            <option value="gl">General Liability</option>
            <option value="wc">Workers&apos; Comp</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Policy Number *</label>
          <input value={form.policy_number} onChange={(e) => set('policy_number', e.target.value)} className={inputClass('policy_number')} placeholder="GL-2026-XXX-0000" />
          {errors.policy_number && <p className="mt-1 text-xs text-red-500">{errors.policy_number}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Carrier *</label>
          <input value={form.carrier} onChange={(e) => set('carrier', e.target.value)} className={inputClass('carrier')} placeholder="e.g. State Farm" />
          {errors.carrier && <p className="mt-1 text-xs text-red-500">{errors.carrier}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Effective Date *</label>
            <input type="date" value={form.effective_date} onChange={(e) => set('effective_date', e.target.value)} className={inputClass('effective_date')} />
            {errors.effective_date && <p className="mt-1 text-xs text-red-500">{errors.effective_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date *</label>
            <input type="date" value={form.expiration_date} onChange={(e) => set('expiration_date', e.target.value)} className={inputClass('expiration_date')} />
            {errors.expiration_date && <p className="mt-1 text-xs text-red-500">{errors.expiration_date}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Per Occurrence ($) *</label>
            <input type="number" value={form.limit_per_occurrence} onChange={(e) => set('limit_per_occurrence', e.target.value)} className={inputClass('limit_per_occurrence')} />
            {errors.limit_per_occurrence && <p className="mt-1 text-xs text-red-500">{errors.limit_per_occurrence}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Aggregate ($)</label>
            <input type="number" value={form.limit_aggregate} onChange={(e) => set('limit_aggregate', e.target.value)} className={inputClass('limit_aggregate')} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.additional_insured} onChange={(e) => set('additional_insured', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
          Additional Insured
        </label>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
          <button type="submit" className="flex-1 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">Add Policy</button>
        </div>
      </form>
    </Modal>
  );
}
