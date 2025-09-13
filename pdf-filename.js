// --- Konfiguration ---
const BIN_PROP = 'data'; // Binary-Property aus dem Gotenberg-Node

// Hilfsfunktionen
function toDDMMYYYY(raw) {
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw + 'T00:00:00Z');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yy = d.getUTCFullYear();
    return `${dd}-${mm}-${yy}`;
  }
  const n = new Date();
  return `${String(n.getDate()).padStart(2,'0')}-${String(n.getMonth()+1).padStart(2,'0')}-${n.getFullYear()}`;
}

function normalizeOrt(s) {
  let t = (s ?? '').toString().trim();
  t = t.replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue')
       .replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue')
       .replace(/ß/g,'ss');
  t = t.replace(/\s+/g,'_').replace(/[^A-Za-z0-9_\-]/g,'_');
  t = t.replace(/_+/g,'_').replace(/^_+|_+$/g,'');
  return t || 'unbekannterOrt';
}

// Hauptlogik
const out = (items || []).map((it) => {
  const j = it.json || {};

  // 1) Werte bevorzugt aus metaForFilename, sonst aus j[...]
  const ortRaw = j.metaForFilename?.einsatzort
              ?? j['Einsatzort'] ?? j['einsatzort'] ?? j['Ort'] ?? '';
  const dateRaw = j.metaForFilename?.datum
               ?? j['Datum Arbeitstag'] ?? j['Datum'] ?? j['date'] ?? '';

  // 2) Aufbereiten
  const datePart = toDDMMYYYY(dateRaw);
  const ortPart  = normalizeOrt(ortRaw);

  // 3) Dateiname bauen
  const fileName = `FA_${datePart}_${ortPart}.pdf`;

  // 4) Am Binary setzen
  if (it.binary && it.binary[BIN_PROP]) {
    it.binary[BIN_PROP].fileName = fileName;
    it.binary[BIN_PROP].mimeType = 'application/pdf';
    it.binary[BIN_PROP].fileExtension = 'pdf';
  }
  return it;
});

return out;