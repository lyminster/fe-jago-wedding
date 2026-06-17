import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { InvitationTemplate } from "@/components/wedding-data-store";

const templates: Array<{
  description: string;
  href: `/templates/${InvitationTemplate}`;
  image: string;
  name: string;
}> = [
  {
    description: "Nuansa ballroom yang elegan dengan tipografi serif.",
    href: "/templates/classic",
    image: "/images/template-classic.png",
    name: "Classic Elegant",
  },
  {
    description: "Tampilan bersih, terang, dan modern untuk foto outdoor.",
    href: "/templates/minimalist",
    image: "/images/template-minimalist.png",
    name: "Minimalist White",
  },
  {
    description: "Romantis dengan sentuhan floral dan font script.",
    href: "/templates/floral",
    image: "/images/template-floral.png",
    name: "Floral Romantic",
  },
  {
    description: "Gelap, cinematic, dan cocok untuk konsep malam.",
    href: "/templates/modern",
    image: "/images/template-modern.png",
    name: "Modern Dark",
  },
];

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed] px-5 py-8 text-[#17211c] md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#9a6d1d]">
              Template undangan
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
              Pilih style landing page yang ingin dilihat.
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#ded3c0] bg-white px-4 text-sm font-semibold shadow-soft hover:bg-[#fbfaf6]"
          >
            Kembali
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => (
            <Link
              key={template.href}
              href={template.href}
              className="group rounded-lg border border-[#e5dccd] bg-white p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mx-auto aspect-[1320/2868] w-full max-w-[210px] overflow-hidden rounded-[28px] border-[7px] border-[#222824] bg-[#111714] shadow-xl">
                <Image
                  src={template.image}
                  alt={`Preview ${template.name}`}
                  width={1320}
                  height={2868}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{template.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#657067]">
                    {template.description}
                  </p>
                </div>
                <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17211c] text-white transition group-hover:bg-[#bd8b32]">
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
