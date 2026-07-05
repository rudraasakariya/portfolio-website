"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";

import type { ApiErrorPayload } from "@/lib/api-types";
import { burstConfetti } from "@/lib/confetti";
import { contactMessageSchema } from "@/lib/contact-schema";
import type { ContactMessage } from "@/lib/contact-schema";
import { API_ROUTES } from "@/lib/site-config";
import { soundManager } from "@/lib/sound-manager";

interface SentState {
  name: string;
  email: string;
}

const GENERIC_ERROR = "Something went wrong. Email me directly instead.";

const SWAP_SPRING = { type: "spring", stiffness: 260, damping: 24 } as const;

export function ContactForm(): React.JSX.Element {
  const [sent, setSent] = useState<SentState | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessage>({
    resolver: zodResolver(contactMessageSchema),
  });

  const celebrate = (): void => {
    soundManager.play("success");
    const rect = cardRef.current?.getBoundingClientRect();
    burstConfetti(
      rect ? rect.left + rect.width / 2 : undefined,
      rect ? rect.top + rect.height / 3 : undefined,
    );
  };

  const onSubmit = async (data: ContactMessage): Promise<void> => {
    setSubmitError(null);
    try {
      const response = await fetch(API_ROUTES.contact, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const payload = (await response.json()) as ApiErrorPayload;
        setSubmitError(payload.error?.message ?? GENERIC_ERROR);
        return;
      }
      setSent({ name: data.name, email: data.email });
      celebrate();
    } catch {
      setSubmitError(GENERIC_ERROR);
    }
  };

  return (
    <div ref={cardRef}>
      <AnimatePresence mode="wait" initial={false}>
        {sent !== null ? (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={SWAP_SPRING}
            className="rounded-[12px] border border-(--border-strong) bg-(--card-bg) p-10 text-center"
          >
            <div className="mb-2 text-[18px] font-semibold text-(--text-primary)">
              Thanks{sent.name ? `, ${sent.name}` : ""} — message sent.
            </div>
            <div className="text-[14px] text-(--text-tertiary)">
              I&apos;ll get back to you at {sent.email} shortly.
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={SWAP_SPRING}
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
            noValidate
            className="flex flex-col gap-4 rounded-[12px] border border-(--border-strong) bg-(--card-bg) p-8"
          >
            <div>
              <label
                htmlFor="contact-name"
                className="mb-[6px] block font-mono text-[12px] font-medium text-(--text-tertiary)"
              >
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                placeholder="Your name"
                className="field"
                {...register("name")}
              />
              {errors.name && (
                <p className="mt-[6px] text-[13px] text-(--accent)">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="mb-[6px] block font-mono text-[12px] font-medium text-(--text-tertiary)"
              >
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                placeholder="you@company.com"
                className="field"
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-[6px] text-[13px] text-(--accent)">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="contact-message"
                className="mb-[6px] block font-mono text-[12px] font-medium text-(--text-tertiary)"
              >
                Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                placeholder="Role, team, or what you'd like to chat about"
                className="field"
                {...register("message")}
              />
              {errors.message && (
                <p className="mt-[6px] text-[13px] text-(--accent)">{errors.message.message}</p>
              )}
            </div>
            {submitError && <p className="text-[13px] text-(--accent)">{submitError}</p>}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.96 }}
              className="cursor-pointer self-start rounded-[8px] border-none bg-(--text-primary) px-[26px] py-3 text-[14px] font-medium text-(--bg-page) disabled:opacity-60"
            >
              {isSubmitting ? "Sending…" : "Send message"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
