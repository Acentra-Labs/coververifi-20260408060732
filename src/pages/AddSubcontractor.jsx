import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { validateRequired, validateEmail, validatePhone, validateEIN, validateZip } from '../utils/validators';

const STEPS = ['Company Info', 'W-9 Details', 'Insurance Agent', 'Review'];

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

export default function AddSubcontractor() {
  const { gcId } = useParams();
  const { user } = useAuth();
  const { addSubcontractor, subcontractors, gcClients } = useData();
  const { success: toastSuccess, warning: toastWarning } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  const effectiveGcId = gcId || user?.id;
  const gc = gcClients.find((g) => g.id === effectiveGcId);

  const [form, setForm] = useState({
    company_name: '', contact_name: '', contact_email: '', contact_phone: '',
    address: '', city: '', state: 'ID', zip: '',
    tax_classification: 'llc_c', ein: '', business_name_dba: '',
    agent_name: '', agent_email: '', agent_phone: '', agent_agency: '',
  });

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (validateRequired(form.company_name, 'Company name')) errs.company_name = validateRequired(form.company_name, 'Company name');
      if (validateRequired(form.contact_name, 'Contact name')) errs.contact_name = validateRequired(form.contact_name, 'Contact name');
      if (validateEmail(form.contact_email)) errs.contact_email = validateEmail(form.contact_email);
      if (validatePhone(form.contact_phone)) errs.contact_phone = validatePhone(form.contact_phone);

      // Duplicate detection
      const existing = subcontractors.find(
        (s) => s.company_name.toLowerCase() === form.company_name.toLowerCase().trim()
      );
      if (existing) {
        toastWarning(`"${existing.company_name}" already exists in the system. Data will be linked.`);
      }
    }
    if (step === 1) {
      if (validateRequired(form.address, 'Address')) errs.address = validateRequired(form.address, 'Address');
      if (validateZip(form.zip)) errs.zip = validateZip(form.zip);
      if (form.ein && validateEIN(form.ein)) errs.ein = validateEIN(form.ein);
    }
    if (step === 2) {
      if (form.agent_email && validateEmail(form.agent_email)) errs.agent_email = validateEmail(form.agent_email);
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    const subData = {
      company_name: form.company_name,
      contact_name: form.contact_name,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      address: `${form.address}, ${form.city}, ${form.state} ${form.zip}`,
      tax_classification: form.tax_classification,
      ein: form.ein,
      business_name_dba: form.business_name_dba,
      agent_id: null,
    };
    addSubcontractor(subData, effectiveGcId);
    toastSuccess(`${form.company_name} has been added successfully`);
    navigate(gcId ? `/gc/${gcId}/subs` : '/gc/dashboard');
  };

  const inputClass = (field) =>
    `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-slate-200'
    }`;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link to={gcId ? `/gc/${gcId}/subs` : '/gc/dashboard'} className="hover:text-teal-600 transition-colors">
          {gc ? gc.company_name : 'Back'}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Add Subcontractor</span>
      </nav>

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Add Subcontractor</h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i < step ? 'bg-teal-500 text-white' :
              i === step ? 'bg-teal-600 text-white' :
              'bg-slate-200 text-slate-500'
            }`}>
              {i < step ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-teal-600' : 'text-slate-400'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-teal-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Company Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Company Name *" error={errors.company_name}>
                <input value={form.company_name} onChange={(e) => set('company_name', e.target.value)} className={inputClass('company_name')} placeholder="e.g. Precision Electric LLC" />
              </Field>
              <Field label="DBA / Business Name" error={errors.business_name_dba}>
                <input value={form.business_name_dba} onChange={(e) => set('business_name_dba', e.target.value)} className={inputClass('business_name_dba')} placeholder="If different from legal name" />
              </Field>
              <Field label="Contact Name *" error={errors.contact_name}>
                <input value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} className={inputClass('contact_name')} placeholder="e.g. James Hartley" />
              </Field>
              <Field label="Contact Email *" error={errors.contact_email}>
                <input type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} className={inputClass('contact_email')} placeholder="james@company.com" />
              </Field>
              <Field label="Phone *" error={errors.contact_phone}>
                <input type="tel" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} className={inputClass('contact_phone')} placeholder="(208) 555-0000" />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">W-9 Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="Tax Classification" error={errors.tax_classification}>
                  <select value={form.tax_classification} onChange={(e) => set('tax_classification', e.target.value)} className={inputClass('tax_classification')}>
                    {TAX_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="EIN (XX-XXXXXXX)" error={errors.ein}>
                <input value={form.ein} onChange={(e) => set('ein', e.target.value)} className={inputClass('ein')} placeholder="82-1234567" />
              </Field>
              <Field label="Street Address *" error={errors.address}>
                <input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass('address')} placeholder="890 N Cole Rd" />
              </Field>
              <Field label="City" error={errors.city}>
                <input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass('city')} placeholder="Boise" />
              </Field>
              <Field label="State" error={errors.state}>
                <input value={form.state} onChange={(e) => set('state', e.target.value)} className={inputClass('state')} placeholder="ID" />
              </Field>
              <Field label="ZIP Code *" error={errors.zip}>
                <input value={form.zip} onChange={(e) => set('zip', e.target.value)} className={inputClass('zip')} placeholder="83704" />
              </Field>
            </div>
            {form.tax_classification === 'sole_proprietor' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 font-medium">
                  Idaho Code 72-216: Sole proprietors may be exempt from Workers' Comp, but the GC remains liable. Recommend requiring coverage.
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Insurance Agent Information</h2>
            <p className="text-sm text-slate-500 mb-4">
              Provide the insurance agent's contact info. CoverVerifi will send verification emails directly to the agent.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Agent Name" error={errors.agent_name}>
                <input value={form.agent_name} onChange={(e) => set('agent_name', e.target.value)} className={inputClass('agent_name')} placeholder="e.g. Kevin Brewer" />
              </Field>
              <Field label="Agency Name" error={errors.agent_agency}>
                <input value={form.agent_agency} onChange={(e) => set('agent_agency', e.target.value)} className={inputClass('agent_agency')} placeholder="e.g. Idaho Insurance Group" />
              </Field>
              <Field label="Agent Email" error={errors.agent_email}>
                <input type="email" value={form.agent_email} onChange={(e) => set('agent_email', e.target.value)} className={inputClass('agent_email')} placeholder="agent@agency.com" />
              </Field>
              <Field label="Agent Phone" error={errors.agent_phone}>
                <input type="tel" value={form.agent_phone} onChange={(e) => set('agent_phone', e.target.value)} className={inputClass('agent_phone')} placeholder="(208) 555-0000" />
              </Field>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Review & Submit</h2>
            <div className="space-y-3 text-sm">
              <Section title="Company">
                <ReviewRow label="Name" value={form.company_name} />
                {form.business_name_dba && <ReviewRow label="DBA" value={form.business_name_dba} />}
                <ReviewRow label="Contact" value={`${form.contact_name} — ${form.contact_email}`} />
                <ReviewRow label="Phone" value={form.contact_phone} />
              </Section>
              <Section title="W-9 Details">
                <ReviewRow label="Tax Type" value={TAX_OPTIONS.find((o) => o.value === form.tax_classification)?.label} />
                {form.ein && <ReviewRow label="EIN" value={form.ein} />}
                <ReviewRow label="Address" value={`${form.address}, ${form.city}, ${form.state} ${form.zip}`} />
              </Section>
              {form.agent_name && (
                <Section title="Insurance Agent">
                  <ReviewRow label="Agent" value={`${form.agent_name} — ${form.agent_agency}`} />
                  {form.agent_email && <ReviewRow label="Email" value={form.agent_email} />}
                </Section>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between mt-8 pt-4 border-t border-slate-200">
          <button
            onClick={step === 0 ? () => navigate(-1) : handleBack}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Add Subcontractor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-500 min-w-[80px]">{label}:</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}
