import { requireAdminUser } from "@/lib/auth/session";

export async function assertAdminAccess() {
  await requireAdminUser();
}
