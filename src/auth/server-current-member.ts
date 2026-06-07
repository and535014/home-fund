import { getPrismaClient } from "../db/prisma";
import {
  resolveCurrentMember,
  type CurrentMemberDataSource,
} from "./current-member";
import { createCurrentMemberDataSource } from "./current-member-data-source";
import { createAuth } from "./index";

type AuthSessionUser = {
  id: string;
  email?: string | null;
};

type AuthSessionResult = {
  user: AuthSessionUser;
} | null;

export type CurrentMemberAuthApi = {
  api: {
    getSession(context: { headers: Headers }): Promise<AuthSessionResult>;
  };
};

export type ResolveCurrentMemberFromRequestInput = {
  headers: Headers;
  auth: CurrentMemberAuthApi;
  dataSource: CurrentMemberDataSource;
};

export async function resolveCurrentMemberFromRequest(
  input: ResolveCurrentMemberFromRequestInput,
) {
  const session = await input.auth.api.getSession({
    headers: input.headers,
  });

  return resolveCurrentMember({
    user: session?.user ?? null,
    dataSource: input.dataSource,
  });
}

export async function getCurrentMember(request: Request) {
  const auth = await createAuth();

  return resolveCurrentMemberFromRequest({
    headers: request.headers,
    auth,
    dataSource: createCurrentMemberDataSource(getPrismaClient()),
  });
}
