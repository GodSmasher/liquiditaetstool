# 💰 Liquiditätstool Dashboard

14-Tage Liquiditätsprognose für dein Unternehmen mit Next.js 14 und Supabase.

## 🚀 Features

- ✅ **Authentifizierung**: Sicherer Login mit Supabase Auth
- ✅ **Dashboard**: Übersicht über Rechnungen und Liquidität
- ✅ **Echtzeit-Daten**: Automatische Synchronisation mit n8n
- ✅ **Moderne UI**: Tailwind CSS mit Gradient-Designs
- ✅ **TypeScript**: Vollständig typisiert
- ✅ **Server-Side Auth**: Mit @supabase/ssr für maximale Sicherheit

## 📋 Voraussetzungen

- Node.js 18+ installiert
- Supabase Account und Projekt
- n8n läuft auf Port 5678 (optional)

## 🛠️ Installation

1. **Dependencies installieren:**
```bash
npm install
```

2. **Environment Variables einrichten:**
```bash
cp .env.local.example .env.local
```

Fülle die `.env.local` Datei mit deinen Supabase Credentials aus:
- `NEXT_PUBLIC_SUPABASE_URL`: Deine Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Dein Supabase Anon Key

Beide Werte findest du in deinem Supabase Dashboard unter **Settings > API**.

3. **Datenbank-Schema einrichten:**

Erstelle die `invoices` Tabelle in Supabase:

```sql
-- Invoices Tabelle erstellen
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')),
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für schnellere Queries
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Row Level Security (RLS) aktivieren
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Authentifizierte User können alle Rechnungen sehen
CREATE POLICY "Enable read access for authenticated users" 
ON invoices FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Authentifizierte User können Rechnungen erstellen
CREATE POLICY "Enable insert access for authenticated users" 
ON invoices FOR INSERT 
TO authenticated 
WITH CHECK (true);
```

4. **Development Server starten:**
```bash
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000)

## 📁 Projektstruktur

```
liquiditaetstool-dashboard/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── layout.tsx       # Dashboard Layout mit Header
│   │   │   └── page.tsx         # Dashboard Hauptseite
│   │   ├── login/
│   │   │   └── page.tsx         # Login Seite
│   │   ├── layout.tsx           # Root Layout
│   │   ├── page.tsx             # Home (Redirect)
│   │   └── globals.css          # Global Styles
│   └── lib/
│       └── supabase/
│           ├── client.ts        # Supabase Browser Client
│           ├── server.ts        # Supabase Server Client
│           └── middleware.ts    # Supabase Middleware Helper
├── middleware.ts                # Next.js Middleware (Auth Protection)
├── .env.local.example          # Environment Variables Template
└── package.json
```

## 🔐 Authentifizierung

Das Projekt nutzt Supabase Auth mit Server-Side Rendering:

- **Middleware**: Schützt alle Routes außer `/login`
- **Auto-Redirect**: Nicht eingeloggte User → `/login`
- **Auto-Redirect**: Eingeloggte User auf `/login` → `/dashboard`
- **Session Management**: Automatische Token-Aktualisierung

## 📊 Dashboard Features

### Stats Cards
- **Gesamt Rechnungen**: Anzahl aller Rechnungen
- **Offene Rechnungen**: Ausstehende + Überfällige
- **Gesamtumsatz**: Summe aller bezahlten Rechnungen
- **Ausstehend**: Summe aller offenen Rechnungen

### Quick Actions
- Cashflow Analyse (In Entwicklung)
- Neue Rechnung erstellen (In Entwicklung)
- Berichte generieren (In Entwicklung)

### n8n Integration
- Automatische Synchronisation mit n8n Workflows
- Status-Anzeige der letzten Synchronisation
- Link zu n8n Dashboard (localhost:5678)

## 🔄 n8n Workflow Integration

Das Dashboard ist vorbereitet für die Integration mit n8n:

1. n8n läuft auf `http://localhost:5678`
2. Workflows können Rechnungen in die Supabase `invoices` Tabelle schreiben
3. Dashboard lädt automatisch die neuesten Daten

## 🎨 Design System

- **Framework**: Tailwind CSS
- **Farbschema**: Indigo/Purple Gradients
- **Font**: Inter (Google Fonts)
- **Icons**: Heroicons (inline SVG)
- **Shadows**: Moderne Card-Designs
- **Responsive**: Mobile-First Ansatz

## 🧪 Development

```bash
# Dev Server starten
npm run dev

# Production Build
npm run build

# Production Server starten
npm start

# Linting
npm run lint
```

## 📦 Dependencies

- **next**: 14.2.18 - React Framework
- **react**: 18.3.1 - UI Library
- **@supabase/ssr**: Server-Side Rendering für Supabase
- **@supabase/supabase-js**: Supabase Client
- **recharts**: 2.12.7 - Charts (vorbereitet)
- **tailwindcss**: 3.4.14 - CSS Framework
- **typescript**: 5.x - Type Safety

## 🔧 Konfiguration

### Supabase Setup

1. Erstelle ein neues Projekt auf [supabase.com](https://supabase.com)
2. Erstelle die `invoices` Tabelle (siehe SQL oben)
3. Kopiere URL und Anon Key in `.env.local`
4. Optional: Erstelle einen Test-User in Supabase Authentication

### n8n Setup (Optional)

1. n8n läuft via Docker (siehe docker-compose.yml im Root)
2. Workflow zum Schreiben von Rechnungen in Supabase erstellen
3. Webhook oder Schedule für automatische Synchronisation

## 🚧 Roadmap

- [ ] Recharts Integration für Liquiditätsprognose
- [ ] Cashflow Analyse Seite
- [ ] Neue Rechnung erstellen Formular
- [ ] Berichte generieren und exportieren
- [ ] Email Benachrichtigungen bei überfälligen Rechnungen
- [ ] Mobile App (React Native)

## 📝 Lizenz

Private Project - All Rights Reserved

## 👨‍💻 Entwickelt mit

- Next.js 14
- Supabase
- Tailwind CSS
- TypeScript
- n8n (für Workflows)

---

**Viel Erfolg mit deinem Liquiditätstool! 💰**
