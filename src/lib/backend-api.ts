"use client";

import type {
  InvitationMeta,
  PhotoAsset,
  WeddingData,
} from "@/components/wedding-data-store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";
const SESSION_STORAGE_KEY = "jwo_auth_session_v1";

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorEnvelope = {
  error?: {
    message?: string;
    status?: number;
  };
};

export type BackendUser = {
  createdAt: string;
  email: string;
  fullName: string;
  id: string;
  updatedAt: string;
};

export type BackendInvitation = InvitationMeta & {
  createdAt: string;
  data: WeddingData;
};

export type BackendRSVP = {
  attendanceStatus: string;
  createdAt: string;
  guestCount: number;
  guestName: string;
  id: string;
  invitationId: string;
  reason: string;
};

export type BackendGuestMessage = {
  createdAt: string;
  guestName: string;
  id: string;
  invitationId: string;
  isVisible: boolean;
  message: string;
};

export type BackendOrder = {
  amount: number;
  createdAt: string;
  id: string;
  invitationId: string;
  orderCode: string;
  paidAt?: string;
  paymentMethods?: string[];
  paymentToken?: string;
  paymentUrl: string;
  provider: string;
  status: string;
  updatedAt: string;
  userId: string;
};

export type BackendAuthResult = {
  invitation: BackendInvitation;
  token: string;
  user: BackendUser;
};

export type BackendSession = {
  authToken: string;
  invitationId: string;
  user: BackendUser;
  userId: string;
};

type AuthRequest = {
  email: string;
  fullName?: string;
  password: string;
};

export class BackendApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
  }
}

export async function loadWeddingDataFromBackend(
  fallbackData: WeddingData,
): Promise<BackendInvitation> {
  void fallbackData;

  return ensureBackendInvitation();
}

export async function saveWeddingDataToBackend(
  data: WeddingData,
  deletedMediaUrls: string[] = [],
): Promise<BackendInvitation> {
  const invitation = await ensureBackendInvitation(data);

  if (!invitation.canEdit) {
    throw new BackendApiError(
      invitation.editLockedReason ??
        "Undangan ini harus dibayar dulu sebelum bisa diedit.",
      402,
    );
  }

  const updatedInvitation = await apiRequest<BackendInvitation>(
    `/api/users/${invitation.userId}/invitations/${invitation.id}`,
    {
      body: JSON.stringify({ data, deletedMediaUrls }),
      method: "PUT",
    },
  );
  writeInvitationSession(updatedInvitation);

  return updatedInvitation;
}

export async function uploadInvitationPhoto(file: File): Promise<PhotoAsset> {
  const invitation = await ensureBackendInvitation(undefined);

  if (!invitation.canEdit) {
    throw new BackendApiError(
      invitation.editLockedReason ??
        "Undangan ini harus dibayar dulu sebelum bisa diedit.",
      402,
    );
  }

  const storedSession = requireSession();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/api/users/${invitation.userId}/invitations/${invitation.id}/media`,
    {
      body: formData,
      headers: {
        Authorization: `Bearer ${storedSession.authToken}`,
      },
      method: "POST",
    },
  );
  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<PhotoAsset>
    | ApiErrorEnvelope
    | null;

  if (!response.ok) {
    const message =
      (payload as ApiErrorEnvelope | null)?.error?.message ??
      `Backend mengembalikan status ${response.status}.`;
    throw new BackendApiError(message, response.status);
  }

  return (payload as ApiEnvelope<PhotoAsset>).data;
}

export async function loadRsvpsFromBackend(
  fallbackData: WeddingData,
): Promise<{ invitation: BackendInvitation; rsvps: BackendRSVP[] }> {
  void fallbackData;

  const invitation = await ensureBackendInvitation();
  const rsvps = await loadRsvpsForInvitation(invitation);

  return { invitation, rsvps };
}

export async function registerBackendUser(
  request: AuthRequest,
): Promise<BackendAuthResult> {
  const session = await apiRequest<BackendAuthResult>(
    "/api/auth/register",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
    { skipAuth: true },
  );
  writeAuthSession(session);

  return session;
}

export async function loginBackendUser(
  request: Pick<AuthRequest, "email" | "password">,
): Promise<BackendAuthResult> {
  const session = await apiRequest<BackendAuthResult>(
    "/api/auth/login",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
    { skipAuth: true },
  );
  writeAuthSession(session);

  return session;
}

export async function loadCurrentAuthSession(): Promise<BackendAuthResult> {
  const storedSession = requireSession();
  const session = await apiRequest<BackendAuthResult>("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${storedSession.authToken}`,
    },
  });
  writeAuthSession(session);

  return session;
}

export async function loadRsvpsForInvitation(
  invitation: Pick<BackendInvitation, "id" | "userId">,
): Promise<BackendRSVP[]> {
  return apiRequest<BackendRSVP[]>(
    `/api/users/${invitation.userId}/invitations/${invitation.id}/rsvp`,
  );
}

export async function loadPublicInvitationBySlug(
  slug: string,
): Promise<BackendInvitation> {
  return apiRequest<BackendInvitation>(
    `/api/public/invitations/${encodeURIComponent(slug)}`,
    {},
    { skipAuth: true },
  );
}

