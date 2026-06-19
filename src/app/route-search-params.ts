export type AppSearchParams =
  | Promise<Record<string, string | string[] | undefined> | URLSearchParams>
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

export function readSearchParam(
  searchParams:
    | Record<string, string | string[] | undefined>
    | URLSearchParams
    | undefined,
  key: string,
): string | undefined {
  if (!searchParams) {
    return undefined;
  }

  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) ?? undefined;
  }

  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
