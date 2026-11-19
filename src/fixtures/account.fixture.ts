import { test as base, APIRequestContext } from '@playwright/test';
import { TestUser, generateTestUser } from './user-data';

export interface AccountFixtures {
  newUser: TestUser;
  apiContext: APIRequestContext;
  registerUser: (user?: TestUser) => Promise<TestUser>;
}

export const test = base.extend<AccountFixtures>({
  newUser: async ({}, use) => {
    await use(generateTestUser());
  },

  apiContext: async ({ playwright, baseURL }, use) => {
    const apiRoot = process.env.API_URL ?? 'https://automationexercise.com/api';
    const ctx = await playwright.request.newContext({
      baseURL: apiRoot,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(ctx);
    await ctx.dispose();
  },

  registerUser: async ({ page, newUser, baseURL }, use) => {
    const registered: TestUser[] = [];

    const fn = async (user?: TestUser): Promise<TestUser> => {
      const u = user ?? newUser;
      await page.goto(`${baseURL}/login`);
      await page.locator('input[data-qa="signup-name"]').fill(u.name);
      await page.locator('input[data-qa="signup-email"]').fill(u.email);
      await page.getByRole('button', { name: 'Signup' }).click();
      
      // Complete the account-detail form
      await page.locator(u.title === 'Mr' ? '#id_gender1' : '#id_gender2').check();
      await page.locator('input[data-qa="password"]').fill(u.password);
      await page.locator('select[data-qa="days"]').selectOption(u.birthDay);
      await page.locator('select[data-qa="months"]').selectOption(u.birthMonth);
      await page.locator('select[data-qa="years"]').selectOption(u.birthYear);
      await page.locator('input[data-qa="first_name"]').fill(u.firstName);
      await page.locator('input[data-qa="last_name"]').fill(u.lastName);
      await page.locator('input[data-qa="company"]').fill(u.company);
      await page.locator('input[data-qa="address"]').fill(u.address1);
      await page.locator('input[data-qa="address2"]').fill(u.address2);
      await page.locator('select[data-qa="country"]').selectOption(u.country);
      await page.locator('input[data-qa="state"]').fill(u.state);
      await page.locator('input[data-qa="city"]').fill(u.city);
      await page.locator('input[data-qa="zipcode"]').fill(u.zipcode);
      await page.locator('input[data-qa="mobile_number"]').fill(u.mobileNumber);
      
      await page.getByRole('button', { name: /create account/i }).click();
      await page.getByText('Account Created!').waitFor();
      registered.push(u);
      return u;
    };

    await use(fn);

    // Cleanup (log only, no public delete endpoint)
    for (const u of registered) {
      console.log(`[cleanup] account ${u.email} — no public delete endpoint; marked disposable`);
    }
  },
});

export { expect } from '@playwright/test';