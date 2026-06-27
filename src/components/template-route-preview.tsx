"use client";

import { useEffect, useState } from "react";
import { LiveInvitationPreview } from "@/components/live-invitation-preview";
import {
  type InvitationTemplate,
  type WeddingData,
  useWeddingDataStore,
} from "@/components/wedding-data-store";

const galleryPhotos = [
  {
    id: "sample-gallery-1",
    name: "Foto prewedding taman",
    url: "/images/template-floral.png",
  },
  {
    id: "sample-gallery-2",
    name: "Foto ballroom",
    url: "/images/template-classic.png",
  },
  {
    id: "sample-gallery-3",
    name: "Foto outdoor minimalis",
    url: "/images/template-minimalist.png",
  },
  {
    id: "sample-gallery-4",
    name: "Foto malam modern",
    url: "/images/template-modern.png",
  },
];

const templateCovers: Record<InvitationTemplate, string> = {
  classic: "/images/template-classic.png",
  floral: "/images/template-floral.png",
  minimalist: "/images/template-minimalist.png",
  modern: "/images/template-modern.png",
};

const sampleYoutubeUrl =
  "https://www.youtube.com/watch?v=QZng89VxKWg&list=RDQZng89VxKWg&start_radio=1";

function createSampleWeddingData(template: InvitationTemplate): WeddingData {
  return {
    bankAccounts: {
      bride: {
        accountName: "Alya Putri",
        bankName: "BCA",
        number: "1234567890",
      },
      groom: {
        accountName: "Dimas Aditya",
        bankName: "Mandiri",
        number: "9876543210",
      },
    },
    bride: {
      father: "Bapak Hendra",
      mother: "Ibu Ratna",
      name: "Alya Putri",
      photo: {
        id: "sample-bride",
        name: "Foto Alya",
        url: "/images/template-minimalist.png",
      },
    },
    coupleOrder: "bride-first",
    eventRundown: {
      isVisible: true,
      items: [
        {
          date: "2026-07-13",
          description: "Momen sakral bersama keluarga inti.",
          endTime: "10:00",
          id: "sample-rundown-ceremony",
          location: "Gedung Seremoni, Jakarta",
          startTime: "09:00",
          title: "Akad nikah",
        },
        {
          date: "2026-07-13",
          description: "Jamuan makan malam dan ramah tamah bersama tamu.",
          endTime: "21:00",
          id: "sample-rundown-dinner",
          location: "Ballroom Utama",
          startTime: "19:00",
          title: "Resepsi dan makan malam",
        },
      ],
    },
    groom: {
      father: "Bapak Surya",
      mother: "Ibu Melati",
      name: "Dimas Aditya",
      photo: {
        id: "sample-groom",
        name: "Foto Dimas",
        url: "/images/template-modern.png",
      },
    },
    heroLabel: "The Wedding Of",
    loveStory: {
      isVisible: true,
      items: [
        {
          date: "2021-02-14",
          description:
            "Percakapan sederhana setelah dikenalkan sahabat menjadi awal cerita kami.",
          id: "sample-love-first-meet",
          photo: {
            id: "sample-love-photo",
            name: "Awal cerita",
            url: "/images/template-floral.png",
          },
          title: "Awal bertemu",
        },
        {
          date: "2025-12-20",
          description:
            "Di hadapan keluarga, kami memantapkan hati untuk melangkah bersama.",
          id: "sample-love-proposal",
          photo: null,
          title: "Lamaran",
        },
      ],
    },
    mapLink: "https://www.google.com/maps?q=Jakarta&output=embed",
    music: {
      youtubeUrl: sampleYoutubeUrl,
    },
    photos: {
      cover: {
        id: `sample-cover-${template}`,
        name: `Cover ${template}`,
        url: templateCovers[template],
      },
      gallery: galleryPhotos,
    },
    schedule: {
      ceremony: {
        date: "2026-07-13",
        time: "09:00",
      },
      reception: {
        date: "2026-07-13",
        time: "19:00",
      },
    },
    slug: "alya-dimas",
    storyText:
      "Kami bertemu dari percakapan sederhana yang pelan-pelan menjadi rumah. Di hari ini, kami ingin membagikan cerita itu bersama keluarga dan sahabat.",
    template: {
      draft: template,
      saved: template,
    },
    venue: "Gedung Seremoni, Jakarta",
    welcomeText:
      "Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberi doa restu pada hari bahagia kami.",
  };
}

export function TemplateRoutePreview({
  template,
}: {
  template: InvitationTemplate;
}) {
  const setWeddingData = useWeddingDataStore((state) => state.setWeddingData);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setWeddingData(createSampleWeddingData(template));
    setIsReady(true);
  }, [setWeddingData, template]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111714] text-sm font-semibold text-white/70">
        Memuat template...
      </div>
    );
  }

  return <LiveInvitationPreview template={template} variant="standalone" />;
}
