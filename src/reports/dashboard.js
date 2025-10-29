require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Holt 14-Tage Forecast
 */
async function get14DayForecast() {
  const { data, error } = await supabase
    .from('forecast_14_tage')
    .select('*');
  
  if (error) {
    console.error('Error fetching forecast:', error);
    return null;
  }
  
  return data;
}

/**
 * Holt Liquiditätssaldo
 */
async function getLiquiditaetsSaldo() {
  const { data, error } = await supabase
    .from('liquiditaetssaldo')
    .select('*')
    .single();
  
  if (error) {
    console.error('Error fetching saldo:', error);
    return null;
  }
  
  return data;
}

/**
 * Gruppiert Forecast nach Datum
 */
function groupByDate(forecast) {
  const grouped = {};
  
  forecast.forEach(entry => {
    const date = entry.datum;
    if (!grouped[date]) {
      grouped[date] = {
        datum: date,
        einnahmen: 0,
        ausgaben: 0,
        items: []
      };
    }
    
    if (entry.typ === 'Einnahme') {
      grouped[date].einnahmen += parseFloat(entry.gewichteter_betrag || 0);
    } else {
      grouped[date].ausgaben += parseFloat(entry.gewichteter_betrag || 0);
    }
    
    grouped[date].items.push(entry);
  });
  
  return Object.values(grouped);
}

/**
 * Formatiert Betrag als EUR
 */
function formatEUR(betrag) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(betrag);
}

/**
 * Generiert Text-Report für Console
 */
async function generateConsoleReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 LIQUIDITÄTSTOOL - DASHBOARD REPORT');
  console.log('='.repeat(60) + '\n');
  
  // Liquiditätssaldo
  const saldo = await getLiquiditaetsSaldo();
  if (saldo) {
    console.log('💰 LIQUIDITÄTSSALDO:');
    console.log('─'.repeat(60));
    console.log(`Einnahmen (getätigt):  ${formatEUR(saldo.einnahmen_getaetigt || 0)}`);
    console.log(`Einnahmen (geplant):   ${formatEUR(saldo.einnahmen_geplant || 0)}`);
    console.log(`Ausgaben (getätigt):   ${formatEUR(saldo.ausgaben_getaetigt || 0)}`);
    console.log(`Ausgaben (geplant):    ${formatEUR(saldo.ausgaben_geplant || 0)}`);
    console.log('─'.repeat(60));
    console.log(`💵 SALDO GESAMT:       ${formatEUR(saldo.saldo_gesamt || 0)}`);
    console.log('─'.repeat(60) + '\n');
  }
  
  // 14-Tage Forecast
  const forecast = await get14DayForecast();
  if (forecast && forecast.length > 0) {
    console.log('📅 14-TAGE FORECAST:');
    console.log('─'.repeat(60));
    
    const grouped = groupByDate(forecast);
    
    grouped.forEach(day => {
      const saldo = day.einnahmen - day.ausgaben;
      const saldoSymbol = saldo >= 0 ? '✅' : '⚠️';
      
      console.log(`\n${day.datum} ${saldoSymbol}`);
      console.log(`  Einnahmen: ${formatEUR(day.einnahmen)}`);
      console.log(`  Ausgaben:  ${formatEUR(day.ausgaben)}`);
      console.log(`  Saldo:     ${formatEUR(saldo)}`);
      
      // Details
      day.items.forEach(item => {
        const symbol = item.typ === 'Einnahme' ? '💰' : '💸';
        console.log(`    ${symbol} ${item.bezeichnung} - ${formatEUR(item.gewichteter_betrag || 0)} [${item.quelle}]`);
      });
    });
    
    console.log('\n' + '─'.repeat(60));
  } else {
    console.log('ℹ️  Keine Einträge für die nächsten 14 Tage.\n');
  }
  
  console.log('='.repeat(60) + '\n');
}

/**
 * Generiert JSON Report
 */
async function generateJSONReport() {
  const saldo = await getLiquiditaetsSaldo();
  const forecast = await get14DayForecast();
  
  return {
    timestamp: new Date().toISOString(),
    liquiditaetssaldo: saldo,
    forecast_14_tage: forecast ? groupByDate(forecast) : [],
    summary: {
      total_einnahmen: (saldo?.einnahmen_getaetigt || 0) + (saldo?.einnahmen_geplant || 0),
      total_ausgaben: (saldo?.ausgaben_getaetigt || 0) + (saldo?.ausgaben_geplant || 0),
      saldo_gesamt: saldo?.saldo_gesamt || 0,
      anzahl_transaktionen: forecast?.length || 0
    }
  };
}

/**
 * Exportiert Report als JSON File
 */
async function exportReport(filename = 'dashboard-report.json') {
  const fs = require('fs');
  const path = require('path');
  
  const report = await generateJSONReport();
  const filepath = path.join(__dirname, '..', '..', 'reports', filename);
  
  // Erstelle reports Ordner falls nicht existiert
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`✅ Report exported to: ${filepath}`);
  
  return filepath;
}

/**
 * Hauptfunktion
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'console';
  
  switch(command) {
    case 'console':
      await generateConsoleReport();
      break;
      
    case 'json':
      const report = await generateJSONReport();
      console.log(JSON.stringify(report, null, 2));
      break;
      
    case 'export':
      const filename = args[1] || `dashboard-${new Date().toISOString().split('T')[0]}.json`;
      await exportReport(filename);
      break;
      
    default:
      console.log('Usage:');
      console.log('  node src/reports/dashboard.js console  - Print to console');
      console.log('  node src/reports/dashboard.js json     - Output as JSON');
      console.log('  node src/reports/dashboard.js export [filename] - Export to file');
  }
}

// Run wenn direkt aufgerufen
if (require.main === module) {
  main().catch(console.error);
}

// Exports für andere Scripts
module.exports = {
  get14DayForecast,
  getLiquiditaetsSaldo,
  generateConsoleReport,
  generateJSONReport,
  exportReport
};