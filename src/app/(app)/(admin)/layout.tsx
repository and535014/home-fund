import type { ReactNode } from "react";
import { requireAppRouteAccess } from "@/auth/app-access";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAppRouteAccess("admin");

  return children;
}
