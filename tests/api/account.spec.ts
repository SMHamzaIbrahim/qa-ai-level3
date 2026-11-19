import { expect } from '@playwright/test';
import { test } from '../../src/fixtures';

test.describe('API - Account & Method Validation', () => {
  test('AE-05 (API): Verify login with valid details @p0', async ({ api, newUser, trackAccount }) => {
    trackAccount(newUser);
    const create = await api.createAccount(newUser);
    expect(create.body.responseCode).toBe(201);

    const login = await api.verifyLogin(newUser.email, newUser.password);
    expect(login.body.responseCode).toBe(200);
    expect(login.body.message).toMatch(/user exists/i);
  });

  test('AE-03 (API): Verify login with invalid details (Negative) @p0', async ({ api }) => {
    const result = await api.verifyLogin('nonexistent_9999@example-test.invalid', 'WrongPassword!');
    expect(result.body.responseCode).toBe(404);
    expect(result.body.message).toMatch(/user not found/i);
  });

  test('AE-23 (API): Unsupported methods are rejected (Negative) @p1', async ({ api }) => {
    const deleteLogin = await api.deleteVerifyLogin();
    expect(deleteLogin.body.responseCode).toBe(405);
    expect(deleteLogin.body.message).toMatch(/this request method is not supported/i);

    const postProducts = await api.postProductsList();
    expect(postProducts.body.responseCode).toBe(405);
    expect(postProducts.body.message).toMatch(/this request method is not supported/i);

    const putBrands = await api.putBrandsList();
    expect(putBrands.body.responseCode).toBe(405);
    expect(putBrands.body.message).toMatch(/this request method is not supported/i);
  });

  test('AE-22 (API): Create, update, read, and delete an account @p1', async ({ api, newUser, trackAccount }) => {
    trackAccount(newUser);
    const created = await api.createAccount(newUser);
    expect(created.body.responseCode).toBe(201);

    const updatedCity = 'UpdatedCity';
    const updated = await api.updateAccount(newUser, updatedCity);
    expect(updated.body.responseCode).toBe(200);
    expect(updated.body.message).toMatch(/user updated/i);

    const details = await api.getUserDetails(newUser.email);
    expect(details.body.responseCode).toBe(200);
    expect(details.body.user.city).toBe(updatedCity);

    const deleted = await api.deleteAccount(newUser);
    expect(deleted.body.responseCode).toBe(200);
    expect(deleted.body.message).toMatch(/account deleted/i);
  });
});