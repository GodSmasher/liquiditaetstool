/**
 * Validiert SevDesk Invoice Objekt
 * @param {Object} invoice 
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateSevDeskInvoice(invoice) {
    const errors = [];
    
    if (!invoice.id) {
      errors.push('Invoice ID fehlt');
    }
    
    if (!invoice.invoiceNumber) {
      errors.push('Rechnungsnummer fehlt');
    }
    
    if (!invoice.invoiceDate) {
      errors.push('Rechnungsdatum fehlt');
    }
    
    if (!invoice.sumGross || parseFloat(invoice.sumGross) <= 0) {
      errors.push('Bruttobetrag fehlt oder ungültig');
    }
    
    if (!invoice.status) {
      errors.push('Status fehlt');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      invoice: invoice
    };
  }
  
  /**
   * Validiert Supabase API Response
   * @param {Object} response 
   * @returns {Object} { valid: boolean, errors: Array }
   */
  function validateSupabaseResponse(response) {
    const errors = [];
    
    if (!response) {
      errors.push('Response ist leer');
      return { valid: false, errors: errors };
    }
    
    // Check for Supabase error structure
    if (response.error) {
      errors.push(`Supabase Error: ${response.error.message}`);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      data: response.data || response
    };
  }
  
  /**
   * Validiert Email-Adresse
   * @param {string} email 
   * @returns {boolean}
   */
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validiert deutsche PLZ
   * @param {string} plz 
   * @returns {boolean}
   */
  function isValidPLZ(plz) {
    const plzRegex = /^\d{5}$/;
    return plzRegex.test(plz);
  }
  
  /**
   * Validiert Telefonnummer (einfache Prüfung)
   * @param {string} telefon 
   * @returns {boolean}
   */
  function isValidTelefon(telefon) {
    // Entfernt Leerzeichen, +, -, /, (, )
    const cleaned = telefon.replace(/[\s\+\-\/\(\)]/g, '');
    // Mindestens 6 Ziffern
    return /^\d{6,}$/.test(cleaned);
  }
  
  /**
   * Validiert Betrag
   * @param {number|string} betrag 
   * @returns {Object} { valid: boolean, value: number, error: string }
   */
  function validateBetrag(betrag) {
    const parsed = parseFloat(betrag);
    
    if (isNaN(parsed)) {
      return { valid: false, value: 0, error: 'Kein gültiger Betrag' };
    }
    
    if (parsed < 0) {
      return { valid: false, value: parsed, error: 'Betrag darf nicht negativ sein' };
    }
    
    return { valid: true, value: parsed, error: null };
  }
  
  /**
   * Validiert Datum im ISO Format (YYYY-MM-DD)
   * @param {string} dateStr 
   * @returns {Object} { valid: boolean, date: Date, error: string }
   */
  function validateDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
      return { valid: false, date: null, error: 'Datum fehlt' };
    }
    
    // Check ISO Format
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(dateStr)) {
      return { valid: false, date: null, error: 'Datum muss im Format YYYY-MM-DD sein' };
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { valid: false, date: null, error: 'Ungültiges Datum' };
    }
    
    return { valid: true, date: date, error: null };
  }
  
  /**
   * Validiert UUID
   * @param {string} uuid 
   * @returns {boolean}
   */
  function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  
  /**
   * Validiert MRF Auftrag
   * @param {Object} auftrag 
   * @returns {Object} { valid: boolean, errors: Array }
   */
  function validateMRFAuftrag(auftrag) {
    const errors = [];
    
    if (!auftrag.auftrags_id) {
      errors.push('Auftrags-ID fehlt');
    }
    
    if (!auftrag.geplanter_start) {
      errors.push('Geplanter Start fehlt');
    }
    
    if (!auftrag.bezeichnung) {
      errors.push('Bezeichnung fehlt');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      auftrag: auftrag
    };
  }
  
  /**
   * Validiert Reonic Angebot
   * @param {Object} angebot 
   * @returns {Object} { valid: boolean, errors: Array }
   */
  function validateReonicAngebot(angebot) {
    const errors = [];
    
    if (!angebot.angebots_nr) {
      errors.push('Angebots-Nummer fehlt');
    }
    
    if (!angebot.angebotswert || parseFloat(angebot.angebotswert) <= 0) {
      errors.push('Angebotswert fehlt oder ungültig');
    }
    
    if (!angebot.erwarteter_abschluss) {
      errors.push('Erwarteter Abschluss fehlt');
    }
    
    if (!['Hoch', 'Mittel', 'Niedrig'].includes(angebot.abschluss_wahrscheinlichkeit)) {
      errors.push('Ungültige Abschluss-Wahrscheinlichkeit');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      angebot: angebot
    };
  }
  
  /**
   * Sanitize String (entfernt gefährliche Zeichen)
   * @param {string} str 
   * @returns {string}
   */
  function sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    
    // Entfernt HTML Tags
    return str
      .replace(/<[^>]*>/g, '')
      .trim();
  }
  
  /**
   * Validiert Wahrscheinlichkeit (25, 50, 75, 100)
   * @param {number} value 
   * @returns {boolean}
   */
  function isValidWahrscheinlichkeit(value) {
    return [25, 50, 75, 100].includes(value);
  }
  
  /**
   * Batch Validation - validiert Array von Objekten
   * @param {Array} items 
   * @param {Function} validatorFn 
   * @returns {Object} { valid: Array, invalid: Array }
   */
  function batchValidate(items, validatorFn) {
    const valid = [];
    const invalid = [];
    
    items.forEach((item, index) => {
      const result = validatorFn(item);
      if (result.valid) {
        valid.push(item);
      } else {
        invalid.push({
          index: index,
          item: item,
          errors: result.errors
        });
      }
    });
    
    return { valid, invalid };
  }
  
  module.exports = {
    validateSevDeskInvoice,
    validateSupabaseResponse,
    isValidEmail,
    isValidPLZ,
    isValidTelefon,
    validateBetrag,
    validateDate,
    isValidUUID,
    validateMRFAuftrag,
    validateReonicAngebot,
    sanitizeString,
    isValidWahrscheinlichkeit,
    batchValidate
  };