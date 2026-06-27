"use client";

import { create } from "zustand";

export type InvitationTemplate = "classic" | "minimalist" | "floral" | "modern";
export type PersonKey = "bride" | "groom";
export type BankAccountKey = PersonKey;
export type CoupleOrder = "bride-first" | "groom-first";

export type PhotoAsset = {
  id: string;
  name: string;
  url: string;
};

type PersonData = {
  father: string;
  mother: string;
  name: string;
  photo: PhotoAsset | null;
};

type ScheduleData = {
  date: string;
  time: string;
};

type BankAccountData = {
  accountName: string;
  bankName: string;
  number: string;
};

export type LoveStoryItem = {
  date: string;
  description: string;
  id: string;
  photo: PhotoAsset | null;
  title: string;
};

export type RundownItem = {
  date: string;
  description: string;
  endTime: string;
  id: string;
  location: string;
  startTime: string;
  title: string;
};

export type WeddingData = {
  bankAccounts: Record<BankAccountKey, BankAccountData>;
  bride: PersonData;
  coupleOrder: CoupleOrder;
  eventRundown: {
    isVisible: boolean;
    items: RundownItem[];
  };
  groom: PersonData;
  heroLabel: string;
  loveStory: {
    isVisible: boolean;
    items: LoveStoryItem[];
  };
  mapLink: string;
  music: {
    youtubeUrl: string;
  };
  photos: {
    cover: PhotoAsset | null;
    gallery: PhotoAsset[];
  };
  schedule: {
    ceremony: ScheduleData;
    reception: ScheduleData;
  };
  slug: string;
  storyText: string;
  template: {
    draft: InvitationTemplate;
    saved: InvitationTemplate;
  };
  venue: string;
  welcomeText: string;
};

export type InvitationMeta = {
  canEdit: boolean;
  editLockedReason?: string;
  expiredAt?: string;
  id: string;
  paymentStatus: string;
  publishedAt?: string;
  status: string;
  updatedAt: string;
  userId: string;
};

const defaultYoutubeUrl =
  "https://www.youtube.com/watch?v=QZng89VxKWg&list=RDQZng89VxKWg&start_radio=1";

type WeddingDataStore = {
  addGalleryPhotos: (assets: PhotoAsset[]) => void;
  data: WeddingData;
  invitationMeta: InvitationMeta | null;
  removeGalleryPhoto: (id: string) => void;
  saveTemplate: (template: InvitationTemplate) => void;
  selectTemplate: (template: InvitationTemplate) => void;
  setInvitationMeta: (invitationMeta: InvitationMeta | null) => void;
  setWeddingData: (data: WeddingData) => void;
  setCoverPhoto: (asset: PhotoAsset) => void;
  setCouplePhoto: (person: PersonKey, asset: PhotoAsset) => void;
  updateBankAccount: (
    account: BankAccountKey,
    patch: Partial<BankAccountData>,
  ) => void;
  updateCoupleOrder: (coupleOrder: CoupleOrder) => void;
  updateEventInfo: (patch: Partial<Pick<WeddingData, "mapLink" | "venue">>) => void;
  updateMusicLink: (youtubeUrl: string) => void;
  updatePerson: (
    person: PersonKey,
    field: keyof Omit<PersonData, "photo">,
    value: string,
  ) => void;
  updateSchedule: (
    event: keyof WeddingData["schedule"],
    patch: Partial<ScheduleData>,
  ) => void;
  updateSlug: (slug: string) => void;
  updateText: (
    field: "heroLabel" | "storyText" | "welcomeText",
    value: string,
  ) => void;
};

const initialWeddingData: WeddingData = {
  bankAccounts: {
    bride: {
      accountName: "",
      bankName: "",
      number: "",
    },
    groom: {
      accountName: "",
      bankName: "",
      number: "",
    },
  },
  bride: {
    father: "",
    mother: "",
    name: "",
    photo: null,
  },
  coupleOrder: "bride-first",
  groom: {
    father: "",
    mother: "",
    name: "",
    photo: null,
  },
  eventRundown: {
    isVisible: false,
    items: [],
  },
  heroLabel: "",
  loveStory: {
    isVisible: false,
    items: [],
  },
  mapLink: "",
  music: {
    youtubeUrl: defaultYoutubeUrl,
  },
  photos: {
    cover: null,
    gallery: [],
  },
  schedule: {
    ceremony: {
      date: "",
      time: "",
    },
    reception: {
      date: "",
      time: "",
    },
  },
  slug: "",
  storyText: "",
  template: {
    draft: "classic",
    saved: "classic",
  },
  venue: "",
  welcomeText: "",
};

