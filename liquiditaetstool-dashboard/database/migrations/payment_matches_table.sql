-- ============================================
-- Buchungsprüfung (Payment Matching)
-- Migration Script für payment_matches Tabelle
-- ============================================
--
-- Diese Tabelle speichert Zahlungen aus SevDesk und deren 
-- Zuordnung zu Rechnungen (Invoices)
--
-- WICHTIG: 
-- - Dieses Feature ist READ-ONLY für SevDesk
-- - Keine automatischen Schreibzugriffe auf SevDesk
-- - Ines macht finale Verknüpfung manuell in SevDesk UI
--

-- Erstelle payment_matches Tabelle
CREATE TABLE IF NOT EXISTS payment_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Payment Info (from SevDesk transaction)
  payment_id text UNIQUE NOT NULL,
  payment_amount numeric(10,2) NOT NULL,
  payment_date date NOT NULL,
  payment_reference text,
  payment_account text,
  
  -- Suggested Match (Automatische Zuordnung)
  suggested_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Manual Decision (Manuelle Entscheidung durch User)
  matched_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  matched_by text,
  matched_at timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'ignored')),
  
  -- Meta
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Erstelle Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_payment_matches_status 
  ON payment_matches(status);

CREATE INDEX IF NOT EXISTS idx_payment_matches_suggested 
  ON payment_matches(suggested_invoice_id);

CREATE INDEX IF NOT EXISTS idx_payment_matches_matched 
  ON payment_matches(matched_invoice_id);

CREATE INDEX IF NOT EXISTS idx_payment_matches_payment_date 
  ON payment_matches(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payment_matches_payment_id 
  ON payment_matches(payment_id);

-- Erstelle Foreign Key Namen für bessere Lesbarkeit in der API
-- (Diese Namen werden in der API für die Joins verwendet)
ALTER TABLE payment_matches 
  DROP CONSTRAINT IF EXISTS payment_matches_suggested_invoice_id_fkey;

ALTER TABLE payment_matches 
  ADD CONSTRAINT payment_matches_suggested_invoice_id_fkey 
  FOREIGN KEY (suggested_invoice_id) 
  REFERENCES invoices(id) 
  ON DELETE SET NULL;

ALTER TABLE payment_matches 
  DROP CONSTRAINT IF EXISTS payment_matches_matched_invoice_id_fkey;

ALTER TABLE payment_matches 
  ADD CONSTRAINT payment_matches_matched_invoice_id_fkey 
  FOREIGN KEY (matched_invoice_id) 
  REFERENCES invoices(id) 
  ON DELETE SET NULL;

-- Erstelle Trigger für automatisches Update von updated_at
CREATE OR REPLACE FUNCTION update_payment_matches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_matches_updated_at_trigger 
  ON payment_matches;

CREATE TRIGGER update_payment_matches_updated_at_trigger
  BEFORE UPDATE ON payment_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_matches_updated_at();

-- Kommentare für bessere Dokumentation
COMMENT ON TABLE payment_matches IS 
  'Zahlungen aus SevDesk und deren Zuordnung zu Rechnungen';

COMMENT ON COLUMN payment_matches.payment_id IS 
  'Eindeutige ID der Zahlung aus SevDesk';

COMMENT ON COLUMN payment_matches.confidence_score IS 
  'Konfidenz-Score der automatischen Zuordnung (0-100)';

COMMENT ON COLUMN payment_matches.status IS 
  'Status: pending (offen), matched (verknüpft), ignored (ignoriert)';

COMMENT ON COLUMN payment_matches.matched_by IS 
  'Email des Users der die Verknüpfung vorgenommen hat';

-- ============================================
-- Beispiel-Daten zum Testen (Optional)
-- ============================================
-- Uncomment um Test-Daten zu erstellen:

/*
-- Beispiel 1: Sichere Zuordnung (95%)
INSERT INTO payment_matches (
  payment_id,
  payment_amount,
  payment_date,
  payment_reference,
  payment_account,
  suggested_invoice_id,
  confidence_score,
  status
) VALUES (
  'SEVDESK_TXN_001',
  2754.44,
  '2025-11-10',
  'Zahlung RE-2943 Mustermann',
  'Geschäftskonto',
  (SELECT id FROM invoices WHERE invoice_number = 'RE-2943' LIMIT 1),
  95,
  'pending'
);

-- Beispiel 2: Unsichere Zuordnung (60%)
INSERT INTO payment_matches (
  payment_id,
  payment_amount,
  payment_date,
  payment_reference,
  payment_account,
  suggested_invoice_id,
  confidence_score,
  status
) VALUES (
  'SEVDESK_TXN_002',
  1234.56,
  '2025-11-05',
  'Überweisung',
  'Geschäftskonto',
  (SELECT id FROM invoices WHERE invoice_number = 'RE-2940' LIMIT 1),
  60,
  'pending'
);

-- Beispiel 3: Bereits verknüpfte Zahlung
INSERT INTO payment_matches (
  payment_id,
  payment_amount,
  payment_date,
  payment_reference,
  payment_account,
  suggested_invoice_id,
  confidence_score,
  matched_invoice_id,
  matched_by,
  matched_at,
  status,
  notes
) VALUES (
  'SEVDESK_TXN_003',
  5000.00,
  '2025-11-01',
  'Zahlung RE-2935',
  'Geschäftskonto',
  (SELECT id FROM invoices WHERE invoice_number = 'RE-2935' LIMIT 1),
  98,
  (SELECT id FROM invoices WHERE invoice_number = 'RE-2935' LIMIT 1),
  'ines@volta.de',
  now(),
  'matched',
  'In SevDesk verknüpft am 13.11.2025'
);
*/

-- ============================================
-- Rollback Script (falls nötig)
-- ============================================
-- Zum Rückgängig machen diese Befehle ausführen:

/*
DROP TRIGGER IF EXISTS update_payment_matches_updated_at_trigger ON payment_matches;
DROP FUNCTION IF EXISTS update_payment_matches_updated_at();
DROP TABLE IF EXISTS payment_matches CASCADE;
*/

