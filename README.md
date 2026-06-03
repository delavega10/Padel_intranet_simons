# Padel Intranet

Internt intranet til padelklub – bygget med React, TypeScript, Vite, Tailwind CSS og Supabase.

## Funktioner (v1)

- **Login** – Supabase Auth, kun godkendte brugere
- **Roller** – admin, træner, medarbejder
- **Dashboard** – nyheder, events, hurtige links
- **Nyheder** – læs for alle, CRUD for admin
- **Kalender** – kommende events, admin opretter
- **Dokumenter** – Supabase Storage med kategorier
- **Trænerområde** – træningsnoter (træner + admin)
- **Admin-panel** – nyheder, events, dokumenter, brugere

## Kom i gang

### 1. Frontend

```bash
npm install
cp .env.example .env
# Udfyld VITE_SUPABASE_URL og VITE_SUPABASE_ANON_KEY
npm run dev
```

### 2. Supabase

1. Opret et projekt på [supabase.com](https://supabase.com)
2. Kør SQL fra `supabase/migrations/001_initial_schema.sql` i **SQL Editor**
3. Opret Storage bucket `documents` (hvis SQL ikke opretter den)
4. Opret første bruger under **Authentication → Users**
5. Gør brugeren til admin:

```sql
UPDATE public.profiles
SET approved = true, role = 'admin'
WHERE email = 'din@email.dk';
```

### 3. Deploy til Vercel

1. Push repo til GitHub
2. Importér projekt i Vercel
3. Tilføj miljøvariabler: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy

## Projektstruktur

```
src/
  components/     # UI og layout
  contexts/       # Auth
  lib/            # Supabase client, formatering
  pages/          # Sider + admin-faner
  routes/         # Beskyttede routes
  types/          # TypeScript-typer
supabase/
  migrations/     # Database schema + RLS
```

## Sikkerhed

- Row Level Security på alle tabeller
- Roller gemmes i `profiles` (ikke `user_metadata`)
- Kun godkendte brugere (`approved = true`) får adgang
- Admin: fuld skriveadgang til nyheder, events, dokumenter, brugere
- Trænere: kan oprette/redigere træningsnoter
