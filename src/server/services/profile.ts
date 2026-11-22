import type { AuthContext } from "../auth";
import { ApiError, fromDb } from "../errors";

/**
 * Change the signed-in user's display name (as it appears on sheets and in the menu, title included, e.g.
 * "Dr. Jane Doe"). RLS lets a member update only their own row, and only this column.
 */
export async function updateDisplayName(ctx: AuthContext, displayName: string): Promise<void> {
  const { data, error } = await ctx.db
    .from("clinic_members")
    .update({ display_name: displayName })
    .eq("user_id", ctx.userId)
    .select("user_id");
  if (error) throw fromDb(error);
  if (!data || data.length === 0) throw new ApiError("not_a_member", "The user is not a member of any clinic");
}
