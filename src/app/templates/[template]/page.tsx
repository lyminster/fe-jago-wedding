import { notFound } from "next/navigation";
import { TemplateRoutePreview } from "@/components/template-route-preview";
import type { InvitationTemplate } from "@/components/wedding-data-store";

const templates = ["classic", "minimalist", "floral", "modern"] as const;

function isInvitationTemplate(value: string): value is InvitationTemplate {
  return templates.includes(value as InvitationTemplate);
}

export function generateStaticParams() {
  return templates.map((template) => ({ template }));
}

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;

  if (!isInvitationTemplate(template)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#111714]">
      <TemplateRoutePreview template={template} />
    </main>
  );
}
