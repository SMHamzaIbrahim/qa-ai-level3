import { APIRequestContext, APIResponse } from '@playwright/test';
import { z } from 'zod';
import { TestUser } from '../fixtures/user-data';

const ApiMessageSchema = z
  .object({
    responseCode: z.number(),
    message: z.string().optional(),
  })
  .passthrough();

const ProductSchema = z
  .object({
    id: z.union([z.number(), z.string()]),
    name: z.string(),
    price: z.union([z.string(), z.number()]),
  })
  .passthrough();

const ProductsSchema = ApiMessageSchema.extend({
  products: z.array(ProductSchema),
});

const SearchProductsSchema = ApiMessageSchema.extend({
  products: z.array(ProductSchema).optional(),
});

const BrandsSchema = ApiMessageSchema.extend({
  brands: z.array(
    z
      .object({
        id: z.union([z.number(), z.string()]),
        brand: z.string(),
      })
      .passthrough(),
  ),
});

const UserDetailsSchema = ApiMessageSchema.extend({
  user: z
    .object({
      city: z.string(),
    })
    .passthrough(),
});

export type ApiMessage = z.infer<typeof ApiMessageSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ProductsResponse = z.infer<typeof ProductsSchema>;
export type SearchProductsResponse = z.infer<typeof SearchProductsSchema>;
export type BrandsResponse = z.infer<typeof BrandsSchema>;
export type UserDetailsResponse = z.infer<typeof UserDetailsSchema>;

export interface ApiResult<T> {
  httpStatus: number;
  body: T;
}

interface AccountForm {
  [key: string]: string;
  name: string;
  email: string;
  password: string;
  title: string;
  birth_date: string;
  birth_month: string;
  birth_year: string;
  firstname: string;
  lastname: string;
  company: string;
  address1: string;
  address2: string;
  country: string;
  zipcode: string;
  state: string;
  city: string;
  mobile_number: string;
}

function toAccountForm(user: TestUser, city = user.city): AccountForm {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    title: user.title,
    birth_date: user.birthDay,
    birth_month: user.birthMonth,
    birth_year: user.birthYear,
    firstname: user.firstName,
    lastname: user.lastName,
    company: user.company,
    address1: user.address1,
    address2: user.address2,
    country: user.country,
    zipcode: user.zipcode,
    state: user.state,
    city,
    mobile_number: user.mobileNumber,
  };
}

export class AutomationExerciseApi {
  constructor(private readonly request: APIRequestContext) {}

  async getProducts(): Promise<ApiResult<ProductsResponse>> {
    return this.parse(await this.request.get('productsList'), ProductsSchema);
  }

  async searchProducts(term?: string): Promise<ApiResult<SearchProductsResponse>> {
    return this.parse(
      await this.request.post('searchProduct', {
        form: term === undefined ? {} : { search_product: term },
      }),
      SearchProductsSchema,
    );
  }

  async getBrands(): Promise<ApiResult<BrandsResponse>> {
    return this.parse(await this.request.get('brandsList'), BrandsSchema);
  }

  async verifyLogin(email: string, password: string): Promise<ApiResult<ApiMessage>> {
    return this.parse(
      await this.request.post('verifyLogin', { form: { email, password } }),
      ApiMessageSchema,
    );
  }

  async createAccount(user: TestUser): Promise<ApiResult<ApiMessage>> {
    return this.parse(
      await this.request.post('createAccount', { form: toAccountForm(user) }),
      ApiMessageSchema,
    );
  }

  async updateAccount(user: TestUser, city: string): Promise<ApiResult<ApiMessage>> {
    return this.parse(
      await this.request.put('updateAccount', { form: toAccountForm(user, city) }),
      ApiMessageSchema,
    );
  }

  async getUserDetails(email: string): Promise<ApiResult<UserDetailsResponse>> {
    return this.parse(
      await this.request.get('getUserDetailByEmail', { params: { email } }),
      UserDetailsSchema,
    );
  }

  async deleteAccount(user: Pick<TestUser, 'email' | 'password'>): Promise<ApiResult<ApiMessage>> {
    return this.parse(
      await this.request.delete('deleteAccount', {
        form: { email: user.email, password: user.password },
      }),
      ApiMessageSchema,
    );
  }

  async postProductsList(): Promise<ApiResult<ApiMessage>> {
    return this.parse(await this.request.post('productsList'), ApiMessageSchema);
  }

  async putBrandsList(): Promise<ApiResult<ApiMessage>> {
    return this.parse(await this.request.put('brandsList'), ApiMessageSchema);
  }

  async deleteVerifyLogin(): Promise<ApiResult<ApiMessage>> {
    return this.parse(await this.request.delete('verifyLogin'), ApiMessageSchema);
  }

  private async parse<T extends z.ZodTypeAny>(
    response: APIResponse,
    schema: T,
  ): Promise<ApiResult<z.infer<T>>> {
    const text = await response.text();
    let payload: unknown;

    try {
      payload = JSON.parse(text);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'invalid JSON';
      throw new Error(`API returned non-JSON content (HTTP ${response.status()}): ${detail}`);
    }

    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || 'response'}: ${issue.message}`)
        .join('; ');
      throw new Error(`API response schema mismatch (HTTP ${response.status()}): ${details}`);
    }

    return { httpStatus: response.status(), body: parsed.data };
  }
}
