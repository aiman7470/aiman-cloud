import { redirect } from "next/navigation";
import { getCurrentUserFromCookies } from "@/lib/session";

export default async function RootPage() {
  const user = await getCurrentUserFromCookies();
  redirect(user ? "/dashboard" : "/login");
}
