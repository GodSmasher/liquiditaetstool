# Forderungsmanagement Backend

Backend-Service für die Synchronisation von Forderungen aus **SevDesk** und **Reonic** für das Liquitool.

## Features

- ✅ Automatische Synchronisation von Rechnungen aus SevDesk und Reonic
- ✅ Status-Berechnung (offen, bezahlt, überfällig)
- ✅ REST API für Forderungsmanagement
- ✅ Täglicher Cronjob für automatische Updates
- ✅ PostgreSQL Datenbank
- ✅ TypeScript + Express

## Technologie-Stack

- **Node.js** (v18+)
- **TypeScript** (v5.3+)
- **Express** (v4.18+)
- **PostgreSQL** (v14+)
- **node-cron** für Cronjobs
- **Winston** für Logging
- **Axios** für API-Calls

## Projektstruktur

```
src/
├── config/          # Konfiguration (Database)
├── connectors/      # API-Connectors für SevDesk & Reonic
├── models/          # TypeScript Datenmodelle
├── services/        # Business Logic
├── routes/          # API-Endpunkte
├── jobs/            # Cronjobs
├── utils/           # Helper-Funktionen
└── index.ts         # Entry Point
```

## Installation

### 1. Dependencies installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Kopiere die Beispiel-Datei und fülle die Werte aus:

```bash
cp env.example .env
```

`.env` Beispiel:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=forderungsmanagement
DB_USER=postgres
DB_PASSWORD=your_password

# SevDesk API
SEVDESK_API_KEY=your_sevdesk_api_key_here
SEVDESK_API_URL=https://my.sevdesk.de/api/v1

# Reonic API
REONIC_API_KEY=your_reonic_api_key_here
REONIC_API_URL=https://api.reonic.de/v1

# Cronjob Configuration
SYNC_CRON_SCHEDULE=0 2 * * *
```

### 3. PostgreSQL Datenbank erstellen

```bash
# PostgreSQL starten
createdb forderungsmanagement

# Oder mit Docker
docker run --name forderungsmanagement-db \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=forderungsmanagement \
  -p 5432:5432 \
  -d postgres:14
```

Die Tabellen werden automatisch beim ersten Start erstellt.

## Development

### Server starten (Development Mode)

```bash
npm run dev
```

Der Server läuft auf `http://localhost:3001`

### Build für Production

```bash
npm run build
npm start
```

## API Endpunkte

### 🏠 Root

```
GET /
```

Zeigt Informationen über die API.

### 💚 Health Check

```
GET /health
```

Gibt Status des Servers zurück.

### 📊 Forderungen

#### Alle Forderungen abrufen

```
GET /api/receivables
```

**Query Parameters:**
- `status` (optional): Filter nach Status (`paid`, `open`, `overdue`)

**Response Beispiel:**

```json
[
  {
    "invoice_id": "SV-2024-0012",
    "customer": "Musterfirma GmbH",
    "amount": 4200,
    "due_date": "2024-11-15",
    "status": "overdue",
    "reminder_level": 1
  }
]
```

#### Status-Übersicht

```
GET /api/receivables/status
```

**Response Beispiel:**

```json
{
  "total_invoices": 24,
  "open_invoices": 8,
  "overdue_invoices": 3,
  "paid_invoices": 13,
  "total_open_amount": 34500,
  "total_overdue_amount": 12800
}
```

#### Einzelne Forderung

```
GET /api/receivables/:id
```

### 🔄 Synchronisation

#### Manuelle Synchronisation auslösen

```
POST /api/sync/trigger
```

Startet eine manuelle Synchronisation von SevDesk und Reonic.

**Response:**

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

## Cronjob

Der Sync-Cronjob läuft standardmäßig **täglich um 2:00 Uhr**.

Schedule anpassen in `.env`:

```env
SYNC_CRON_SCHEDULE=0 2 * * *  # Täglich um 2:00 Uhr
SYNC_CRON_SCHEDULE=*/15 * * * *  # Alle 15 Minuten (Development)
SYNC_CRON_SCHEDULE=0 */4 * * *  # Alle 4 Stunden
```

## API-Integration

### SevDesk

Die SevDesk-Integration verwendet die offizielle API v1:
- Dokumentation: https://api.sevdesk.de/
- API-Key erforderlich

**Aktuell:** Dummy-Daten für Entwicklung
**TODO:** Echte API-Integration implementieren

### Reonic

Die Reonic-Integration benötigt einen API-Key:
- API-URL: https://api.reonic.de/v1
- Bearer Token Authentication

**Aktuell:** Dummy-Daten für Entwicklung
**TODO:** Echte API-Integration implementieren

## Datenmodelle

### Invoice (Rechnung)

```typescript
{
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  net_amount: number;
  tax_amount: number;
  currency: string;
  issue_date: Date;
  due_date: Date;
  status: 'paid' | 'open' | 'overdue' | 'cancelled';
  source: 'sevdesk' | 'reonic';
  source_id: string;
  payment_date?: Date;
  reminder_level: number;
}
```

### Payment (Zahlung)

```typescript
{
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: Date;
  payment_method: 'bank_transfer' | 'card' | 'cash' | 'other';
  reference: string;
  source: 'sevdesk' | 'reonic' | 'manual';
}
```

### Reminder (Mahnung)

```typescript
{
  id: string;
  invoice_id: string;
  level: number; // 1-3
  sent_date: Date;
  due_date: Date;
  amount: number;
  fee: number;
  status: 'sent' | 'pending' | 'cancelled';
}
```

## Logging

Logs werden in der Konsole ausgegeben:

```
2024-11-04 15:30:00 [info] : 🚀 Server running on port 3001
2024-11-04 15:30:05 [info] : ✅ Database initialized
2024-11-04 15:30:05 [info] : 📅 Cronjob scheduled: 0 2 * * *
2024-11-04 15:30:10 [info] : 🔄 Starting synchronization...
2024-11-04 15:30:12 [info] : ✅ Synced 12 SevDesk invoices
2024-11-04 15:30:14 [info] : ✅ Synced 8 Reonic invoices
2024-11-04 15:30:15 [info] : ✅ Sync completed in 5.2s: 20 invoices
```

## Deployment

### Production Build

```bash
npm run build
```

Erstellt optimierte JavaScript-Dateien in `dist/`

### Environment Variables

Stelle sicher, dass alle Environment Variables in Production gesetzt sind:

```bash
export NODE_ENV=production
export DB_HOST=your-db-host
export DB_PASSWORD=your-secure-password
export SEVDESK_API_KEY=your-real-api-key
export REONIC_API_KEY=your-real-api-key
```

## Nächste Schritte

1. **SevDesk API Integration**: Echte API-Calls implementieren
2. **Reonic API Integration**: Echte API-Calls implementieren
3. **Zahlungs-Synchronisation**: Payments von beiden Systemen laden
4. **Mahnung-System**: Automatische Mahnungen generieren
5. **Frontend-Integration**: API in Liquitool Dashboard einbinden
6. **Monitoring**: Fehler-Tracking und Alerting
7. **Tests**: Unit & Integration Tests
8. **Docker**: Container erstellen

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Lösung:** PostgreSQL-Server starten und DB-Credentials in `.env` prüfen

### API Key Invalid

```
Error: 401 Unauthorized
```

**Lösung:** SevDesk/Reonic API-Keys in `.env` überprüfen

### Port bereits belegt

```
Error: listen EADDRINUSE :::3001
```

**Lösung:** Port in `.env` ändern oder anderen Prozess beenden

## Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Logs prüfen
- .env Datei überprüfen

## License

MIT

