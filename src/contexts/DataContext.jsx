import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  gcClients as initialGCs,
  subcontractors as initialSubs,
  insurancePolicies as initialPolicies,
  insuranceAgents as initialAgents,
  gcSubcontractors as initialGcSubs,
  certificates as initialCerts,
  emailLogs as initialEmails,
  verificationHistory as initialVerifications,
  notifications as initialNotifications,
  w9Records as initialW9s,
  complianceRules,
} from '../data/mockData';
import { calculateSubStatus } from '../utils/compliance';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [gcClients, setGcClients] = useState(initialGCs);
  const [subcontractors, setSubcontractors] = useState(initialSubs);
  const [policies, setPolicies] = useState(initialPolicies);
  const [agents] = useState(initialAgents);
  const [gcSubcontractors, setGcSubcontractors] = useState(initialGcSubs);
  const [certificates, setCertificates] = useState(initialCerts);
  const [emailLogs, setEmailLogs] = useState(initialEmails);
  const [verifications] = useState(initialVerifications);
  const [emailTemplates, setEmailTemplates] = useState([
    { type: 'new_sub_onboarding', subject: 'Insurance Certificate Request — {{sub_name}}', body: 'Dear {{agent_name}},\n\nWe are writing to request a Certificate of Insurance for {{sub_name}}, a subcontractor working with {{gc_name}}.\n\nPlease provide:\n- General Liability certificate\n- Workers\' Compensation certificate\n\nYou can upload certificates directly using the secure link below:\n{{verification_link}}\n\nThank you for your prompt attention.\n\nBest regards,\nCoverVerifi on behalf of {{gc_name}}' },
    { type: 'verification_request', subject: 'Insurance Verification — {{sub_name}}', body: 'Dear {{agent_name}},\n\nWe need to verify the current insurance status for {{sub_name}} ({{policy_type}}).\n\nPlease confirm whether the policy is still active by clicking the link below:\n{{verification_link}}\n\nThank you,\nCoverVerifi on behalf of {{gc_name}}' },
    { type: 'expiration_warning', subject: 'Insurance Expiring Soon — {{sub_name}}', body: 'Dear {{agent_name}},\n\nThis is a reminder that the {{policy_type}} policy for {{sub_name}} expires on {{expiration_date}}.\n\nPlease arrange for renewal and upload the updated certificate:\n{{verification_link}}\n\nThank you,\nCoverVerifi on behalf of {{gc_name}}' },
    { type: 'lapsed_notification', subject: 'URGENT: Insurance Lapsed — {{sub_name}}', body: 'Dear {{agent_name}},\n\nThe {{policy_type}} policy for {{sub_name}} has expired as of {{expiration_date}}.\n\n{{gc_name}} requires active insurance coverage for all subcontractors. Please provide an updated certificate immediately:\n{{verification_link}}\n\nThank you,\nCoverVerifi on behalf of {{gc_name}}' },
  ]);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [w9Records, setW9Records] = useState(initialW9s);

  // Compute dynamic status for all subcontractors based on actual policy dates
  const subcontractorsWithStatus = useMemo(() => {
    return subcontractors.map((sub) => {
      const subPolicies = policies.filter((p) => p.sub_id === sub.id);
      const computedStatus = calculateSubStatus(subPolicies, sub.tax_classification);
      return { ...sub, status: computedStatus };
    });
  }, [subcontractors, policies]);

  const getSubsForGC = useCallback(
    (gcId) => {
      const subIds = gcSubcontractors
        .filter((gs) => gs.gc_id === gcId)
        .map((gs) => gs.sub_id);
      return subcontractorsWithStatus.filter((s) => subIds.includes(s.id));
    },
    [gcSubcontractors, subcontractorsWithStatus]
  );

  const getPoliciesForSub = useCallback(
    (subId) => policies.filter((p) => p.sub_id === subId),
    [policies]
  );

  const getAgentById = useCallback(
    (agentId) => agents.find((a) => a.id === agentId),
    [agents]
  );

  const getCertsForSub = useCallback(
    (subId) => certificates.filter((c) => c.sub_id === subId),
    [certificates]
  );

  const getEmailsForSub = useCallback(
    (subId) => emailLogs.filter((e) => e.sub_id === subId),
    [emailLogs]
  );

  const getVerificationsForSub = useCallback(
    (subId) => verifications.filter((v) => v.sub_id === subId),
    [verifications]
  );

  const getW9ForSub = useCallback(
    (subId) => w9Records.find((w) => w.sub_id === subId),
    [w9Records]
  );

  const getNotificationsForUser = useCallback(
    (userId) => notifications.filter((n) => n.user_id === userId),
    [notifications]
  );

  const markNotificationRead = useCallback((notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  }, []);

  const addSubcontractor = useCallback(
    (subData, gcId) => {
      const newSub = {
        ...subData,
        id: `sub-${String(subcontractors.length + 1).padStart(3, '0')}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSubcontractors((prev) => [...prev, newSub]);
      if (gcId) {
        setGcSubcontractors((prev) => [
          ...prev,
          { gc_id: gcId, sub_id: newSub.id, created_at: new Date().toISOString() },
        ]);
      }
      return newSub;
    },
    [subcontractors]
  );

  const addGCClient = useCallback(
    (gcData) => {
      const newGC = {
        ...gcData,
        id: `gc-${String(gcClients.length + 1).padStart(3, '0')}`,
        role: 'gc',
        active_jobs: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setGcClients((prev) => [...prev, newGC]);
      return newGC;
    },
    [gcClients]
  );

  const updateSubcontractor = useCallback((subId, updates) => {
    setSubcontractors((prev) =>
      prev.map((s) =>
        s.id === subId ? { ...s, ...updates, updated_at: new Date().toISOString() } : s
      )
    );
  }, []);

  const addPolicy = useCallback(
    (policyData) => {
      const newPolicy = {
        ...policyData,
        id: `pol-${String(policies.length + 1).padStart(3, '0')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPolicies((prev) => [...prev, newPolicy]);
      return newPolicy;
    },
    [policies]
  );

  const sendVerificationEmail = useCallback(
    async (subId, agentId, gcId) => {
      // Simulate sending
      await new Promise((r) => setTimeout(r, 1000));
      const sub = subcontractorsWithStatus.find((s) => s.id === subId);
      const newEmail = {
        id: `email-${String(emailLogs.length + Date.now()).slice(-6)}`,
        sub_id: subId,
        agent_id: agentId,
        gc_id: gcId,
        type: 'verification_request',
        subject: `Insurance Verification Request — ${sub?.company_name || 'Unknown'}`,
        sent_at: new Date().toISOString(),
        status: 'delivered',
        opened_at: null,
        responded_at: null,
      };
      setEmailLogs((prev) => [...prev, newEmail]);
      return newEmail;
    },
    [subcontractorsWithStatus, emailLogs]
  );

  const addCertificate = useCallback(
    (certData) => {
      const newCert = {
        ...certData,
        id: `cert-${String(certificates.length + 1).padStart(3, '0')}`,
        upload_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setCertificates((prev) => [...prev, newCert]);
      return newCert;
    },
    [certificates]
  );

  const addW9Record = useCallback(
    (w9Data) => {
      const newW9 = {
        ...w9Data,
        id: `w9-${String(w9Records.length + 1).padStart(3, '0')}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setW9Records((prev) => [...prev, newW9]);
      return newW9;
    },
    [w9Records]
  );

  const updateEmailTemplate = useCallback((templateType, updates) => {
    setEmailTemplates((prev) =>
      prev.map((t) => (t.type === templateType ? { ...t, ...updates } : t))
    );
  }, []);

  const value = useMemo(
    () => ({
      gcClients,
      subcontractors: subcontractorsWithStatus,
      policies,
      agents,
      gcSubcontractors,
      certificates,
      emailLogs,
      verifications,
      notifications,
      w9Records,
      complianceRules,
      emailTemplates,
      getSubsForGC,
      getPoliciesForSub,
      getAgentById,
      getCertsForSub,
      getEmailsForSub,
      getVerificationsForSub,
      getW9ForSub,
      getNotificationsForUser,
      markNotificationRead,
      addSubcontractor,
      addGCClient,
      updateSubcontractor,
      addPolicy,
      addCertificate,
      addW9Record,
      sendVerificationEmail,
      updateEmailTemplate,
    }),
    [
      gcClients, subcontractorsWithStatus, policies, agents, gcSubcontractors,
      certificates, emailLogs, verifications, notifications, w9Records, emailTemplates,
      getSubsForGC, getPoliciesForSub, getAgentById, getCertsForSub,
      getEmailsForSub, getVerificationsForSub, getW9ForSub,
      getNotificationsForUser, markNotificationRead,
      addSubcontractor, addGCClient, updateSubcontractor,
      addPolicy, addCertificate, addW9Record, sendVerificationEmail, updateEmailTemplate,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
