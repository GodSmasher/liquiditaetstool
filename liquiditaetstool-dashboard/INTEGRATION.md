# 🚀 Backend Integration - Anleitung

## ✅ Was wurde implementiert

### API Routes (vollständig funktionsfähig):

1. **`GET /api/forderungen`** - Alle Rechnungen laden
   - Mit Filtern: `?status=pending|paid|overdue`
   - Kundensuche: `?customer=Name`
   - Datumsfilter: `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`

2. **`GET /api/forderungen/status`** - KPI-Statistiken

3. **`GET /api/forderungen/[id]`** - Einzelne Rechnung
   - Sucht nach `invoice_number` oder `UUID`

4. **`POST /api/forderungen/[id]/mark-paid`** - Als bezahlt markieren
   - ✅ Funktioniert! Aktualisiert Supabase direkt

5. **`POST /api/forderungen/[id]/send-reminder`** - Mahnung senden
   - ✅ Funktioniert! Aktualisiert `reminder_count` und `last_reminder_sent`
   - TODO: E-Mail-Versand mit Resend kann später hinzugefügt werden

6. **`GET /api/forderungen/[id]/generate-pdf`** - PDF generieren
   - ✅ Funktioniert! Erstellt professionelle PDF-Rechnungen
   - Speichert in Supabase Storage (Bucket: `invoice-pdfs`)

7. **`POST /api/forderungen/sync`** - Backend-Synchronisation
   - ✅ Ruft Backend-API auf: `http://localhost:3001/api/sync/trigger`
   - Mit Fehlerbehandlung & Timeout (30s)

---

## 🔧 Setup

### 1. Environment Variables

Erstelle `.env.local` im Dashboard-Ordner:

```bash
cd liquiditaetstool-dashboard
cp .env.example .env.local
```

Fülle diese Werte aus:

```env
# Supabase (aus Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Backend URL
BACKEND_API_URL=http://localhost:3001
```

### 2. Supabase Storage Setup

Erstelle einen Storage Bucket für PDFs:

1. Gehe zu Supabase Dashboard → Storage
2. Erstelle neuen Bucket: `invoice-pdfs`
3. Setze auf **Public** oder konfiguriere RLS-Policies

### 3. Backend starten

```bash
cd forderungsmanagement-backend
npm run dev
```

Backend läuft auf: `http://localhost:3001`

### 4. Dashboard starten

```bash
cd liquiditaetstool-dashboard
npm run dev
```

Dashboard läuft auf: `http://localhost:3000`

---

## 🧪 Testen

### Dashboard öffnen:
```
http://localhost:3000/dashboard
```

### Test 1: Rechnungen anzeigen
1. Öffne Dashboard
2. Siehst du KPIs mit echten Zahlen? ✅
3. Werden Rechnungen angezeigt? ✅

### Test 2: Detail-Ansicht
1. Klicke auf eine Rechnung
2. Siehst du alle Details? ✅
3. Werden Status-Badges korrekt angezeigt? ✅

### Test 3: Als bezahlt markieren
1. Öffne eine offene Rechnung
2. Klicke "Als bezahlt markieren"
3. Bestätige
4. Status sollte auf "Bezahlt" wechseln ✅

### Test 4: Mahnung senden
1. Öffne eine überfällige Rechnung
2. Klicke "Zahlungserinnerung senden"
3. `reminder_count` sollte erhöht werden ✅
4. `last_reminder_sent` sollte aktualisiert sein ✅

### Test 5: PDF generieren
1. Öffne eine beliebige Rechnung
2. Klicke "PDF herunterladen"
3. PDF sollte heruntergeladen werden ✅
4. Öffne PDF und prüfe Layout ✅

### Test 6: Synchronisation
1. Gehe zu Forderungsmanagement
2. Klicke "Synchronisieren"
3. Backend sollte aufgerufen werden ✅
4. Erfolgs-/Fehlermeldung wird angezeigt ✅

---

## 📊 Funktionsweise

### Datenfluss:

```
┌─────────────────┐
│   Dashboard     │
│  (Next.js UI)   │
└────────┬────────┘
         │
         ├─► GET /api/forderungen
         │   └─► Supabase (invoices table)
         │
         ├─► POST /api/forderungen/sync
         │   └─► Backend API (Port 3001)
         │       └─► SevDesk/Reonic APIs
         │           └─► Updates Supabase
         │
         └─► POST /api/forderungen/[id]/mark-paid
             └─► Supabase UPDATE
```

### Status-Berechnung:

Die Status-Logik läuft automatisch:

```typescript
if (status === 'paid') → 'paid'
else if (due_date < heute) → 'overdue'
else → 'pending'
```

---

## 🔗 Backend Integration

### Sync-Endpoint im Backend

