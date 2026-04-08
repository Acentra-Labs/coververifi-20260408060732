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

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [gcClients, setGcClients] = useState(initialGCs);
  const [subcontractors, setSubcontractors] = useState(initialSubs);
  const [policies, setPolicies] = useState(initialPolicies);
  const [agents] = useState(initialAgents);
  const [gcSubcontractors, setGcSubcontractors] = useState(initialGcSubs);
  const [certificates] = useState(initialCerts);
  const [emailLogs] = useState(initialEmails);
  const [verifications] = useState(initialVerifications);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [w9Records] = useState(initialW9s);

  const getSubsForGC = useCallback(
    (gcId) => {
      const subIds = gcSubcontractors
        .filter((gs) => gs.gc_id === gcId)
        .map((gs) => gs.sub_id);
      return subcontractors.filter((s) => subIds.includes(s.id));
    },
    [gcSubcontractors, subcontractors]
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

  const value = useMemo(
    () => ({
      gcClients,
      subcontractors,
      policies,
      agents,
      gcSubcontractors,
      certificates,
      emailLogs,
      verifications,
      notifications,
      w9Records,
      complianceRules,
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
    }),
    [
      gcClients, subcontractors, policies, agents, gcSubcontractors,
      certificates, emailLogs, verifications, notifications, w9Records,
      getSubsForGC, getPoliciesForSub, getAgentById, getCertsForSub,
      getEmailsForSub, getVerificationsForSub, getW9ForSub,
      getNotificationsForUser, markNotificationRead,
      addSubcontractor, addGCClient, updateSubcontractor,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