export const useWeddingDataStore = create<WeddingDataStore>((set) => ({
  addGalleryPhotos(assets) {
    set((state) => ({
      data: {
        ...state.data,
        photos: {
          ...state.data.photos,
          gallery: [...state.data.photos.gallery, ...assets].slice(0, 20),
        },
      },
    }));
  },
  data: initialWeddingData,
  invitationMeta: null,
  removeGalleryPhoto(id) {
    set((state) => ({
      data: {
        ...state.data,
        photos: {
          ...state.data.photos,
          gallery: state.data.photos.gallery.filter((photo) => photo.id !== id),
        },
      },
    }));
  },
  saveTemplate(template) {
    set((state) => ({
      data: {
        ...state.data,
        template: {
          ...state.data.template,
          draft: template,
          saved: template,
        },
      },
    }));
  },
  selectTemplate(template) {
    set((state) => ({
      data: {
        ...state.data,
        template: {
          ...state.data.template,
          draft: template,
        },
      },
    }));
  },
  setInvitationMeta(invitationMeta) {
    set({ invitationMeta });
  },
  setWeddingData(data) {
    set({ data: normalizeWeddingData(data) });
  },
  setCoverPhoto(asset) {
    set((state) => ({
      data: {
        ...state.data,
        photos: {
          ...state.data.photos,
          cover: asset,
        },
      },
    }));
  },
  setCouplePhoto(person, asset) {
    set((state) => ({
      data: {
        ...state.data,
        [person]: {
          ...state.data[person],
          photo: asset,
        },
      },
    }));
  },
  updateBankAccount(account, patch) {
    set((state) => ({
      data: {
        ...state.data,
        bankAccounts: {
          ...state.data.bankAccounts,
          [account]: {
            ...state.data.bankAccounts[account],
            ...patch,
          },
        },
      },
    }));
  },
  updateCoupleOrder(coupleOrder) {
    set((state) => ({
      data: {
        ...state.data,
        coupleOrder,
      },
    }));
  },
  updateEventInfo(patch) {
    set((state) => ({
      data: {
        ...state.data,
        ...patch,
      },
    }));
  },
  updateMusicLink(youtubeUrl) {
    set((state) => ({
      data: {
        ...state.data,
        music: {
          ...state.data.music,
          youtubeUrl,
        },
      },
    }));
  },
  updatePerson(person, field, value) {
    set((state) => ({
      data: {
        ...state.data,
        [person]: {
          ...state.data[person],
          [field]: value,
        },
      },
    }));
  },
  updateSchedule(event, patch) {
    set((state) => ({
      data: {
        ...state.data,
        schedule: {
          ...state.data.schedule,
          [event]: {
            ...state.data.schedule[event],
            ...patch,
          },
        },
      },
    }));
  },
  updateSlug(slug) {
    set((state) => ({
      data: {
        ...state.data,
        slug,
      },
    }));
  },
  updateText(field, value) {
    set((state) => ({
      data: {
        ...state.data,
        [field]: value,
      },
    }));
  },
}));

export function createPhotoAsset(file: File): PhotoAsset {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id: randomId,
    name: file.name,
    url: URL.createObjectURL(file),
  };
}

export function normalizeWeddingData(data: WeddingData): WeddingData {
  return {
    ...initialWeddingData,
    ...data,
    bankAccounts: {
      ...initialWeddingData.bankAccounts,
      ...data.bankAccounts,
    },
    bride: {
      ...initialWeddingData.bride,
      ...data.bride,
    },
    eventRundown: {
      ...initialWeddingData.eventRundown,
      ...data.eventRundown,
      items: data.eventRundown?.items ?? [],
    },
    groom: {
      ...initialWeddingData.groom,
      ...data.groom,
    },
    loveStory: {
      ...initialWeddingData.loveStory,
      ...data.loveStory,
      items: data.loveStory?.items ?? [],
    },
    music: {
      ...initialWeddingData.music,
      ...data.music,
      youtubeUrl: data.music?.youtubeUrl?.trim() || defaultYoutubeUrl,
    },
    photos: {
      ...initialWeddingData.photos,
      ...data.photos,
      gallery: data.photos?.gallery ?? [],
    },
    schedule: {
      ...initialWeddingData.schedule,
      ...data.schedule,
      ceremony: {
        ...initialWeddingData.schedule.ceremony,
        ...data.schedule?.ceremony,
      },
      reception: {
        ...initialWeddingData.schedule.reception,
        ...data.schedule?.reception,
      },
    },
    template: {
      ...initialWeddingData.template,
      ...data.template,
    },
  };
}
