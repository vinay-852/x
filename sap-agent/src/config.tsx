// src/config.ts

type SapRuntimeConfig = {
  apiKey: string;
  vectorStoreId: string;
};

declare global {
  interface Window {
    SAP_CONFIG?: Partial<SapRuntimeConfig>;
  }
}

function readFromWindow(): Partial<SapRuntimeConfig> {
  // WordPress plugin injects: window.SAP_CONFIG = { apiKey, vectorStoreId }
  if (typeof window === "undefined") return {};
  return window.SAP_CONFIG ?? {};
}

function readFromEnv(): Partial<SapRuntimeConfig> {
  // Optional fallbacks for local dev/builds
  // Vite: import.meta.env; CRA: process.env
  // Fill whichever you use.
  const env: Partial<SapRuntimeConfig> = {
    apiKey:
      (import.meta as any)?.env?.VITE_OPENAI_API_KEY ??
      (process as any)?.env?.REACT_APP_OPENAI_API_KEY ??
      undefined,
    vectorStoreId:
      (import.meta as any)?.env?.VITE_VECTOR_STORE_ID ??
      (process as any)?.env?.REACT_APP_VECTOR_STORE_ID ??
      undefined,
  };
  return env;
}

function assertConfig(c: Partial<SapRuntimeConfig>): asserts c is SapRuntimeConfig {
  if (!c.apiKey || !c.vectorStoreId) {
    const msg =
      "SAP Helper: Missing config. Provide both apiKey and vectorStoreId. " +
      "When used via WordPress, pass [sap_helper_app api=\"...\" tcode=\"...\"]";
    throw new Error(msg);
  }
}

export function getConfig(): SapRuntimeConfig {
  const merged: Partial<SapRuntimeConfig> = {
    ...readFromEnv(),
    ...readFromWindow(), // shortcode values override env
  };
  assertConfig(merged);
  return merged;
}

// Convenience named exports for existing imports
export const { apiKey: API_KEY, vectorStoreId: VECTOR_STORE_ID } = getConfig();
