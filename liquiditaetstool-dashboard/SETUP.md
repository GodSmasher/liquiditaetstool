# 🚀 Setup Anleitung - Liquiditätstool

## Schritt 1: Environment Variables

Erstelle eine `.env.local` Datei im `liquiditaetstool-dashboard` Verzeichnis:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**So findest du deine Supabase Credentials:**
1. Gehe zu [supabase.com](https://supabase.com)
2. Öffne dein Projekt
3. Klicke auf **Settings** (Zahnrad-Symbol)
4. Wähle **API** aus
5. Kopiere:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Schritt 2: Datenbank Schema erstellen

Führe dieses SQL in deinem Supabase SQL Editor aus:

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

-- Indizes für Performance
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Row Level Security aktivieren
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policies für authentifizierte User
CREATE POLICY "Enable read access for authenticated users" 
ON invoices FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
ON invoices FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" 
ON invoices FOR UPDATE 
TO authenticated 
USING (true);
```

## Schritt 3: Test-User erstellen

1. Gehe zu **Authentication** in Supabase
2. Klicke auf **Add User** → **Create new user**
3. Erstelle einen User mit Email und Passwort
4. Bestätige die Email (oder deaktiviere Email-Bestätigung in den Settings)

## Schritt 4: Test-Daten einfügen (Optional)

```sql
INSERT INTO invoices (invoice_number, customer_name, amount, status, due_date) VALUES
('RE-2024-001', 'Mustermann GmbH', 1500.00, 'paid', '2024-01-15'),
('RE-2024-002', 'TestFirma AG', 2300.50, 'pending', '2024-02-01'),
('RE-2024-003', 'Beispiel KG', 890.00, 'overdue', '2023-12-20'),
('RE-2024-004', 'Demo GmbH', 4200.00, 'paid', '2024-01-10'),
('RE-2024-005', 'Sample Ltd', 1750.00, 'pending', '2024-02-15');
```

## Schritt 5: Server starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

## 🎉 Fertig!

Du kannst dich jetzt mit deinem Test-User einloggen und das Dashboard nutzen!

## 🐛 Troubleshooting

### "Invalid login credentials"
- Prüfe ob der User in Supabase existiert
- Prüfe ob Email-Bestätigung erforderlich ist
- Prüfe die Environment Variables

### "Tabelle existiert nicht"
- Führe das SQL aus Schritt 2 aus
- Prüfe ob die Tabelle `invoices` in Supabase sichtbar ist

### "Port 3000 bereits belegt"
- Stoppe andere Node.js Prozesse: `taskkill /F /IM node.exe`
- Oder ändere den Port: `npm run dev -- -p 3001`

### Middleware-Fehler
- Prüfe ob `middleware.ts` im Root liegt (nicht in src/)
- Prüfe ob alle Supabase Packages installiert sind

