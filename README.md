# ifs24005-pabwe2026-nextjs

Aplikasi **Manajemen Postingan** menggunakan Next.js (App Router, TypeScript), Redux Toolkit, Tailwind CSS v4, Tabler Icons, SweetAlert2, dan Vitest.

API: [Delcom Open API - Posts](https://open-api.delcom.org/docs/1.0/api-posts)

## Fitur

- Autentikasi (Login / Register / Logout) dengan proteksi rute
- Route guard: token tidak valid/kedaluwarsa otomatis diarahkan ke login
- Manajemen profil (ubah nama, email, foto, kata sandi)
- Daftar pengguna dengan pencarian
- Postingan: linimasa, tab "Milik Saya" (`is_me=1`), live search, detail, tambah, ubah, ganti cover, hapus
- Like / unlike, komentar (tambah & hapus komentar sendiri), hapus semua postingan milik sendiri
- Navbar dengan dropdown navigasi dan sidebar responsif (drawer di mobile)

## Menjalankan

```bash
bun install
cp .env.example .env   # lalu sesuaikan bila perlu
bun run dev            # development  -> http://localhost:3000
bun run build && bun run start   # production
```

`bun run dev` / `bun run start` menjalankan `src/server.ts`, yang membaca `APP_PORT`
dari environment proses, lalu `.env`, lalu `.env.example`; bila tidak ada, port 3000.

> `npm install` juga dapat digunakan, tetapi bun adalah package manager utama (lihat `bun.lock`).

## Environment

```
NEXT_PUBLIC_DELCOM_BASEURL=https://open-api.delcom.org/api/v1
APP_PORT=3000
```

## Pengujian

```bash
bun run test        # vitest + coverage v8 (threshold 100%)
bun run lint
bun run typecheck
```

Cakupan kode (statements, branches, functions, lines) dijaga **100%**; hanya `src/types/**`
(definisi tipe), `src/setupTests.ts`, dan berkas konfigurasi yang dikecualikan.

## Struktur utama

```
src/
├── app/                 # Next.js App Router (auth/, (dashboard)/)
├── components/          # Providers (Redux)
├── features/
│   ├── auth/            # api, states, layouts, pages
│   ├── posts/           # api, states, layouts, components, modals, pages
│   └── users/           # api, states, pages
├── helpers/             # apiHelper, toolsHelper
├── hooks/               # useInput, redux (typed hooks)
├── lib/config.ts
├── server.ts            # launcher (APP_PORT)
├── store.ts
└── types/
```

## Catatan API

Endpoint ubah kata sandi mengikuti dokumentasi resmi Delcom: `PUT /users/password`.
