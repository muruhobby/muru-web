// Customer auth that runs in the browser. The Medusa SDK persists the JWT in
// localStorage and attaches it to subsequent store requests automatically.

import { sdk } from "../medusa";
import { getErrorMessage } from "../util";
import type { StoreCustomer } from "../types";

export type AuthResult = { error?: string };

export async function retrieveCustomer(): Promise<StoreCustomer | null> {
  const token = await sdk.client.getToken();
  if (!token) return null;
  try {
    const { customer } = await sdk.store.customer.retrieve();
    return customer;
  } catch {
    return null;
  }
}

export async function login(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!email || !password) return { error: "Email and password are required." };
  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    });
    if (typeof token !== "string") {
      return { error: "Unexpected auth response." };
    }
  } catch {
    return { error: "Invalid email or password." };
  }
  return {};
}

export async function signup(input: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<AuthResult> {
  const { email, password, first_name, last_name } = input;
  if (!email || !password) return { error: "Email and password are required." };

  try {
    // 1. Create the auth identity and grab the registration token.
    const token = await sdk.auth.register("customer", "emailpass", {
      email,
      password,
    });

    // 2. Create the customer record using the registration token.
    await sdk.store.customer.create(
      { email, first_name, last_name },
      {},
      { authorization: `Bearer ${token}` }
    );

    // 3. Log in to obtain a token scoped to the new customer; the SDK stores it.
    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    });
    if (typeof loginToken !== "string") {
      return { error: "Unexpected auth response. Try logging in." };
    }
  } catch (e: unknown) {
    const msg = getErrorMessage(e, "Could not create account.");
    if (msg.toLowerCase().includes("already")) {
      return { error: "An account with this email already exists." };
    }
    return { error: msg };
  }
  return {};
}

export async function updateProfile(input: {
  first_name: string;
  last_name: string;
  phone: string;
}): Promise<AuthResult> {
  if (!input.first_name) return { error: "First name is required." };
  try {
    await sdk.store.customer.update({
      first_name: input.first_name,
      last_name: input.last_name || null,
      phone: input.phone || null,
    });
  } catch (e: unknown) {
    return { error: getErrorMessage(e, "Could not save your details.") };
  }
  return {};
}

export async function logout(): Promise<void> {
  try {
    await sdk.auth.logout();
  } catch {
    // Token is cleared below either way.
  }
  await sdk.client.clearToken();
}
