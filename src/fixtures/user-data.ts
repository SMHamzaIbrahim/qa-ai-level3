import { randomUUID } from 'crypto';

export interface TestUser {
  name: string;
  email: string;
  password: string;
  title: 'Mr' | 'Mrs' | 'Miss';
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  zipcode: string;
  mobileNumber: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
}

/**
 * Generates a unique, disposable test user.
 * Every call produces a fresh identity to guarantee per-worker isolation (no shared mutable account).
 * The email embeds a UUID so cleanup can find it if needed, and to avoid duplicate-registration collisions.
 */
export function generateTestUser(prefix = 'qa'): TestUser {
  const id = randomUUID();
  const email = `${prefix}.${id}@example-test.invalid`;
  return {
    name: `QA ${id}`,
    email,
    password: `Pw-${id}-Aa1!`,
    title: 'Mr',
    firstName: 'QA',
    lastName: id.toUpperCase(),
    company: 'QA Test Co',
    address1: `1 Test Street ${id}`,
    address2: 'Suite 100',
    country: 'United States',
    state: 'California',
    city: 'Testville',
    zipcode: '90210',
    mobileNumber: '5551234567',
    birthDay: '10',
    birthMonth: '5',
    birthYear: '1990',
  };
}

/**
 * Known seeded credentials used by the public site (documented reference account).
 * Prefer generateTestUser() for all new tests to preserve isolation.
 */
export const SEEDED_USER = {
  email: 'seeded.reference@example-test.invalid',
  password: 'SeededRef!123',
} as const;