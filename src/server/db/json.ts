import type { Json } from "./database.types";

/**
 * A value that was validated by a zod schema (and is therefore plain JSON) as a database `Json`.
 * The one named place of this cast; the database column itself is `jsonb`.
 */
export const asJson = (value: unknown): Json => value as Json;
