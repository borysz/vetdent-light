import { z } from "zod";
import { optionalText, requiredText, uuid } from "./common";

const clinicEmail = optionalText(254).refine(
  (value) => value === null || z.email().safeParse(value).success,
  "invalid_email",
);

export const clinicSchema = z.object({
  id: uuid,
  name: z.string(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  street: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
});
export type Clinic = z.infer<typeof clinicSchema>;

export const clinicUpdateSchema = z.object({
  name: requiredText(160),
  postalCode: optionalText(16),
  city: optionalText(120),
  street: optionalText(160),
  phone: optionalText(40),
  email: clinicEmail,
});
export type ClinicUpdate = z.output<typeof clinicUpdateSchema>;
