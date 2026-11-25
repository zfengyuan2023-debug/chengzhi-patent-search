import type { ServiceErrorCode } from "@/lib/patents/types";

export class ProviderRequestError extends Error {
  readonly code: ServiceErrorCode;
  readonly status?: number;

  constructor(code: ServiceErrorCode, message: string, status?: number) {
    super(message);
    this.name = "ProviderRequestError";
    this.code = code;
    this.status = status;
  }
}
