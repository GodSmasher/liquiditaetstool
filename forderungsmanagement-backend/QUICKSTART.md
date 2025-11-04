# 🚀 Quickstart Guide

Schnellanleitung zum Starten des Forderungsmanagement-Backends

## ⚡ In 5 Minuten starten

### 1. Dependencies installieren

```bash
cd forderungsmanagement-backend
npm install
```

### 2. .env Datei erstellen

```bash
# Windows
copy env.example .env

# macOS/Linux
cp env.example .env
```

### 3. PostgreSQL starten

**Option A: Mit Docker (empfohlen)**

```bash
docker run --name forderungsmanagement-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=forderungsmanagement \
  -p 5432:5432 \
  -d postgres:14
```

**Option B: Lokaler PostgreSQL Server**

```bash
createdb forderungsmanagement
```

### 4. Server starten

```bash
npm run dev
```

✅ **Fertig!** Der Server läuft auf `http://localhost:3001`

## 🧪 Testen

### Health Check

```bash
curl http://localhost:3001/health
```

### Receivables abrufen

```bash
curl http://localhost:3001/api/receivables
```

### Manuelle Synchronisation

```bash
curl -X POST http://localhost:3001/api/sync/trigger
```

## 📊 Beispiel-Response

```json
[
  {
    "invoice_id": "SV-2024-0012",
    "customer": "Musterfirma GmbH",
    "amount": 4200,
    "due_date": "2024-11-15",
    "status": "overdue",
    "reminder_level": 1
  },
  {
    "invoice_id": "RE-2024-0501",
    "customer": "Solar Energy GmbH",
    "amount": 12500,
    "due_date": "2024-11-25",
    "status": "open",
    "reminder_level": 0
  }
]
```

## 🎯 Was läuft gerade?

1. **Express Server** auf Port 3001
2. **PostgreSQL Datenbank** mit automatisch erstellten Tabellen
3. **Dummy-Daten** von SevDesk und Reonic (4 Test-Rechnungen)
4. **Cronjob** für tägliche Synchronisation
5. **REST API** für Forderungsmanagement

## 📝 Nächste Schritte

1. API-Keys in `.env` eintragen (wenn vorhanden)
2. Echte SevDesk/Reonic API-Calls in Connectors implementieren
3. Frontend in Liquitool Dashboard anbinden
4. Weitere Features implementieren

## ❓ Probleme?

### Port 3001 bereits belegt

`.env` ändern:
```env
PORT=3002
```

### Database Connection Error

PostgreSQL-Server überprüfen:
```bash
docker ps  # Läuft der Container?
psql -U postgres -d forderungsmanagement  # Verbindung testen
```

### npm install Fehler

Node.js Version prüfen (mind. v18):
```bash
node --version
```

## 🎉 Geschafft!

Du kannst jetzt:
- ✅ Forderungen über die API abrufen
- ✅ Status-Übersichten anzeigen
- ✅ Manuelle Syncs auslösen
- ✅ Das System erweitern

Viel Erfolg! 🚀

