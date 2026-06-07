import { getPrismaClient as getRuntimePrismaClient } from "../db/prisma";
import {
  resolveCurrentMember,
  type CurrentMemberDataSource,
} from "./current-member";
import {
  createCurrentMemberDataSource,
  type CurrentMemberPrismaClient,
} from "./current-member-data-source";
import { createAuth as createRuntimeAuth } from "./index";

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

export type CurrentMemberRuntimeFactories = {
  createAuth(): Promise<CurrentMemberAuthApi>;
  getPrismaClient(): CurrentMemberPrismaClient;
};

const defaultRuntimeFactories: CurrentMemberRuntimeFactories = {
  createAuth: createRuntimeAuth,
  getPrismaClient: getRuntimePrismaClient,
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
  return getCurrentMemberFromHeaders(request.headers);
}

export async function getCurrentMemberFromHeaders(
  headers: Headers,
  factories: CurrentMemberRuntimeFactories = defaultRuntimeFactories,
) {
  const auth = await factories.createAuth();

  return resolveCurrentMemberFromRequest({
    headers,
    auth,
    dataSource: createCurrentMemberDataSource(factories.getPrismaClient()),
  });
}
