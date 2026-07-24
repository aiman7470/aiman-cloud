import { redirect } from "next/navigation";
import { getCurrentUserFromCookies } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { MobileNav } from "@/components/mobile-nav";
import { SessionRefresher } from "@/components/session-refresher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUserFromCookies();
  if (!user) redirect("/login");

  const usedAgg = await prisma.file.aggregate({
    where: { ownerId: user.id, isTrashed: false },
    _sum: { size: true },
  });
  const storageUsed = Number(usedAgg._sum.size || 0);

  return (
    <div className="flex min-h-screen">
      <SessionRefresher />
      <Sidebar storageUsed={storageUsed} storageQuota={Number(user.storageQuota)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar user={{ name: user.name, email: user.email, hasAvatar: Boolean(user.avatarUrl) }} />
        <main className="flex-1 px-5 pb-24 pt-6 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
