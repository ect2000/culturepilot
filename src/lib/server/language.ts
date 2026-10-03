import "server-only";
import { SafeLanguageAssistant } from "../llm/assistant";
import {
  DEFAULT_FREE_MODEL,
  OpenRouterProvider,
  validateFreeModels,
} from "../llm/openrouter";
import { LanguageError } from "../llm/errors";
export function languageConfig() {
  const integer = (
    name: string,
    fallback: number,
    min: number,
    max: number,
  ) => {
    const value = Number(process.env[name] || fallback);
    return Number.isFinite(value)
      ? Math.min(max, Math.max(min, Math.floor(value)))
      : fallback;
  };
  return {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.LLM_MODEL || DEFAULT_FREE_MODEL,
    fallbackModel: process.env.LLM_FALLBACK_MODEL || "openrouter/free",
    timeoutMs: integer("LLM_TIMEOUT_MS", 4000, 500, 5000),
    maxRetries: integer("LLM_MAX_RETRIES", 0, 0, 1),
    siteUrl: process.env.APP_URL,
  };
}
export function languageStatus() {
  const config = languageConfig();
  try {
    validateFreeModels(config.model, config.fallbackModel);
  } catch {
    return {
      status: "configuration-error",
      configured: Boolean(config.apiKey),
      model: config.model,
      message: new LanguageError("CONFIGURATION").message,
    };
  }
  return {
    status: config.apiKey ? "configured" : "optional",
    configured: Boolean(config.apiKey),
    model: config.model,
    message: config.apiKey
      ? "Free language assistance configured; availability is checked per request."
      : "Optional language key is not configured. Using deterministic mode.",
  };
}
export function createLanguageAssistant(signal?: AbortSignal) {
  const config = languageConfig();
  try {
    validateFreeModels(config.model, config.fallbackModel);
    return new SafeLanguageAssistant(
      config.apiKey ? new OpenRouterProvider({ ...config, signal }) : undefined,
    );
  } catch (error) {
    return new SafeLanguageAssistant(
      undefined,
      error instanceof LanguageError
        ? error
        : new LanguageError("CONFIGURATION"),
    );
  }
}
