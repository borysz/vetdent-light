import { z } from "zod";
import { uuid } from "./common";

export const loginRequestSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
  /** Non-browser clients can ask for the tokens in the body (browsers use the httpOnly cookie). */
  returnTokens: z.boolean().optional(),
});

export const meResponseSchema = z.object({
  user: z.object({ id: uuid, email: z.string().nullable() }),
  member: z.object({ displayName: z.string(), title: z.string().nullable() }),
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
