import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { TemplateWorkspace } from "@/components/template-workspace";

export default function TemplatePage() {
  return (
    <main className="min-h-screen bg-porcelain text-ink">
      <div className="flex min-h-screen">
        <DashboardSidebar active="template" />

        <section className="flex min-w-0 flex-1 flex-col">
          <TemplateWorkspace />
        </section>
      </div>
    </main>
  );
}
