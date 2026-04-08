export function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhone(phone) {
  if (!phone) return '—';
  return phone;
}

export function formatPolicyType(type) {
  const map = { gl: 'General Liability', wc: "Workers' Comp" };
  return map[type] || type;
}

export function formatTaxClassification(classification) {
  const map = {
    sole_proprietor: 'Sole Proprietor',
    c_corp: 'C Corporation',
    s_corp: 'S Corporation',
    partnership: 'Partnership',
    llc_c: 'LLC (C Corp)',
    llc_s: 'LLC (S Corp)',
    llc_p: 'LLC (Partnership)',
    trust_estate: 'Trust/Estate',
    other: 'Other',
  };
  return map[classification] || classification;
}

export function formatEmailType(type) {
  const map = {
    new_sub_onboarding: 'Onboarding',
    verification_request: 'Verification',
    expiration_warning: 'Expiration Warning',
    lapsed_notification: 'Lapsed Alert',
  };
  return map[type] || type;
}

export function truncate(str, maxLength = 30) {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength) + '...';
}

export function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
