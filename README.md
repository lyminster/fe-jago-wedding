# Jago Wedding Frontend

Frontend dashboard dan public invitation untuk Jago Wedding. Aplikasi ini dibangun dengan Next.js App Router, React, Tailwind CSS, Zustand, lucide-react, dan Midtrans Snap client.

## Tech Stack

- Next.js 15 App Router
- React 19
- Tailwind CSS
- Zustand untuk state undangan aktif
- lucide-react untuk icon UI
- Midtrans Snap untuk payment popup

## Struktur Folder

```txt
fe/
|-- public/images/              # Asset landing page dan template
|-- src/app/                    # Route Next.js App Router
|   |-- dashboard/              # Dashboard editor, media, template, RSVP
|   |-- login/                  # Login user
|   |-- register/               # Register user
|   |-- templates/              # Preview template standalone
|   |-- undangan/[slug]/        # Public invitation page
|   `-- api/resolve-map-url/    # Helper resolve Google Maps short URL
|-- src/components/             # Komponen reusable
|-- src/lib/                    # API client, Google Maps, Midtrans
|-- src/middleware.ts           # Rewrite subdomain ke /undangan/:slug
|-- .env.example
|-- .env.local
`-- package.json
```

## Route Utama

```txt
/                         Landing page produk
/login                    Login user
/register                 Register user
/dashboard                Dashboard detail undangan
/dashboard/media          Foto dan media
/dashboard/template       Pilih template dan live preview
/dashboard/rsvp           Tabel RSVP
/templates                Gallery template
/templates/:template      Preview template
/undangan/:slug           Public invitation fallback route
```

Subdomain publik ditangani oleh middleware:

```txt
https://{slug}.jago-wedding.up.railway.app
```

Saat host cocok dengan pola subdomain, request `/` akan di-rewrite ke `/undangan/{slug}`.

## Environment

Copy `.env.example` menjadi `.env.local`.

```bash
NEXT_PUBLIC_API_BASE_URL=https://be-jago-wedding-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://jago-wedding.up.railway.app
NEXT_PUBLIC_PUBLIC_INVITATION_DOMAIN=jago-wedding.up.railway.app
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
```

Untuk production, ubah:

```bash
NEXT_PUBLIC_API_BASE_URL=https://be-jago-wedding-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://jago-wedding.up.railway.app
NEXT_PUBLIC_PUBLIC_INVITATION_DOMAIN=jago-wedding.up.railway.app
```

## Menjalankan Lokal

```bash
cd fe
npm install
npm run dev -- -p 3001
```

Akses:

```txt
http://localhost:3001
```

Contoh subdomain lokal:

```txt
http://citra-rommy.lvh.me:3001
```

## Script

```bash
npm run dev      # menjalankan dev server
npm run lint     # lint frontend
npm run build    # production build
npm run start    # menjalankan hasil build
```

## Integrasi Backend

Frontend memakai `src/lib/backend-api.ts` untuk semua komunikasi API:

- Auth register/login/me
- Load dan save invitation
- Upload foto
- Create/sync payment order
- Load RSVP
- Public invitation, comments, dan RSVP tamu

Session auth disimpan di browser storage sementara untuk kebutuhan MVP.

## Catatan Payment

Payment popup memakai Midtrans Snap script dari:

```txt
NEXT_PUBLIC_MIDTRANS_SNAP_URL
```

Token/payment URL dibuat oleh backend. Frontend hanya membuka popup dan melakukan refresh status order setelah pembayaran selesai.

## Public Invitation Rules

Frontend menampilkan tombol share hanya jika backend metadata menyatakan undangan:

- `paymentStatus === "paid"`
- `status === "active"`
- `expiredAt` belum lewat

Backend tetap menjadi sumber kebenaran untuk memblokir slug/subdomain yang belum aktif atau sudah expired.