Das Backend muss diesen Endpoint bereitstellen:

```
POST http://localhost:3001/api/sync/trigger
```

**Erwartete Response:**

```json
{
  "success": true,
  "message": "Sync completed successfully",
  "data": {
    "invoices": 24,
    "payments": 15
  }
}
```

### CORS-Konfiguration

Das Backend muss CORS für das Dashboard erlauben:

```javascript
// Im Backend (forderungsmanagement-backend/src/index.ts)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
```

---

## 🎨 Detail-Seite Features

### Aktionen:

1. **Als bezahlt markieren** (`POST /api/forderungen/[id]/mark-paid`)
   - Setzt `status = 'paid'`
   - Aktualisiert `updated_at`
   - Nur für nicht-bezahlte Rechnungen

2. **Mahnung senden** (`POST /api/forderungen/[id]/send-reminder`)
   - Erhöht `reminder_count`
   - Setzt `last_reminder_sent = now()`
   - TODO: E-Mail-Versand hinzufügen

3. **PDF herunterladen** (`GET /api/forderungen/[id]/generate-pdf`)
   - Generiert PDF mit PDFKit
   - Speichert in Supabase Storage
   - Aktualisiert `pdf_url` & `pdf_generated_at`

### Timeline:

Zeigt chronologische Events:
- Erstellt
- Versendet (wenn vorhanden)
- Mahnungen (mit Datum)
- Bezahlt (wenn status = paid)

---

## 🐛 Troubleshooting

### "Backend nicht erreichbar"
```
❌ Backend nicht erreichbar
Das Backend ist nicht erreichbar. Stelle sicher, dass es läuft.
```

**Lösung:**
```bash
cd forderungsmanagement-backend
npm run dev
```

Prüfe: `http://localhost:3001/health`

### "Rechnung nicht gefunden"
```
❌ Rechnung nicht gefunden
```

**Ursachen:**
- ID stimmt nicht (invoice_number vs UUID)
- Rechnung existiert nicht in Supabase

**Lösung:** Prüfe in Supabase, ob die Rechnung existiert.

### "PDF-Generierung fehlgeschlagen"
```
❌ Fehler beim Generieren der PDF
```

**Ursachen:**
- Storage Bucket `invoice-pdfs` existiert nicht
- RLS-Policies blockieren Upload

**Lösung:**
1. Erstelle Bucket in Supabase Dashboard
2. Setze auf Public oder konfiguriere RLS

### "Sync Timeout"
```
❌ Die Synchronisation hat zu lange gedauert (>30s)
```

**Lösung:**
- Backend-Performance prüfen
- Timeout erhöhen in `sync/route.ts`: `AbortSignal.timeout(60000)`

---

## 📝 Nächste Schritte (Optional)

### 1. E-Mail-Versand
```typescript
// In send-reminder/route.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'noreply@volta.de',
  to: invoice.customer_email,
  subject: `${newReminderCount}. Mahnung - Rechnung ${invoice.invoice_number}`,
  html: generateReminderEmail(invoice)
})
```

### 2. Webhook für Echtzeit-Updates
```typescript
// Supabase Realtime
supabase
  .channel('invoices')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, 
    payload => {
      console.log('Invoice updated!', payload)
      // Reload data
    }
  )
  .subscribe()
```

### 3. Batch-Operationen
```typescript
// Mehrere Rechnungen gleichzeitig als bezahlt markieren
POST /api/forderungen/batch/mark-paid
Body: { invoice_ids: ['RE-123', 'RE-124'] }
```

### 4. Export-Funktionen
```typescript
// CSV/Excel Export
GET /api/forderungen/export?format=csv
GET /api/forderungen/export?format=xlsx
```

---

## ✅ Checkliste

- [x] Supabase Environment Variables gesetzt
- [x] Backend läuft auf Port 3001
- [x] Dashboard läuft auf Port 3000
- [x] Storage Bucket erstellt
- [x] Rechnungen werden angezeigt
- [x] Detail-Ansicht funktioniert
- [x] "Als bezahlt markieren" funktioniert
- [x] "Mahnung senden" funktioniert
- [x] PDF-Download funktioniert
- [x] Sync-Button ruft Backend auf
- [ ] E-Mail-Versand (optional)
- [ ] Realtime-Updates (optional)

---

## 📚 API-Dokumentation

Alle Endpoints sind dokumentiert in:
- `src/app/api/forderungen/route.ts`
- `src/app/api/forderungen/[id]/route.ts`
- `src/app/api/forderungen/status/route.ts`
- `src/app/api/forderungen/sync/route.ts`

Jeder Endpoint hat:
- Fehlerbehandlung
- TypeScript Types
- Logging
- Validierung

Viel Erfolg! 🚀

