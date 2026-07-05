import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

import { ApiErrorCode } from "@/lib/api-types";
import type { ApiErrorPayload, ContactSuccessPayload } from "@/lib/api-types";
import { contactMessageSchema } from "@/lib/contact-schema";
import { SITE } from "@/lib/site-config";

const envSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
  CONTACT_FROM_EMAIL: z.string().min(1).default("Portfolio <onboarding@resend.dev>"),
  CONTACT_TO_EMAIL: z.email().default(SITE.email),
});

function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorPayload> {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function POST(
  request: Request,
): Promise<NextResponse<ContactSuccessPayload | ApiErrorPayload>> {
  const env = envSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
    CONTACT_TO_EMAIL: process.env.CONTACT_TO_EMAIL,
  });
  if (!env.success) {
    return errorResponse(
      503,
      ApiErrorCode.ServiceNotConfigured,
      "Contact form is not configured. Email me directly instead.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, ApiErrorCode.ValidationError, "Request body must be JSON.");
  }

  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      400,
      ApiErrorCode.ValidationError,
      "Invalid form submission.",
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const { name, email, message } = parsed.data;
  const resend = new Resend(env.data.RESEND_API_KEY);
  const sent = await resend.emails.send({
    from: env.data.CONTACT_FROM_EMAIL,
    to: env.data.CONTACT_TO_EMAIL,
    replyTo: email,
    subject: `Portfolio contact — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });

  if (sent.error) {
    return errorResponse(
      502,
      ApiErrorCode.EmailDeliveryFailed,
      "Could not send your message. Email me directly instead.",
    );
  }

  return NextResponse.json({ ok: true });
}
