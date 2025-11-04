# Forderungsmanagement Setup

Das Forderungsmanagement ist jetzt als neue Seite im Dashboard integriert!

## 🎯 Was wurde hinzugefügt

### 1. Neue Dashboard-Seite
**URL:** `/dashboard/forderungsmanagement`

**Features:**
- ✅ Übersicht über alle Forderungen aus SevDesk & Reonic
- ✅ 4 Stats Cards (Gesamt, Offen, Überfällig, Bezahlt)
- ✅ Filter nach Status (Alle, Offen, Überfällig, Bezahlt)
- ✅ Tabelle mit allen Forderungen
- ✅ "Jetzt synchronisieren" Button für manuellen Sync
- ✅ Gelb/Schwarz Design wie Rest des Dashboards

### 2. Navigation
Ein neuer **"Forderungen"** Button wurde im Schnellzugriff-Bereich des Dashboards hinzugefügt (mit Gelb-Gradient).

## 🚀 Setup

### 1. Backend starten

Das Backend muss laufen, damit die Seite funktioniert:

```bash
cd ../forderungsmanagement-backend
npm install
npm run dev
```

Das Backend läuft auf: `http://localhost:3001`

### 2. Environment Variable setzen

Erstelle oder bearbeite `.env.local` im Dashboard-Ordner:

```env
NEXT_PUBLIC_FORDERUNGEN_API_URL=http://localhost:3001
```

**Wichtig:** Die Variable muss mit `NEXT_PUBLIC_` beginnen, damit sie im Browser verfügbar ist!

### 3. Dashboard neu starten

```bash
npm run dev
```

### 4. Forderungsmanagement öffnen

1. Gehe zu `http://localhost:3000/dashboard`
2. Klicke auf den **"Forderungen"** Button im Schnellzugriff
3. Die Forderungsmanagement-Seite öffnet sich

## 📊 So funktioniert es

### Backend → Frontend Flow

1. **Backend** (Port 3001):
   - Synchronisiert Daten von SevDesk & Reonic
   - Speichert in PostgreSQL
   - Stellt REST API bereit

2. **Frontend** (Port 3000):
   - Ruft Daten vom Backend ab
   - Zeigt Forderungen in Tabelle an
   - Ermöglicht manuellen Sync

### API-Endpunkte

```
GET  /api/receivables        → Alle Forderungen
GET  /api/receivables/status → Status-Übersicht
POST /api/sync/trigger       → Manuelle Synchronisation
```

## 🎨 Design

- **Gelb/Schwarz Theme** durchgängig
- **Stats Cards** mit Hover-Effekt
- **Tabelle** mit schwarzem Header und gelbem Text
- **Status-Badges** (Grün=Bezahlt, Gelb=Offen, Rot=Überfällig)
- **Gradient-Button** für Forderungen im Schnellzugriff

## ❓ Troubleshooting

### Fehler: "Verbindungsfehler"

**Problem:** Frontend kann Backend nicht erreichen

**Lösung:**
1. Prüfe ob Backend läuft: `curl http://localhost:3001/health`
2. Prüfe `.env.local`: `NEXT_PUBLIC_FORDERUNGEN_API_URL=http://localhost:3001`
3. Dashboard neu starten

### Keine Daten sichtbar

**Problem:** Datenbank ist leer

**Lösung:**
1. Backend synchronisieren: `curl -X POST http://localhost:3001/api/sync/trigger`
2. Oder Button "Jetzt synchronisieren" im Dashboard klicken

### Backend läuft nicht

**Problem:** PostgreSQL nicht gestartet

**Lösung:**
```bash
# Docker PostgreSQL starten
docker run --name forderungsmanagement-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=forderungsmanagement \
  -p 5432:5432 \
  -d postgres:14
```

## 📁 Dateien

### Neu erstellt:
- `src/app/dashboard/forderungsmanagement/page.tsx` - Hauptseite

### Bearbeitet:
- `src/app/dashboard/page.tsx` - Schnellzugriff-Button hinzugefügt

## 🚀 Nächste Schritte

1. ✅ Backend starten
2. ✅ Environment Variable setzen
3. ✅ Dashboard öffnen
4. ✅ Auf "Forderungen" klicken
5. ✅ Daten synchronisieren
6. ✅ Forderungen verwalten!

Viel Erfolg! 🎉

