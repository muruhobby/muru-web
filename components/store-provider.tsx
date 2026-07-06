"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as cartApi from "@/lib/client/cart";
import { retrieveCustomer } from "@/lib/client/customer";
import type { StoreCart, StoreCustomer } from "@/lib/types";

type StoreValue = {
  cart: StoreCart | null;
  /** False until the first cart fetch from the browser resolves. */
  cartReady: boolean;
  customer: StoreCustomer | null;
  /** False until the first customer fetch from the browser resolves. */
  customerReady: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
  /** Drop the in-memory cart (e.g. right after the cart is completed). */
  clearCart: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}

/**
 * Client-side session state. Cart and customer are fetched directly from
 * Medusa in the browser, so server-rendered pages stay static/cacheable and
 * every session request is visible in the devtools Network tab.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [cartReady, setCartReady] = useState(false);
  const [customer, setCustomer] = useState<StoreCustomer | null>(null);
  const [customerReady, setCustomerReady] = useState(false);

  const refreshCart = useCallback(async () => {
    setCart(await cartApi.retrieveCart());
    setCartReady(true);
  }, []);

  const refreshCustomer = useCallback(async () => {
    setCustomer(await retrieveCustomer());
    setCustomerReady(true);
  }, []);

  // Initial session load — state updates happen in the async callbacks, after
  // the browser round-trips to Medusa resolve.
  useEffect(() => {
    void cartApi.retrieveCart().then((c) => {
      setCart(c);
      setCartReady(true);
    });
    void retrieveCustomer().then((c) => {
      setCustomer(c);
      setCustomerReady(true);
    });
  }, []);

  const addItem = useCallback(async (variantId: string, quantity = 1) => {
    setCart(await cartApi.addToCart(variantId, quantity));
    setCartReady(true);
  }, []);

  const updateItem = useCallback(async (lineId: string, quantity: number) => {
    setCart(await cartApi.updateLineItem(lineId, quantity));
  }, []);

  const removeItem = useCallback(async (lineId: string) => {
    setCart(await cartApi.removeLineItem(lineId));
  }, []);

  const clearCart = useCallback(() => setCart(null), []);

  const value = useMemo(
    () => ({
      cart,
      cartReady,
      customer,
      customerReady,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
      refreshCustomer,
      clearCart,
    }),
    [
      cart,
      cartReady,
      customer,
      customerReady,
      addItem,
      updateItem,
      removeItem,
      refreshCart,
      refreshCustomer,
      clearCart,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
