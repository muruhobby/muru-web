"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sdk } from "../medusa";
import {
  getAuthHeaders,
  removeAuthToken,
  setAuthToken,
} from "../cookies";
import { getErrorMessage } from "../util";
import type { StoreCustomer } from "../types";

export async function getCustomer(): Promise<StoreCustomer | null> {
  const headers = await getAuthHeaders();
  if (!("authorization" in headers)) return null;
  try {
    const { customer } = await sdk.store.customer.retrieve({}, headers);
    return customer;
  } catch {
    return null;
  }
}

export type AuthState = { error?: string } | null;

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const first_name = String(formData.get("first_name") || "").trim();
  const last_name = String(formData.get("last_name") || "").trim();

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

    // 3. Log in to obtain a token scoped to the new customer, persist it.
    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    });
    if (typeof loginToken !== "string") {
      return { error: "Unexpected auth response. Try logging in." };
    }
    await setAuthToken(loginToken);
  } catch (e: unknown) {
    const msg = getErrorMessage(e, "Could not create account.");
    if (msg.toLowerCase().includes("already")) {
      return { error: "An account with this email already exists." };
    }
    return { error: msg };
  }

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Email and password are required." };

  try {
    const token = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    });
    if (typeof token !== "string") {
      return { error: "Unexpected auth response." };
    }
    await setAuthToken(token);
  } catch {
    return { error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect("/account");
}

export async function logout() {
  await removeAuthToken();
  revalidatePath("/", "layout");
  redirect("/");
}
