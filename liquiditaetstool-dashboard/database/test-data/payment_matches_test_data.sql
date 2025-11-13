-- ============================================
-- Test-Daten für Buchungsprüfung
-- ============================================
-- 
-- Diese Datei enthält realistische Test-Daten für das 
-- Payment Matching Feature.
--
-- WICHTIG: Nur in Development/Test Umgebung verwenden!
--

-- Cleanup (optional - vorsichtig in Production!)
-- DELETE FROM payment_matches;

-- ============================================
-- Beispiel 1: Sichere Zuordnung (100%)
-- Perfekter Match: Betrag, Datum nah, Rechnungsnummer im Text
-- ============================================

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
  'SEVDESK_TXN_TEST_001',
  2754.44,
  CURRENT_DATE - INTERVAL '3 days',
  'Zahlung RE-2943 Mustermann Solar',
  'Hauptkonto Sparkasse',
  (SELECT id FROM invoices WHERE invoice_number LIKE '%2943%' ORDER BY created_at DESC LIMIT 1),
  100,
  'pending'
);

-- ============================================
-- Beispiel 2: Sichere Zuordnung (95%)
-- Guter Match: Betrag exakt, Datum ok, Kunde im Text
-- ============================================

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
  'SEVDESK_TXN_TEST_002',
  5420.00,
  CURRENT_DATE - INTERVAL '5 days',
  'Überweisung Solar GmbH Photovoltaik',
  'Hauptkonto Sparkasse',
  (SELECT id FROM invoices WHERE status = 'open' ORDER BY RANDOM() LIMIT 1),
  95,
  'pending'
);

-- ============================================
-- Beispiel 3: Mittlere Zuordnung (70%)
-- Unsicher: Betrag passt, Datum passt, aber kein Text-Match
-- ============================================

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
  'SEVDESK_TXN_TEST_003',
  1234.56,
  CURRENT_DATE - INTERVAL '10 days',
  'Überweisung',
  'Hauptkonto Sparkasse',
  (SELECT id FROM invoices WHERE status = 'open' ORDER BY RANDOM() LIMIT 1),
  70,
  'pending'
);

-- ============================================
-- Beispiel 4: Schwache Zuordnung (45%)
-- Sehr unsicher: Betrag ähnlich, Datum weit weg
-- ============================================

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
  'SEVDESK_TXN_TEST_004',
  899.99,
  CURRENT_DATE - INTERVAL '25 days',
  'Zahlung ohne Details',
  'Hauptkonto Sparkasse',
  (SELECT id FROM invoices WHERE status = 'open' ORDER BY RANDOM() LIMIT 1),
  45,
  'pending'
);

-- ============================================
-- Beispiel 5: Bereits verknüpfte Zahlung
-- Status: matched
-- ============================================

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
  'SEVDESK_TXN_TEST_005',
  8500.00,
  CURRENT_DATE - INTERVAL '15 days',
  'Zahlung RE-2935 Großauftrag',
  'Hauptkonto Sparkasse',
  (SELECT id FROM invoices WHERE status = 'paid' ORDER BY RANDOM() LIMIT 1),
  98,
  (SELECT id FROM invoices WHERE status = 'paid' ORDER BY RANDOM() LIMIT 1),
  'ines@volta-energietechnik.de',
  CURRENT_DATE - INTERVAL '14 days',
  'matched',
  'In SevDesk manuell verknüpft am 31.10.2025'
);

-- ============================================
-- Beispiel 6: Ignorierte Zahlung
-- Status: ignored
-- ============================================

INSERT INTO payment_matches (
  payment_id,
  payment_amount,
  payment_date,
  payment_reference,
  payment_account,
  suggested_invoice_id,
  confidence_score,
  matched_by,
  matched_at,
  status,
  notes
) VALUES (
  'SEVDESK_TXN_TEST_006',
  150.00,
  CURRENT_DATE - INTERVAL '20 days',
  'Rückerstattung Material',
  'Hauptkonto Sparkasse',
  NULL,
  0,
  'ines@volta-energietechnik.de',
  CURRENT_DATE - INTERVAL '19 days',
  'ignored',
  'Keine Rechnung - interne Rückerstattung'
);

-- ============================================
-- Beispiel 7: Mehrere mögliche Matches (60%)
-- Gleiches Betrags-Pattern bei mehreren Rechnungen
-- ============================================

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
  'SEVDESK_TXN_TEST_007',
  999.00,
  CURRENT_DATE - INTERVAL '7 days',
  'Standardpaket Installation',
  'Hauptkonto Sparkasse',
  (SELECT id FROM invoices ORDER BY RANDOM() LIMIT 1),
  60,
  'pending'
);

-- ============================================
-- Beispiel 8: Hoher Betrag mit guter Zuordnung (92%)
-- Großauftrag mit eindeutigem Verwendungszweck
-- ============================================

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
  'SEVDESK_TXN_TEST_008',
  25000.00,
  CURRENT_DATE - INTERVAL '2 days',
  'RE-2950 Industrieanlage Komplett',
  'Hauptkonto Sparkasse',
  (SELECT id FROM invoices WHERE amount > 20000 ORDER BY created_at DESC LIMIT 1),
  92,
  'pending'
);

-- ============================================
-- Beispiel 9: Teilzahlung (85%)
-- Kunde zahlt nur Teil der Rechnung
-- ============================================

INSERT INTO payment_matches (
  payment_id,
  payment_amount,
  payment_date,
  payment_reference,
  payment_account,
  suggested_invoice_id,
  confidence_score,
  status,
  notes
) VALUES (
  'SEVDESK_TXN_TEST_009',
  2500.00,
  CURRENT_DATE - INTERVAL '4 days',
  'Teilzahlung RE-2948 - Rest folgt',
  'Hauptkonto Sparkasse',
  (SELECT id FROM invoices WHERE amount > 5000 ORDER BY RANDOM() LIMIT 1),
  85,
  'pending',
  'Achtung: Nur Teilzahlung! Rest steht noch aus.'
);

-- ============================================
-- Beispiel 10: Zahlung ohne Match
-- Keine passende Rechnung gefunden
-- ============================================

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
  'SEVDESK_TXN_TEST_010',
  1800.00,
  CURRENT_DATE - INTERVAL '1 day',
  'Unbekannte Zahlung',
  'Hauptkonto Sparkasse',
  NULL,
  0,
  'pending'
);

-- ============================================
-- Verifizierung
-- ============================================

-- Zeige alle Test-Daten an
SELECT 
  payment_id,
  payment_amount,
  payment_date,
  confidence_score,
  status,
  payment_reference
FROM payment_matches
WHERE payment_id LIKE 'SEVDESK_TXN_TEST_%'
ORDER BY confidence_score DESC;

-- Zähle Test-Daten nach Status
SELECT 
  status,
  COUNT(*) as anzahl,
  AVG(confidence_score) as durchschnittliche_konfidenz
FROM payment_matches
WHERE payment_id LIKE 'SEVDESK_TXN_TEST_%'
GROUP BY status;

-- ============================================
-- Cleanup Script (zum Aufräumen nach Tests)
-- ============================================

/*
-- Zum Löschen aller Test-Daten:
DELETE FROM payment_matches 
WHERE payment_id LIKE 'SEVDESK_TXN_TEST_%';
*/

