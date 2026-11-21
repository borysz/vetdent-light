import { referenceData } from "@/contracts/reference";
import { authenticate } from "@/server/auth";
import { handler, json } from "@/server/http";

export const GET = handler(async (req) => {
  await authenticate(req);
  return json(referenceData);
});
