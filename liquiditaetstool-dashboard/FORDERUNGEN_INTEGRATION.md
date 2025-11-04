# ✅ Forderungsmanagement - Komplett integriert!

Das Forderungsmanagement läuft jetzt **komplett auf Port 3000** direkt im Dashboard!

## 🎯 Was wurde gemacht

### ❌ VORHER (Problem):
- Backend auf Port 3001 (separater Server)
- Frontend auf Port 3000
- CORS-Probleme
- Zwei Prozesse starten nötig

### ✅ JETZT (Lösung):
- **Alles auf Port 3000**
- Next.js API Routes integriert
- Keine CORS-Probleme
- Nur ein Prozess nötig!

## 📁 Neue Struktur

```
liquiditaetstool-dashboard/
├── src/app/
│   ├── api/
│   │   └── forderungen/
│   │       ├── route.ts           ← GET /api/forderungen
│   │       ├── status/
│   │       │   └── route.ts       ← GET /api/forderungen/status
│   │       └── sync/
│   │           └── route.ts       ← POST /api/forderungen/sync
│   └── dashboard/
│       └── forderungsmanagement/
│           └── page.tsx            ← Frontend-Seite
```

## 🚀 So startest du es

### Einfach nur:

```bash
cd liquiditaetstool-dashboard
npm run dev
```

Das war's! Alles läuft auf `http://localhost:3000`

## 📊 Verfügbare Endpunkte

### GET /api/forderungen
Alle Forderungen abrufen

```bash
curl http://localhost:3000/api/forderungen
```

**Response:**
```json
[
  {
    "invoice_id": "SV-2024-0012",
    "customer": "Musterfirma GmbH",
    "amount": 4200,
    "due_date": "2024-11-15",
    "status": "overdue",
    "reminder_level": 1,
    "source": "sevdesk"
  }
]
```

### GET /api/forderungen/status
Status-Übersicht

```bash
curl http://localhost:3000/api/forderungen/status
```

**Response:**
```json
{
  "total_invoices": 6,
  "open_invoices": 3,
  "overdue_invoices": 2,
  "paid_invoices": 1,
  "total_open_amount": 27800,
  "total_overdue_amount": 7400
}
```

### POST /api/forderungen/sync
Manuelle Synchronisation

```bash
curl -X POST http://localhost:3000/api/forderungen/sync
```

## 🎨 Frontend-Seite

**URL:** `http://localhost:3000/dashboard/forderungsmanagement`

**Features:**
- ✅ 4 Stats Cards (Gelb/Schwarz Design)
- ✅ Filter-Buttons (Alle, Offen, Überfällig, Bezahlt)
- ✅ Tabelle mit allen Forderungen
- ✅ "Jetzt synchronisieren" Button
- ✅ Automatisches Laden der Daten

## 🔄 Wie es funktioniert

```
Browser (Port 3000)
├── Dashboard-Seite
│   └── fetch('/api/forderungen')
│
└── Next.js API Routes (gleicher Port!)
    ├── /api/forderungen → Mock-Daten zurückgeben
    ├── /api/forderungen/status → Stats berechnen
    └── /api/forderungen/sync → Sync simulieren
```

## 📊 Aktueller Stand

**Mock-Daten:** 6 Test-Forderungen
- 2x SevDesk (1x überfällig)
- 2x Reonic (alle offen)
- 1x bezahlt
- 1x überfällig mit Mahnstufe 2

## 🔧 Später erweitern

### Schritt 1: SevDesk anbinden
Bearbeite: `src/app/api/forderungen/route.ts`
```typescript
// Statt Mock-Daten:
const response = await fetch('https://my.sevdesk.de/api/v1/Invoice', {
  headers: { 'Authorization': process.env.SEVDESK_API_KEY }
})
```

### Schritt 2: Reonic anbinden
```typescript
const response = await fetch('https://api.reonic.de/v1/invoices', {
  headers: { 'Authorization': `Bearer ${process.env.REONIC_API_KEY}` }
})
```

### Schritt 3: Supabase für Persistenz
Daten in Supabase speichern statt nur in Memory

## ✨ Vorteile dieser Lösung

1. ✅ **Ein Port** - Alles unter localhost:3000
2. ✅ **Keine CORS-Probleme**
3. ✅ **Einfacher Start** - Nur `npm run dev`
4. ✅ **Next.js integriert** - Nutzt Framework-Features
5. ✅ **Schneller** - Keine Netzwerk-Calls zwischen Ports
6. ✅ **Einfacher zu deployen** - Ein Projekt statt zwei

## 🎉 Los geht's!

1. Öffne Dashboard: `http://localhost:3000/dashboard`
2. Klicke auf **"Forderungen"** Button (gelber Gradient)
3. Fertig! Die Seite lädt sofort mit 6 Mock-Forderungen

**Kein Backend-Server nötig!** Alles läuft im Dashboard! 🚀

