import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Settings() {
  const { user } = useAuth();
  const { success: toastSuccess } = useToast();
  const [activeSection, setActiveSection] = useState('profile');

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
                {' '}<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{'{{policy_type}}'}</code>.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'New Sub Onboarding', desc: 'Sent to agent when a new sub is added' },
                  { label: 'Verification Request', desc: 'Periodic check that policy is still active' },
                  { label: 'Expiration Warning', desc: '30-day advance notice before expiry' },
                  { label: 'Lapsed Notification', desc: 'Alert when insurance has expired' },
                ].map((tmpl) => (
                  <div key={tmpl.label} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{tmpl.label}</p>
                        <p className="text-xs text-slate-500">{tmpl.desc}</p>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
