import { expect, APIResponse } from '@playwright/test';
import { test as baseTest } from '../../src/fixtures';

// Extend our custom fixtures to include Playwright's base test
const test = baseTest.extend<{}>({});

async function safeJson(response: APIResponse) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Expected JSON but received HTML/Text (Status ${response.status()}):\n${text.substring(0, 100)}...`);
  }
}

test.describe('API - Account & Method Validation', () => {
  test('AE-05 (API): Verify login with valid details @p0', async ({ apiContext, newUser }) => {
    const createRes = await apiContext.post('/createAccount', {
      form: {
        name: newUser.name, email: newUser.email, password: newUser.password,
        title: newUser.title, birth_date: newUser.birthDay, birth_month: newUser.birthMonth,
        birth_year: newUser.birthYear, firstname: newUser.firstName, lastname: newUser.lastName,
        company: newUser.company, address1: newUser.address1, address2: newUser.address2,
        country: newUser.country, zipcode: newUser.zipcode, state: newUser.state,
        city: newUser.city, mobile_number: newUser.mobileNumber,
      },
    });
    const createBody = await safeJson(createRes);
    expect(createBody.responseCode).toBe(201);

    const loginRes = await apiContext.post('/verifyLogin', {
      form: { email: newUser.email, password: newUser.password },
    });
    const loginBody = await safeJson(loginRes);
    expect(loginBody.responseCode).toBe(200);
    expect(loginBody.message).toMatch(/user exists/i);
  });

  test('AE-03 (API): Verify login with invalid details (Negative) @p0', async ({ apiContext }) => {
    const response = await apiContext.post('/verifyLogin', {
      form: { email: 'nonexistent_9999@example-test.invalid', password: 'WrongPassword!' },
    });
    const body = await safeJson(response);
    expect(body.responseCode).toBe(404);
    expect(body.message).toMatch(/user not found/i);
  });

  test('AE-23 (API): Verify DELETE method on verifyLogin is blocked (Negative) @p1', async ({ apiContext }) => {
    const response = await apiContext.delete('/verifyLogin');
    const body = await safeJson(response);
    expect(body.responseCode).toBe(405);
    expect(body.message).toMatch(/this request method is not supported/i);
  });

  test('AE-22 (API): Update User Account @p1', async ({ apiContext, newUser }) => {
    await apiContext.post('/createAccount', {
      form: {
        name: newUser.name, email: newUser.email, password: newUser.password,
        title: newUser.title, birth_date: newUser.birthDay, birth_month: newUser.birthMonth,
        birth_year: newUser.birthYear, firstname: newUser.firstName, lastname: newUser.lastName,
        company: newUser.company, address1: newUser.address1, address2: newUser.address2,
        country: newUser.country, zipcode: newUser.zipcode, state: newUser.state,
        city: newUser.city, mobile_number: newUser.mobileNumber,
      },
    });

    const updatedCity = 'UpdatedCity';
    const updateRes = await apiContext.put('/updateAccount', {
      form: {
        name: newUser.name, email: newUser.email, password: newUser.password,
        title: newUser.title, birth_date: newUser.birthDay, birth_month: newUser.birthMonth,
        birth_year: newUser.birthYear, firstname: newUser.firstName, lastname: newUser.lastName,
        company: newUser.company, address1: newUser.address1, address2: newUser.address2,
        country: newUser.country, zipcode: newUser.zipcode, state: newUser.state,
        city: updatedCity, mobile_number: newUser.mobileNumber,
      },
    });
    
    const updateBody = await safeJson(updateRes);
    expect(updateBody.responseCode).toBe(200);
    expect(updateBody.message).toMatch(/user updated/i);

    const getRes = await apiContext.get('/getUserDetailByEmail', {
      params: { email: newUser.email },
    });
    const getBody = await safeJson(getRes);
    expect(getBody.responseCode).toBe(200);
    expect(getBody.user.city).toBe(updatedCity);
  });
});