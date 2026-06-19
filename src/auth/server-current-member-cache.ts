import { cache } from "react";
import { headers } from "next/headers";
import { getCurrentMemberFromHeaders } from "./server-current-member";

export const getCurrentMemberFromServerHeaders = cache(async () => {
  return getCurrentMemberFromHeaders(new Headers(await headers()));
});
