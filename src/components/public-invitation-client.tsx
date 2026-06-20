"use client";

import { useEffect, useState } from "react";
import {
  type GuestComment,
  LiveInvitationPreview,
  type RsvpPayload,
} from "@/components/live-invitation-preview";
import {
  type InvitationTemplate,
  type WeddingData,
  useWeddingDataStore,
} from "@/components/wedding-data-store";
import {
  createPublicGuestMessage,
  createPublicRsvp,
  getBackendErrorMessage,
  loadPublicGuestMessages,
  loadPublicInvitationBySlug,
} from "@/lib/backend-api";

function mapGuestMessage(message: {
  createdAt: string;
  guestName: string;
  id: string;
  message: string;
}): GuestComment {
  return {
    id: message.id,
    message: message.message,
    name: message.guestName,
    submittedAt: message.createdAt,
  };
}

export function PublicInvitationClient({
  initialComments,
  initialData,
  initialTemplate,
  recipientName,
  slug,
}: {
  initialComments?: GuestComment[];
  initialData?: WeddingData;
  initialTemplate?: InvitationTemplate;
  recipientName?: string;
  slug: string;
}) {
  const setWeddingData = useWeddingDataStore((state) => state.setWeddingData);
  const [comments, setComments] = useState<GuestComment[]>(initialComments ?? []);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(!initialData);
  const [template, setTemplate] = useState<InvitationTemplate>(
    initialTemplate ?? "classic",
  );

  useEffect(() => {
    if (!initialData) return;

    setWeddingData(initialData);
  }, [initialData, setWeddingData]);

  useEffect(() => {
    if (initialData) return;

    let isMounted = true;

    async function loadInvitation() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [invitation, messages] = await Promise.all([
          loadPublicInvitationBySlug(slug),
          loadPublicGuestMessages(slug),
        ]);

        if (!isMounted) return;

        setWeddingData(invitation.data);
        setTemplate(invitation.data.template.saved);
        setComments((messages ?? []).map(mapGuestMessage));
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(getBackendErrorMessage(error));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadInvitation();

    return () => {
      isMounted = false;
    };
  }, [initialData, setWeddingData, slug]);

  async function handleCommentSubmit(payload: {
    message: string;
    name: string;
  }) {
    const message = await createPublicGuestMessage(slug, {
      guestName: payload.name,
      message: payload.message,
    });
    const nextComment = mapGuestMessage(message);
    setComments((currentComments) => [nextComment, ...currentComments]);

    return nextComment;
  }

  async function handleRsvpSubmit(payload: RsvpPayload) {
    await createPublicRsvp(slug, payload);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f7f3] px-5 text-center text-sm font-semibold text-[#59645d]">
        Memuat undangan...
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f7f3] px-5 text-center">
        <div className="max-w-sm rounded-lg border border-[#e4dfd4] bg-white p-5 shadow-soft">
          <p className="text-lg font-semibold text-[#17211c]">
            Undangan tidak ditemukan
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6e7a72]">
            {errorMessage}
          </p>
        </div>
      </main>
    );
  }

  return (
    <LiveInvitationPreview
      guestComments={comments}
      onGuestCommentSubmit={handleCommentSubmit}
      onRsvpSubmit={handleRsvpSubmit}
      recipientName={recipientName}
      template={template}
      variant="standalone"
    />
  );
}
