const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIRTH_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidBirth(birth: string): boolean {
  if (!BIRTH_REGEX.test(birth)) {
    return false;
  }

  const date = new Date(`${birth}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}

export function parseBirthDate(birth: string): Date {
  return new Date(`${birth}T00:00:00.000Z`);
}

export function formatBirthDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
