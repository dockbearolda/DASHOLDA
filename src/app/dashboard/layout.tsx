import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      {/* ml-0 on mobile (sidebar hidden), ml-64 on md+ */}
      <main className="relative w-full ml-0 md:ml-64 min-h-screen overflow-x-hidden">{children}</main>
    </div>
  );
}
