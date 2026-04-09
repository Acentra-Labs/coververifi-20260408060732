import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/shared/Modal';

const TEMPLATE_LABELS = {
  new_sub_onboarding: { label: 'New Sub Onboarding', desc: 'Sent to agent when a new sub is added' },
  verification_request: { label: 'Verification Request', desc: 'Periodic check that policy is still active' },
  expiration_warning: { label: 'Expiration Warning', desc: '30-day advance notice before expiry' },
  lapsed_notification: { label: 'Lapsed Notification', desc: 'Alert when insurance has expired' },
};

export default function Settings() {
  const { user } = useAuth();
  const { emailTemplates, updateEmailTemplate } = useData();
  const { success: toastSuccess } = useToast();
  const [activeSection, setActiveSection] = useState('profile');
  const [editingTemplate, setEditingTemplate] = useState(null);

  const sections = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'email', label: 'Email Templates' },
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Sidebar nav */}
        <div className="lg:w-48 shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg text-left whitespace-nowrap transition-colors ${
                  activeSection === s.id
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === 'profile' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.full_name}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    defaultValue={user?.company_name}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  />
                </div>
                <button
                  onClick={() => toastSuccess('Profile updated successfully')}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'Policy expiration warnings (30 days)', default: true },
                  { label: 'Lapsed policy alerts', default: true },
                  { label: 'Agent response notifications', default: true },
                  { label: 'New subcontractor added', default: false },
                  { label: 'Weekly compliance summary email', default: true },
                ].map((pref) => (
                  <label key={pref.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-700">{pref.label}</span>
                    <ToggleSwitch defaultChecked={pref.default} />
                  </label>
                ))}
                <button
                  onClick={() => toastSuccess('Notification preferences saved')}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeSection === 'email' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Email Templates</h2>
              <p className="text-sm text-slate-500 mb-4">
                Customize the email templates sent to insurance agents. Templates support variables like
                {' '}<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{'{{sub_name}}'}</code>,
                {' '}<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{'{{gc_name}}'}</code>,
                {' '}<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{'{{policy_type}}'}</code>,
                {' '}<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{'{{agent_name}}'}</code>,
                {' '}<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{'{{verification_link}}'}</code>.
              </p>
              <div className="space-y-4">
                {emailTemplates.map((tmpl) => {
                  const info = TEMPLATE_LABELS[tmpl.type] || { label: tmpl.type, desc: '' };
                  return (
                    <div key={tmpl.type} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{info.label}</p>
                          <p className="text-xs text-slate-500">{info.desc}</p>
                        </div>
                        <button
                          onClick={() => setEditingTemplate(tmpl)}
                          className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Email Template Editor Modal */}
          {editingTemplate && (
            <EditTemplateModal
              template={editingTemplate}
              onClose={() => setEditingTemplate(null)}
              onSave={(subject, body) => {
                updateEmailTemplate(editingTemplate.type, { subject, body });
                toastSuccess('Email template updated');
                setEditingTemplate(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      type="button"
      onClick={() => setChecked(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-teal-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function EditTemplateModal({ template, onClose, onSave }) {
  const info = TEMPLATE_LABELS[template.type] || { label: template.type };
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);

  return (
    <Modal isOpen onClose={onClose} title={`Edit: ${info.label}`} size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subject Line</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-mono"
          />
        </div>
        <p className="text-xs text-slate-400">
          Available variables: {'{{sub_name}}'}, {'{{gc_name}}'}, {'{{agent_name}}'}, {'{{policy_type}}'}, {'{{expiration_date}}'}, {'{{verification_link}}'}
        </p>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(subject, body)}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Save Template
          </button>
        </div>
      </div>
    </Modal>
  );
}