export async function loadPublicGuestMessages(
  slug: string,
): Promise<BackendGuestMessage[]> {
  return apiRequest<BackendGuestMessage[]>(
    `/api/public/invitations/${encodeURIComponent(slug)}/messages`,
    {},
    { skipAuth: true },
  );
}

export async function createPublicGuestMessage(
  slug: string,
  request: { guestName: string; message: string },
): Promise<BackendGuestMessage> {
  return apiRequest<BackendGuestMessage>(
    `/api/public/invitations/${encodeURIComponent(slug)}/messages`,
    {
      body: JSON.stringify(request),
      method: "POST",
    },
    { skipAuth: true },
  );
}

export async function createPublicRsvp(
  slug: string,
  request: {
    attendanceStatus: string;
    guestCount: number;
    guestName: string;
    reason: string;
  },
): Promise<BackendRSVP> {
  return apiRequest<BackendRSVP>(
    `/api/public/invitations/${encodeURIComponent(slug)}/rsvp`,
    {
      body: JSON.stringify(request),
      method: "POST",
    },
    { skipAuth: true },
  );
}

export async function createPaymentOrder(): Promise<{
  invitation: BackendInvitation;
  order: BackendOrder;
}> {
  const invitation = await ensureBackendInvitation(undefined);
  const order = await apiRequest<BackendOrder>(
    `/api/users/${invitation.userId}/invitations/${invitation.id}/orders`,
    { method: "POST" },
  );

  return { invitation, order };
}

export async function markPaymentPaid(
  order: Pick<BackendOrder, "id" | "invitationId">,
): Promise<{ invitation: BackendInvitation; order: BackendOrder }> {
  const paidOrder = await apiRequest<BackendOrder>(
    `/api/orders/${order.id}/mark-paid`,
    { method: "POST" },
  );
  const session = requireSession();
  const invitation = await apiRequest<BackendInvitation>(
    `/api/users/${session.userId}/invitations/${order.invitationId}`,
  );
  writeInvitationSession(invitation);

  return { invitation, order: paidOrder };
}

export async function syncPaymentOrder(
  order: Pick<BackendOrder, "id" | "invitationId">,
): Promise<{ invitation: BackendInvitation; order: BackendOrder }> {
  const syncedOrder = await apiRequest<BackendOrder>(
    `/api/orders/${order.id}/sync-payment`,
    { method: "POST" },
  );
  const session = requireSession();
  const invitation = await apiRequest<BackendInvitation>(
    `/api/users/${session.userId}/invitations/${order.invitationId}`,
  );
  writeInvitationSession(invitation);

  return { invitation, order: syncedOrder };
}

export function getStoredBackendSession(): BackendSession | null {
  return readSession();
}

export function clearBackendSession() {
  clearSession();
}

export function getBackendErrorMessage(error: unknown) {
  if (error instanceof BackendApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "Gagal terhubung ke server. Silakan coba lagi.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Data belum berhasil disimpan ke backend.";
}

async function ensureBackendInvitation(
  fallbackData?: WeddingData,
): Promise<BackendInvitation> {
  void fallbackData;

  const storedSession = requireSession();

  try {
    const invitation = await apiRequest<BackendInvitation>(
      `/api/users/${storedSession.userId}/invitations/${storedSession.invitationId}`,
    );
    writeInvitationSession(invitation);

    return invitation;
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) {
      const session = await loadCurrentAuthSession();
      return session.invitation;
    }

    if (error instanceof BackendApiError && error.status === 401) {
      clearSession();
    }

    throw error;
  }
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { skipAuth?: boolean } = {},
): Promise<T> {
  const storedSession = !options.skipAuth ? readSession() : null;
  const headers = {
    "Content-Type": "application/json",
    ...(storedSession?.authToken
      ? { Authorization: `Bearer ${storedSession.authToken}` }
      : {}),
    ...init.headers,
  };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | ApiErrorEnvelope
    | null;

  if (!response.ok) {
    const message =
      (payload as ApiErrorEnvelope | null)?.error?.message ??
      `Backend mengembalikan status ${response.status}.`;
    throw new BackendApiError(message, response.status);
  }

  return (payload as ApiEnvelope<T>).data;
}

function requireSession(): BackendSession {
  const session = readSession();
  if (!session) {
    throw new BackendApiError("Silakan login terlebih dahulu.", 401);
  }

  return session;
}

function readSession(): BackendSession | null {
  if (typeof window === "undefined") return null;

  const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as BackendSession;
    if (!session.authToken || !session.userId || !session.invitationId) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function writeAuthSession(session: BackendAuthResult) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      authToken: session.token,
      invitationId: session.invitation.id,
      user: session.user,
      userId: session.user.id,
    } satisfies BackendSession),
  );
}

function writeInvitationSession(invitation: BackendInvitation) {
  if (typeof window === "undefined") return;

  const storedSession = readSession();
  if (!storedSession) return;

  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({
      ...storedSession,
      invitationId: invitation.id,
      userId: invitation.userId,
    } satisfies BackendSession),
  );
}

function clearSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
