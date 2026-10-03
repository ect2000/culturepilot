const messages = {
  CONFIGURATION:
    "Language configuration error: choose an allowed free model. Using deterministic mode.",
  PRICE: "Free model pricing could not be verified. Using deterministic mode.",
  KEY_MISSING:
    "Optional language key is not configured. Using deterministic mode.",
  TIMEOUT: "Language assistant timed out. Using deterministic mode.",
  RATE_LIMIT: "Free language capacity is busy. Using deterministic mode.",
  UNAVAILABLE: "Language assistant unavailable. Using deterministic mode.",
  INVALID_OUTPUT:
    "Language response did not pass validation. Using deterministic mode.",
  BUDGET: "Language request budget reached. Using deterministic mode.",
  FORM_REQUIRED:
    "Complete the structured form to specify your idea, audience and market.",
  CANCELLED: "Language request cancelled.",
};
export class LanguageError extends Error {
  constructor(public readonly code: keyof typeof messages) {
    super(messages[code]);
    this.name = "LanguageError";
  }
}
