"use client";

import type { BackendOrder } from "@/lib/backend-api";

const SNAP_SCRIPT_ID = "midtrans-snap-script";
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "";
const MIDTRANS_SNAP_URL =
  process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ??
  "https://app.sandbox.midtrans.com/snap/snap.js";

type SnapResultStatus = "closed" | "error" | "pending" | "success";

type SnapResult = {
  payload?: unknown;
  status: SnapResultStatus;
};

type SnapPayOptions = {
  autoCloseDelay?: number;
  enabledPayments?: string[];
  language?: "en" | "id";
  onClose?: () => void;
  onError?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onSuccess?: (result: unknown) => void;
};

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: SnapPayOptions) => void;
    };
  }
}

export async function payWithMidtransSnap(order: BackendOrder): Promise<SnapResult> {
  if (!order.paymentToken) {
    throw new Error("Token pembayaran Midtrans belum tersedia.");
  }

  await ensureSnapScript();

  if (!window.snap) {
    throw new Error("Snap Midtrans belum berhasil dimuat.");
  }

  return new Promise((resolve, reject) => {
    window.snap?.pay(order.paymentToken ?? "", {
      autoCloseDelay: 0,
      enabledPayments: order.paymentMethods?.length
        ? order.paymentMethods
        : [
            "credit_card",
            "bca_va",
            "bni_va",
            "bri_va",
            "permata_va",
            "echannel",
            "other_va",
            "gopay",
            "shopeepay",
          ],
      language: "id",
      onClose: () => resolve({ status: "closed" }),
      onError: (payload) => reject(payload),
      onPending: (payload) => resolve({ payload, status: "pending" }),
      onSuccess: (payload) => resolve({ payload, status: "success" }),
    });
  });
}

function ensureSnapScript() {
  if (!MIDTRANS_CLIENT_KEY) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum diisi."),
    );
  }

  if (typeof window === "undefined") {
    return Promise.reject(new Error("Snap hanya bisa dibuka dari browser."));
  }

  if (window.snap) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(SNAP_SCRIPT_ID);
  if (existingScript) {
    return waitForSnapScript(existingScript as HTMLScriptElement);
  }

  const script = document.createElement("script");
  script.id = SNAP_SCRIPT_ID;
  script.src = MIDTRANS_SNAP_URL;
  script.async = true;
  script.dataset.clientKey = MIDTRANS_CLIENT_KEY;
  document.head.appendChild(script);

  return waitForSnapScript(script);
}

function waitForSnapScript(script: HTMLScriptElement) {
  return new Promise<void>((resolve, reject) => {
    if (window.snap) {
      resolve();
      return;
    }

    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Script Snap Midtrans gagal dimuat.")),
      { once: true },
    );
  });
}
