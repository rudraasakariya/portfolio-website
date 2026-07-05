export enum ApiErrorCode {
  ValidationError = "VALIDATION_ERROR",
  EmailDeliveryFailed = "EMAIL_DELIVERY_FAILED",
  ServiceNotConfigured = "SERVICE_NOT_CONFIGURED",
}

export interface ApiErrorPayload {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface ContactSuccessPayload {
  ok: true;
}
