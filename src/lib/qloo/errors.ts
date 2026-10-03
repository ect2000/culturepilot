export type QlooErrorCode =
  | "KEY_MISSING"
  | "AUTH"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "MALFORMED"
  | "EMPTY"
  | "BUDGET"
  | "CANCELLED"
  | "PARAMETERS";
export const errorMessages: Record<QlooErrorCode, string> = {
  KEY_MISSING:
    "Live research needs a Qloo connection. The project owner needs to configure QLOO_API_KEY on the server.",
  AUTH: "Qloo couldn't authenticate this connection. The project owner should check the event key and API host.",
  RATE_LIMIT: "Qloo rate limit reached. Please retry shortly.",
  TIMEOUT:
    "Qloo took too long to respond. Your analysis was not fabricated. Please retry.",
  UNAVAILABLE:
    "We couldn't reach Qloo right now. Your analysis was not fabricated. Retry when the service becomes available.",
  MALFORMED:
    "Qloo returned a response we couldn't verify. Please retry; no report was fabricated.",
  EMPTY:
    "We didn't find enough cultural evidence for this brief. Try adding a seed interest or broadening your audience.",
  BUDGET:
    "Research reached its request budget before enough evidence was available. Try a more specific seed.",
  CANCELLED: "Research was stopped. You can start again with the same brief.",
  PARAMETERS:
    "Qloo couldn't resolve this research request. Try a simpler market name or a specific seed entity.",
};
export class QlooError extends Error {
  constructor(public code: QlooErrorCode) {
    super(errorMessages[code]);
    this.name = "QlooError";
  }
}
