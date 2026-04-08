export function validateEmail(email) {
  if (!email) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Invalid email format';
  return null;
}

export function validatePhone(phone) {
  if (!phone) return 'Phone is required';
  const cleaned = phone.replace(/[\s\-().]/g, '');
  if (cleaned.length < 10) return 'Phone must be at least 10 digits';
  return null;
}

export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateEIN(ein) {
  if (!ein) return null; // optional
  const re = /^\d{2}-\d{7}$/;
  if (!re.test(ein)) return 'EIN must be in XX-XXXXXXX format';
  return null;
}

export function validateZip(zip) {
  if (!zip) return 'ZIP code is required';
  const re = /^\d{5}(-\d{4})?$/;
  if (!re.test(zip)) return 'Invalid ZIP code';
  return null;
}

export function validatePolicyNumber(number) {
  if (!number) return 'Policy number is required';
  if (number.length < 3) return 'Policy number too short';
  return null;
}

export function validateDate(dateStr) {
  if (!dateStr) return 'Date is required';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid date';
  return null;
}

export function validateCoverage(amount) {
  if (amount == null || amount === '') return 'Coverage amount is required';
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return 'Must be a positive number';
  return null;
}

export function validateForm(fields) {
  const errors = {};
  let hasError = false;
  for (const [key, { value, validators }] of Object.entries(fields)) {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        errors[key] = error;
        hasError = true;
        break;
      }
    }
  }
  return { errors, isValid: !hasError };
}
