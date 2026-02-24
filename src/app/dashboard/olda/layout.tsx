/**
 * Layout d'atelier — full-width, sans Sidebar ni Header
 * Surcharge le layout parent dashboard/layout.tsx
 */

export default function OldaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Aucune Sidebar, aucun Header — juste le contenu full-width */}
      <main className="relative min-h-screen w-full">{children}</main>
    </div>
  );
}
