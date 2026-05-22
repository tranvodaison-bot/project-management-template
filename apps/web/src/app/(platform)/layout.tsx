import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SessionProvider } from "next-auth/react";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <Topbar />
        <main className="ml-64 pt-14 min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
