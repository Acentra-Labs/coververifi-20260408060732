// Compliance Status Engine
// Powers all status calculations across the app
// Based on Idaho Code §72-216 and standard GL/WC requirements

export const STATUS = {
  COMPLIANT: 'compliant',
  EXPIRING: 'expiring',
  LAPSED: 'lapsed',
  PENDING: 'pending',
  UNDER_VERIFICATION: 'under_verification',
};

export const STATUS_CONFIG = {
  compliant: {
    label: 'Compliant',
    color: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
    border: 'border-emerald-500',
    icon: 'check-circle',
  },
  expiring: {
    label: 'Expiring Soon',
    color: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-500',
    border: 'border-amber-500',
    icon: 'alert-triangle',
  },
  lapsed: {
    label: 'Lapsed',
    color: 'bg-red-100 text-red-800',
    dot: 'bg-red-500',
    border: 'border-red-500',
    icon: 'x-circle',
  },
  pending: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-700',
    dot: 'bg-gray-400',
    border: 'border-gray-400',
    icon: 'clock',
  },
  under_verification: {
    label: 'Under Verification',
    color: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
    border: 'border-blue-500',
    icon: 'search',
  },
};

export const EXPIRING_THRESHOLD_DAYS = 30;

export function daysUntilExpiration(expirationDate) {
  const now = new Date();
  const exp = new Date(expirationDate);
  const diffMs = exp.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function calculatePolicyStatus(expirationDate) {
  const days = daysUntilExpiration(expirationDate);
  if (days < 0) return STATUS.LAPSED;
  if (days <= EXPIRING_THRESHOLD_DAYS) return STATUS.EXPIRING;
  return STATUS.COMPLIANT;
}

export function calculateSubStatus(policies, taxClassification) {
  if (!policies || policies.length === 0) return STATUS.PENDING;

  const glPolicies = policies.filter((p) => p.type === 'gl');
  const wcPolicies = policies.filter((p) => p.type === 'wc');

  const hasGL = glPolicies.length > 0;
  const hasWC = wcPolicies.length > 0;

  // Sole proprietors may be exempt from WC but we flag them
  const wcRequired = taxClassification !== 'sole_proprietor';

  if (!hasGL) return STATUS.PENDING;
  if (wcRequired && !hasWC) return STATUS.UNDER_VERIFICATION;

  const allPolicies = wcRequired ? [...glPolicies, ...wcPolicies] : glPolicies;
  const statuses = allPolicies.map((p) => calculatePolicyStatus(p.expiration_date));

  if (statuses.some((s) => s === STATUS.LAPSED)) return STATUS.LAPSED;
  if (statuses.some((s) => s === STATUS.EXPIRING)) return STATUS.EXPIRING;
  return STATUS.COMPLIANT;
}

export function getComplianceStats(subs) {
  const stats = {
    total: subs.length,
    compliant: 0,
    expiring: 0,
    lapsed: 0,
    pending: 0,
    under_verification: 0,
  };

  subs.forEach((sub) => {
    const status = sub.status || STATUS.PENDING;
    if (stats[status] !== undefined) {
      stats[status]++;
    }
  });

  stats.complianceRate =
    stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0;

  return stats;
}

export function getComplianceBarSegments(stats) {
  if (stats.total === 0) return [];
  return [
    { status: 'compliant', count: stats.compliant, pct: (stats.compliant / stats.total) * 100 },
    { status: 'expiring', count: stats.expiring, pct: (stats.expiring / stats.total) * 100 },
    { status: 'lapsed', count: stats.lapsed, pct: (stats.lapsed / stats.total) * 100 },
    { status: 'pending', count: stats.pending, pct: (stats.pending / stats.total) * 100 },
    {
      status: 'under_verification',
      count: stats.under_verification,
      pct: (stats.under_verification / stats.total) * 100,
    },
  ].filter((s) => s.count > 0);
}

export function isSoleProprietor(taxClassification) {
  return taxClassification === 'sole_proprietor';
}

export function getIdahoWCWarning(taxClassification) {
  if (isSoleProprietor(taxClassification)) {
    return 'Idaho Code §72-216: Sole proprietors may be exempt from WC, but the GC remains liable for injuries. Recommend requiring coverage.';
  }
  return null;
}

export function sortByComplianceUrgency(subs) {
  const priority = { lapsed: 0, expiring: 1, under_verification: 2, pending: 3, compliant: 4 };
  return [...subs].sort(
    (a, b) => (priority[a.status] ?? 5) - (priority[b.status] ?? 5)
  );
}
