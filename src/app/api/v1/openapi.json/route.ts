import { buildOpenApi } from "@/contracts/openapi";
import { handler, json } from "@/server/http";

export const GET = handler(async () => json(buildOpenApi()));
