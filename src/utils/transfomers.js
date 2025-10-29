/**
 * Transformiert SevDesk Invoice zu Supabase Cashflow Entry
 * @param {Object} invoice - SevDesk Invoice Object
 * @returns {Object} Supabase cashflow_pipeline Entry
 */
function transformSevDeskInvoice(invoice) {
    // Typ bestimmen (RE = Rechnung/Einnahme, other = Ausgabe)
    const typ = invoice.invoiceType === 'RE' ? 'Einnahme' : 'Ausgabe';
    
    // Status Mapping
    const statusMap = {
      '100': 'Geplant',      // Offen
      '200': 'Risiko',       // Überfällig
      '1000': 'Getätigt'     // Bezahlt
    };
    const status = statusMap[invoice.status] || 'Geplant';
    
    // Fälligkeitsdatum berechnen
    const invoiceDate = new Date(invoice.invoiceDate);
    const paymentTerm = invoice.paymentTerm || 30; // Default 30 Tage
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTerm);
    
    // Wahrscheinlichkeit basierend auf Status
    const wahrscheinlichkeit = status === 'Getätigt' ? 100 : 
                                status === 'Risiko' ? 50 : 75;
    
    // Brutto Betrag
    const bruttoBetrag = parseFloat(invoice.sumGross) || 0;
    
    // Gewichteter Betrag
    const gewichteterBetrag = (bruttoBetrag * wahrscheinlichkeit) / 100;
    
    return {
      datum: dueDate.toISOString().split('T')[0],
      bezeichnung: invoice.header || `Rechnung ${invoice.invoiceNumber}`,
      quelle: 'SevDesk',
      typ: typ,
      status: status,
      brutto_betrag: bruttoBetrag,
      wahrscheinlichkeit: wahrscheinlichkeit,
      gewichteter_betrag: gewichteterBetrag,
      referenz_id: `SEVDESK-${invoice.id}`,
      kategorie: invoice.category?.name || null,
      zahlungsziel: paymentTerm,
      notizen: `SevDesk Rechnungs-Nr: ${invoice.invoiceNumber}`
    };
  }
  
  /**
   * Transformiert MRF Auftrag zu Cashflow Entry
   * @param {Object} auftrag - MRF Auftrag Object
   * @returns {Object} Supabase cashflow_pipeline Entry
   */
  function transformMRFAuftrag(auftrag) {
    const geplantesStartDatum = new Date(auftrag.geplanter_start);
    const geschaetzterWert = parseFloat(auftrag.geschaetzter_wert) || 0;
    
    // Status-basierte Wahrscheinlichkeit
    const wahrscheinlichkeit = auftrag.status === 'Aktiv' ? 90 : 50;
    
    return {
      datum: geplantesStartDatum.toISOString().split('T')[0],
      bezeichnung: `${auftrag.bezeichnung} (${auftrag.auftrags_id})`,
      quelle: 'MRF',
      typ: 'Einnahme',
      status: 'Geplant',
      brutto_betrag: geschaetzterWert,
      wahrscheinlichkeit: wahrscheinlichkeit,
      gewichteter_betrag: (geschaetzterWert * wahrscheinlichkeit) / 100,
      referenz_id: `MRF-${auftrag.auftrags_id}`,
      notizen: `Einsatzort: ${auftrag.einsatzort}, Bearbeiter: ${auftrag.bearbeiter}`
    };
  }
  
  /**
   * Transformiert Reonic Angebot zu Cashflow Entry
   * @param {Object} angebot - Reonic Angebot Object
   * @returns {Object} Supabase cashflow_pipeline Entry
   */
  function transformReonicAngebot(angebot) {
    // Wahrscheinlichkeit Mapping
    const wahrscheinlichkeitMap = {
      'Hoch': 75,
      'Mittel': 50,
      'Niedrig': 25
    };
    
    const wahrscheinlichkeit = wahrscheinlichkeitMap[angebot.abschluss_wahrscheinlichkeit] || 50;
    const angebotswert = parseFloat(angebot.angebotswert) || 0;
    
    return {
      datum: angebot.erwarteter_abschluss,
      bezeichnung: `Angebot ${angebot.angebots_nr}`,
      quelle: 'Reonic',
      typ: 'Einnahme',
      status: 'Angebot',
      brutto_betrag: angebotswert,
      marge_prozent: angebot.marge_prozent,
      wahrscheinlichkeit: wahrscheinlichkeit,
      gewichteter_betrag: (angebotswert * wahrscheinlichkeit) / 100,
      referenz_id: `REONIC-${angebot.angebots_nr}`
    };
  }
  
  /**
   * Check ob Entry bereits in Supabase existiert (Duplikat-Check)
   * @param {Array} existingEntries - Bestehende Einträge aus Supabase
   * @param {string} referenzId - Zu prüfende Referenz-ID
   * @returns {boolean} True wenn Duplikat gefunden
   */
  function isDuplicate(existingEntries, referenzId) {
    return existingEntries.some(entry => entry.referenz_id === referenzId);
  }
  
  /**
   * Filtert Aufträge die innerhalb der nächsten X Tage starten
   * @param {Array} auftraege - Array von Aufträgen
   * @param {number} days - Anzahl Tage (default 14)
   * @returns {Array} Gefilterte Aufträge
   */
  function filterUpcomingAuftraege(auftraege, days = 14) {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);
    
    return auftraege.filter(auftrag => {
      const startDate = new Date(auftrag.geplanter_start);
      return startDate >= today && startDate <= futureDate;
    });
  }
  
  /**
   * Berechnet Liquiditätssaldo aus Cashflow Entries
   * @param {Array} entries - Cashflow Entries
   * @returns {Object} Saldo-Informationen
   */
  function calculateLiquiditaetsSaldo(entries) {
    let einnahmenGetaetigt = 0;
    let einnahmenGeplant = 0;
    let ausgabenGetaetigt = 0;
    let ausgabenGeplant = 0;
    
    entries.forEach(entry => {
      const betrag = parseFloat(entry.brutto_betrag) || 0;
      
      if (entry.typ === 'Einnahme') {
        if (entry.status === 'Getätigt') {
          einnahmenGetaetigt += betrag;
        } else {
          einnahmenGeplant += betrag;
        }
      } else if (entry.typ === 'Ausgabe') {
        if (entry.status === 'Getätigt') {
          ausgabenGetaetigt += betrag;
        } else {
          ausgabenGeplant += betrag;
        }
      }
    });
    
    return {
      einnahmen: {
        getaetigt: einnahmenGetaetigt,
        geplant: einnahmenGeplant,
        gesamt: einnahmenGetaetigt + einnahmenGeplant
      },
      ausgaben: {
        getaetigt: ausgabenGetaetigt,
        geplant: ausgabenGeplant,
        gesamt: ausgabenGetaetigt + ausgabenGeplant
      },
      saldo: {
        getaetigt: einnahmenGetaetigt - ausgabenGetaetigt,
        geplant: einnahmenGeplant - ausgabenGeplant,
        gesamt: (einnahmenGetaetigt + einnahmenGeplant) - (ausgabenGetaetigt + ausgabenGeplant)
      }
    };
  }
  
  /**
   * Formatiert Betrag für Ausgabe (EUR)
   * @param {number} betrag 
   * @returns {string} Formatierter Betrag
   */
  function formatCurrency(betrag) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(betrag);
  }
  
  /**
   * Validiert Cashflow Entry
   * @param {Object} entry 
   * @returns {Object} { valid: boolean, errors: Array }
   */
  function validateCashflowEntry(entry) {
    const errors = [];
    
    if (!entry.datum) {
      errors.push('Datum ist erforderlich');
    }
    
    if (!entry.bezeichnung) {
      errors.push('Bezeichnung ist erforderlich');
    }
    
    if (!['Einnahme', 'Ausgabe'].includes(entry.typ)) {
      errors.push('Typ muss Einnahme oder Ausgabe sein');
    }
    
    if (!['Getätigt', 'Geplant', 'Angebot', 'Risiko'].includes(entry.status)) {
      errors.push('Ungültiger Status');
    }
    
    if (!entry.brutto_betrag || entry.brutto_betrag <= 0) {
      errors.push('Brutto-Betrag muss größer 0 sein');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
  
  // Export für Verwendung in n8n oder anderen Scripts
  module.exports = {
    transformSevDeskInvoice,
    transformMRFAuftrag,
    transformReonicAngebot,
    isDuplicate,
    filterUpcomingAuftraege,
    calculateLiquiditaetsSaldo,
    formatCurrency,
    validateCashflowEntry
  };