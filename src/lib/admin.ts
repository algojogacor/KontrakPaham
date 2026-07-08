import { getCurrentUser } from "@/lib/auth";
import { getEffectivePlan } from "@/lib/quota";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || getEffectivePlan(user) !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
