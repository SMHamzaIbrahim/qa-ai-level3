import { test as base, APIRequestContext } from '@playwright/test';
import { TestUser, generateTestUser } from './user-data';
import { AutomationExerciseApi } from '../api/AutomationExerciseApi';
import { log, redact } from '../utils/logger';

export interface AccountFixtures {
  newUser: TestUser;
  apiContext: APIRequestContext;
  api: AutomationExerciseApi;
  trackAccount: (user: TestUser) => void;
  registerUser: (user?: TestUser) => Promise<TestUser>;
  diagnostics: void;
}

export const test = base.extend<AccountFixtures>({
  newUser: async ({ playwright }, use) => {
    void playwright;
    await use(generateTestUser());
  },

  apiContext: async ({ playwright }, use) => {
    const configuredRoot = process.env.API_URL ?? 'https://automationexercise.com/api';
    const apiRoot = configuredRoot.endsWith('/') ? configuredRoot : `${configuredRoot}/`;
    const ctx = await playwright.request.newContext({
      baseURL: apiRoot,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(ctx);
    await ctx.dispose();
  },

  api: async ({ apiContext }, use) => {
    await use(new AutomationExerciseApi(apiContext));
  },

  diagnostics: [
    async ({ page }, use, testInfo) => {
      const consoleErrors: string[] = [];
      const requestFailures: string[] = [];

      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(redact(message.text()));
      });
      page.on('requestfailed', (request) => {
        const url = new URL(request.url());
        const failure = request.failure()?.errorText ?? 'unknown failure';
        requestFailures.push(redact(`${request.method()} ${url.origin}${url.pathname}: ${failure}`));
      });

      await use(undefined);
      if (testInfo.status === testInfo.expectedStatus) return;

      await testInfo.attach('console-errors.json', {
        body: JSON.stringify(consoleErrors, null, 2),
        contentType: 'application/json',
      });
      await testInfo.attach('network-failures.json', {
        body: JSON.stringify(requestFailures, null, 2),
        contentType: 'application/json',
      });
    },
    { auto: true },
  ],

  trackAccount: async ({ api }, use, testInfo) => {
    const accounts = new Map<string, TestUser>();
    await use((user) => accounts.set(user.email, user));

    const cleanupFailures: string[] = [];
    for (const [index, user] of [...accounts.values()].reverse().entries()) {
      try {
        const result = await api.deleteAccount(user);
        const outcome =
          result.body.responseCode === 200
            ? 'deleted'
            : result.body.responseCode === 404
              ? 'not found'
              : `unexpected response code ${result.body.responseCode}`;
        const message = redact(`Account cleanup ${outcome}: ${result.body.message ?? 'no message'}`);
        log.info(message);
        await testInfo.attach(`account-cleanup-${index + 1}.txt`, {
          body: message,
          contentType: 'text/plain',
        });
        if (result.body.responseCode !== 200 && result.body.responseCode !== 404) {
          cleanupFailures.push(message);
        }
      } catch (error) {
        const message = redact(
          `Account cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        log.error(message);
        await testInfo.attach(`account-cleanup-${index + 1}.txt`, {
          body: message,
          contentType: 'text/plain',
        });
        cleanupFailures.push(message);
      }
    }

    if (cleanupFailures.length > 0) {
      throw new Error(cleanupFailures.join('\n'));
    }
  },

  registerUser: async ({ page, newUser, trackAccount }, use) => {
    const fn = async (user?: TestUser): Promise<TestUser> => {
      const u = user ?? newUser;
      await page.goto('/login');
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
      trackAccount(u);
      await page.getByRole('button', { name: /create account/i }).click();
      await page.getByText('Account Created!').waitFor();
      await page.getByRole('link', { name: /continue/i }).click();
      await page.getByRole('link', { name: /logout/i }).waitFor({ state: 'visible' });
      return u;
    };

    await use(fn);
  },
});

export { expect } from '@playwright/test';