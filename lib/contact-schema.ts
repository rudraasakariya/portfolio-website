import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.email("Enter a valid email address").max(320),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;
