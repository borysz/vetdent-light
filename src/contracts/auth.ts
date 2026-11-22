import { z } from "zod";
import { uuid } from "./common";

export const loginRequestSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
  /** Non-browser clients can ask for the tokens in the body (browsers use the httpOnly cookie). */
  returnTokens: z.boolean().optional(),
});

/** Minimum length of a new password (also asked by npm run user:create / user:password). */
export const MIN_PASSWORD_LENGTH = 12;

export const passwordResetRequestSchema = z.object({ email: z.email().max(254) });

export const passwordChangeSchema = z.object({ password: z.string().min(MIN_PASSWORD_LENGTH).max(256) });

export const profileUpdateSchema = z.object({ displayName: z.string().trim().min(1).max(120) });

export const meResponseSchema = z.object({
  user: z.object({ id: uuid, email: z.string().nullable() }),
  /** The name as it appears on sheets, title included (e.g. "Dr. Jane Doe"). */
  member: z.object({ displayName: z.string() }),
  clinic: z.object({ id: uuid, name: z.string() }),
});
export type Me = z.infer<typeof meResponseSchema>;

export const loginResponseSchema = meResponseSchema.extend({
  session: z
    .object({
      accessToken: z.string(),
      refreshToken: z.string(),
      expiresAt: z.number().int().nullable(),
    })
    .optional(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;
