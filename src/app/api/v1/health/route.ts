import { handler, json } from "@/server/http";

export const GET = handler(async () => json({ status: "ok" }));
