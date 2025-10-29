/**
 * Gibt heutiges Datum im ISO Format zurück
 * @returns {string} YYYY-MM-DD
 */
function getToday() {
    return new Date().toISOString().split('T')[0];
  }
  
  /**
   * Berechnet Datum X Tage in der Zukunft
   * @param {number} days - Anzahl Tage
   * @returns {string} YYYY-MM-DD
   */
  function getFutureDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Berechnet Datum X Tage in der Vergangenheit
   * @param {number} days - Anzahl Tage
   * @returns {string} YYYY-MM-DD
   */
  function getPastDate(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Prüft ob Datum innerhalb eines Zeitraums liegt
   * @param {string} dateStr - Zu prüfendes Datum (YYYY-MM-DD)
   * @param {string} startDate - Start-Datum
   * @param {string} endDate - End-Datum
   * @returns {boolean}
   */
  function isDateInRange(dateStr, startDate, endDate) {
    const date = new Date(dateStr);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return date >= start && date <= end;
  }
  
  /**
   * Gibt Start und Ende der aktuellen Woche zurück
   * @returns {Object} { start: string, end: string }
   */
  function getCurrentWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  }
  
  /**
   * Gibt Start und Ende des aktuellen Monats zurück
   * @returns {Object} { start: string, end: string }
   */
  function getCurrentMonth() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0]
    };
  }
  
  /**
   * Formatiert Datum für deutsches Format
   * @param {string} dateStr - ISO Datum
   * @returns {string} DD.MM.YYYY
   */
  function formatDateDE(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE');
  }
  
  /**
   * Berechnet Anzahl Tage zwischen zwei Daten
   * @param {string} date1 
   * @param {string} date2 
   * @returns {number} Anzahl Tage
   */
  function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Gibt deutschen Wochentag zurück
   * @param {string} dateStr 
   * @returns {string} Montag, Dienstag, etc.
   */
  function getWeekdayDE(dateStr) {
    const date = new Date(dateStr);
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return weekdays[date.getDay()];
  }
  
  /**
   * Prüft ob Datum in der Vergangenheit liegt
   * @param {string} dateStr 
   * @returns {boolean}
   */
  function isPast(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }
  
  /**
   * Prüft ob Datum heute ist
   * @param {string} dateStr 
   * @returns {boolean}
   */
  function isToday(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  }
  
  /**
   * Gibt nächsten Montag zurück
   * @returns {string} YYYY-MM-DD
   */
  function getNextMonday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  }
  
  module.exports = {
    getToday,
    getFutureDate,
    getPastDate,
    isDateInRange,
    getCurrentWeek,
    getCurrentMonth,
    formatDateDE,
    daysBetween,
    getWeekdayDE,
    isPast,
    isToday,
    getNextMonday
  };