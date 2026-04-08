import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import StatusBadge from '../components/shared/StatusBadge';
import { formatDate, formatDateTime, formatCurrency, formatPolicyType, formatTaxClassification, formatPhone, formatEmailType } from '../utils/formatters';
import { daysUntilExpiration, calculatePolicyStatus, getIdahoWCWarning } from '../utils/compliance';

const TABS = ['Overview', 'Certificates', 'W-9', 'Activity'];

export default function SubcontractorDetail() {
  const { subId } = useParams();
  const {
    subcontractors, getPoliciesForSub, getAgentById, getCertsForSub,
    getEmailsForSub, getVerificationsForSub, getW9ForSub
  } = useData();
  const [activeTab, setActiveTab] = useState('Overview');

  const sub = subcontractors.find((s) => s.id === subId);
  if (!sub) return <div className="text-center py-12 text-slate-500">Subcontractor not found</div>;

  const policies = getPoliciesForSub(sub.id);
  const agent = sub.agent_id ? getAgentById(sub.agent_id) : null;
  const certs = getCertsForSub(sub.id);
  const emails = getEmailsForSub(sub.id);
  const verifications = getVerificationsForSub(sub.id);
  const w9 = getW9ForSub(sub.id);
  const wcWarning = getIdahoWCWarning(sub.tax_classification);

  return (
    <div className="animate-fade-in">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link to="/dashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link to={-1} className="hover:text-teal-600 transition-colors">Subcontractors</Link>
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
      {activeTab === 'Certificates' && <CertificatesTab certs={certs} />}
      {activeTab === 'W-9' && <W9Tab w9={w9} sub={sub} />}
      {activeTab === 'Activity' && <ActivityTab emails={emails} verifications={verifications} />}
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

function CertificatesTab({ certs }) {
  if (certs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No certificates uploaded yet
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {certs.map((cert) => (
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
            </p>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
            View
          </button>
        </div>
      ))}
    </div>
  );
}

function W9Tab({ w9, sub }) {
  if (!w9) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-slate-500 mb-3">No W-9 on file</p>
        <button className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
          Upload W-9
        </button>
      </div>
    );
  }

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
