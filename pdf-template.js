// Forstauftrag PDF-Generator (Gotenberg/Chromium)
// 1) Liest n8n-Itemdaten (Form + Zusatzdaten)
// 2) Erzeugt Header/Footer (Chromium-Seitenränder) und HTML
// 3) Gotenberg rendert PDF inkl. Header/Footer auf jeder Seite

const d = item.json || {};
const now = new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

// Helper: ersten gesetzten Wert liefern
const pick = (keys, def='—') => {
  for (const k of keys) {
    const v = d?.[k];
    if (v !== undefined && v !== null && String(v) !== '') return v;
  }
  return def;
};

// ---- Logos aus $binary in Data-URLs wandeln ----
function binToDataUrl(name, fallbackMime = 'image/png') {
  try {
    const meta = $binary?.[name];
    if (!meta) return null;
    const buf  = this.helpers.getBinaryDataBuffer(0, name);
    const mime = meta.mimeType || fallbackMime;
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

// 1) Logos vorbereiten (Data-URL > evtl. d.assets > null)
const logoLeftPrepared   = binToDataUrl.call(this, 'ryzeup') || d?.assets?.ryzeup || null;
const logoCenterPrepared = binToDataUrl.call(this, 'bg')     || d?.assets?.bg     || null;
const logoRightPrepared  = binToDataUrl.call(this, 'fa')     || d?.assets?.fa     || null;

// 2) THEME erst jetzt definieren – mit vorbereiteten Logos
const THEME = {
  brandBg:    '#112240',
  brandText:  '#ffffff',
  bodyFont:   'Arial, Helvetica, sans-serif',
  fontSizeH:  9,
  fontSizeF:  8.5,
  padH:       '6px 12px',
  padF:       '4px 10px',
  linkGap:    '16px',
  borderTopF: '1px solid rgba(255,255,255,.08)',
  logoLeft:   logoLeftPrepared,
  logoCenter: logoCenterPrepared,
  logoRight:  logoRightPrepared,
};



// Header CSS
const hcss = `
  *{box-sizing:border-box} body{margin:0; font-family:${THEME.bodyFont}}
  :root{ --logo-h:40px; --logo-h-center:30px }
  .wrap{padding:${THEME.padH}; font-size:${THEME.fontSizeH}px; line-height:1.35; width:100%}
  .grid{display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:12px}
  .left,.right{display:flex; align-items:center; gap:12px}
  .left{justify-content:flex-start}
  .center{justify-self:center; display:flex; align-items:center; gap:8px}
  .right{justify-content:flex-end}
  .muted{opacity:.7; margin-top:4px}
  img.logo{height:var(--logo-h)}
  img.logo.center{height:var(--logo-h-center)}
`;
//CSS Footer
const fcss = `
  *{box-sizing:border-box} body{margin:0; font-family:${THEME.bodyFont}}
  .wrap{background:${THEME.brandBg}; color:${THEME.brandText}; padding:${THEME.padF};
        font-size:${THEME.fontSizeF}px; line-height:1.35; border-top:${THEME.borderTopF}}
  .row{display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px}
  .col{display:flex; gap:${THEME.linkGap}; align-items:center; flex-wrap:wrap}
  a{color:${THEME.brandText}; text-decoration:none}
  .num{white-space:nowrap}
  img{height:14px}
`;

// === Feld-Mappings (deine Original-Feldnamen inkl. Aliase) ===
const meta = {
  datum:            pick(['Datum Arbeitstag: ', 'Datum']),
  einsatzort:       pick(['Einsatzort', 'Ort', 'Einsatz-Ort']),
  verantwortlicher: pick(['Arbeitsverantwortlicher', 'Verantwortlicher']),
  weitere:          pick(['weitere Einsatzkräfte:', 'weitere Einsatzkraefte'], '—'),
  kunde:            pick(['Ansprechpartner Kunde: ', 'Kunde']),
  kundeTel:         pick(['Kunde Telefon: ', 'Kunde Telefon', 'Telefon'], '—'),
  ersthelfer:       pick(['Ersthelfer vor Ort: '], '—'),
  submittedAt:      pick(['submittedAt'], now),
};

const sicherheit = {
  verkehr:           pick(['Verkehrsrechtliche Anordnung/Einsatz an Straße']),
  absperrung:        pick(['Absperrung']),
  helfer:            pick(['Posten - wie viele Helfer? ']),
  psa:               pick(['Persönliche Schutzausrüstung geprüft/getragen? ']),
  psaNote:           pick(['Bemerkungen zu Schutzausrüstung: ']),
  zufahrt:           pick(['Zufahrt für Maschinen möglich? ']),
  // Falls der Form-Key abweicht, hier anpassen:
  maschinen:         Array.isArray(d.Maschintyp) ? d.Maschintyp : (d.Maschintyp ? [d.Maschintyp] : []),
  maschinenbediener: pick(['Maschinenbediener: '], '—'),
  gefaehrdungen:     Array.isArray(d['Besondere Gefährdungen:']) ? d['Besondere Gefährdungen:'] : [],
  massnahmen:        pick(['Maßnahmen bei besonderer Gefährdung eingeleitet?']),
  unterwiesen:       pick(['Im Trupp/Arbeitsgruppe  unterwiesen?']),
};

// Zustimmung
const zustimmung = Array.isArray(d['Zustimmung:'])
  ? d['Zustimmung:'].join(', ')
  : pick(['Zustimmung:', 'Zustimmung'], '—');

// Wetter (OpenWeatherMap)
const wetter = {
  beschreibung: d.weather?.[0]?.description ?? '—',
  temp:         d.main?.temp ?? '—',
  druck:        d.main?.pressure ?? '—',
  wind:         d.wind?.speed ?? '—',
  wolken:       d.clouds?.all ?? '—',
};

// Rettungspunkte & GPS
const rp = Array.isArray(d.top_3_rettungspunkte) ? d.top_3_rettungspunkte : [];
const gps = {
  lat: pick(['Standortdaten - latitude (erster Wert in GoogleMaps)', 'lat', 'latitude'], ''),
  lon: pick(['Standortdaten - longitude (zweiter Wert in GoogleMaps)', 'lon', 'longitude'], ''),
};
const mapsUrl = (gps.lat && gps.lon)
  ? `https://www.google.com/maps?q=${encodeURIComponent(`${gps.lat},${gps.lon}`)}`
  : null;

// === HTML-Helper ===
const esc = (v) => String(v ?? '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

const chip  = (t) => `<span class="chip">${esc(t)}</span>`;

// FIX: war abgeschnitten → jetzt korrekt geschlossen
const chips = (arr = []) => (
  arr.length
    ? `<div class="chips">${arr.map(chip).join('')}</div>`
    : '<span class="muted">—</span>'
);

// === BODY HTML ===
const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Arbeitsauftrag Forstwirtschaft</title>
<style>
  :root{
    --bg:#0c1512; --surface:#12211a; --surface-2:#0e1b15; --card:#12261c;
    --brand-1:#10b981; --brand-2:#34d399; --text:#e6f2ec; --muted:#9fb3aa;
    --border:#0dde81; --warn:#f59e0b; --ok:#22c55e; --chip-bg:#5b7d71;
    /* Platz im Body – unabhängig von Chromium-Header/Footer */
    --top-gap: 0mm; --bottom-gap: 0mm;
  }
  @page { size:A4; }
  html, body { height:100%; }
  * { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body{margin:0;
    background:var(--bg); color:var(--text);
    font: 11pt/1.55 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  }
  .page{
    width:210mm; background:var(--surface);
    display:grid; grid-template-rows:auto 1fr auto;
    padding: 0 20px 0 20px;
  }
  .header{
    background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
    color:#05110d; border-radius:10px; padding:5mm 7mm; margin-bottom:6mm;
    margin-top: 4mm;
  }
  .header h1{ margin:0 0 2mm; font-size:18pt; letter-spacing:.2px; }
  .header .sub{ margin:0; opacity:.85; }
  .meta{ margin-top:2mm; display:flex; gap:6mm; flex-wrap:wrap; font-size:10pt;
  color:#052017; font-weight:600; 
  }
  .content{
  display: flex;               /* oder: display:grid */
  flex-direction: column;      /* bei grid nicht nötig */
  row-gap: 6mm;                /* <— HIER stellst du den Card-Abstand ein */
  }
  .card{ 
  background:var(--card); border:1px solid var(--border); 
  border-radius:12px;margin:0;
  overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,.23); page-break-inside:avoid;
  break-inside:avoid-page; 
  }
         
  .card .card-h{ padding:5mm 7mm 4mm; font-weight:700; letter-spacing:.3px; border-bottom:1px solid var(--border); }
  .card .card-b{ padding:4mm 5mm; }
  .card[class*='card--']{ border-left:4px solid var(--accent); }
  .card[class*='card--'] .card-h{ background:var(--accent); color:#05110d; }
  .card--auftrag{ --accent:#34d399; }
  .card--sicherheit{ --accent:#f59e0b; }
  .card--wetter{ --accent:#3b82f6; }
  .card--rettung{ --accent:#ef4444; }
  .card--gps{ --accent:#8b5cf6; }
  .card--zustimmung{ --accent:#10b981; }
  .grid{ display:flex; flex-wrap:wrap; gap:3mm 5mm; }
  .row{ display:flex; flex-direction:column; flex:1 1 calc(50% - 5mm); min-width:80mm; }
  .label{ font-size:10pt; color:var(--muted); text-transform:uppercase; letter-spacing:.35px; margin-bottom:1mm; }
  .val{ font-size:13pt; font-weight:600; }
  .yes{ color:var(--ok); } .no{ color:var(--warn); }
  .chips{ display:flex; flex-wrap:wrap; gap:4mm; margin-top:2mm; }
  .chip{ background:var(--chip-bg); border:1px solid var(--border); padding:2.5mm 4mm; border-radius:999px; font-size:9.5pt; font-weight:700; color:var(--text); }
  .chip.hazard{ background:#3b1f0a; border-color:#7a3c11; color:#ffcc88; }
  .weather{ display:grid; grid-template-columns:repeat(5,1fr); gap:6mm; text-align:center; }
  .wbox{ background:var(--surface-2); border:1px solid var(--border); border-radius:10px; padding:6mm 4mm; }
  .wval{ font-size:16pt; font-weight:800; color:var(--brand-2); margin-bottom:1mm; }
  .wlab{ font-size:8.5pt; color:var(--muted); text-transform:uppercase; }
  table.tbl{ width:100%; border-collapse:separate; border-spacing:0; background:var(--surface-2); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
  .tbl thead th{ background:#0f2b20; color:#c9f0e1; text-align:left; padding:4.5mm 5mm; font-size:10pt; border-bottom:1px solid var(--border); }
  .tbl td{ padding:4mm 5mm; border-bottom:1px solid var(--border); }
  .tbl tr:last-child td{ border-bottom:0; }
  .td-num{ text-align:right; font-weight:700; color:var(--brand-2); }
  .gps{ background:var(--surface-2); border:1px solid var(--border); border-radius:10px; padding:6mm; text-align:center; }
  .coord{ font:700 14pt/1.1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color:#8be0b6; margin:2mm 0 3mm; }
  .map a{ color:var(--brand-2); text-decoration:none; font-weight:700; }
  .map a:hover{ text-decoration:underline; }
  .consent{ display:flex; align-items:center; gap:4mm; }
  .consent-check{ font-size:14pt; color:var(--brand-2); }
  .consent-text{ font-size:10.5pt; line-height:1.4; }
  .consent-note{ margin-top:4mm; font-size:9pt; color:var(--muted); }
  @media screen and (max-width:900px){
    .grid{ flex-direction:column; }
    .row{ flex-basis:100%; }
    .weather{ grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>
  <div class="page">
    <!-- Body-Header (ästhetischer Kasten, unabhängig vom Chromium-Header) -->
    <div class="header">
      <h1>Arbeitsauftrag Forstwirtschaft</h1>
      <p class="sub">Einsatzort: ${esc(meta.einsatzort || '—')}</p>
      <div class="meta">
        <div><strong>Datum:</strong> ${esc(meta.datum || '—')}</div>
        <div><strong>Erstellt:</strong> ${esc(now)}</div>
        <div><strong>Verantwortlich:</strong> ${esc(meta.verantwortlicher || '—')}</div>
      </div>
    </div>

    <!-- Inhalt -->
    <div class="content">

      <div class="card card--auftrag">
        <div class="card-h">Auftragsdaten</div>
        <div class="card-b">
          <div class="grid">
            <div class="row"><div class="label">Einsatzort</div><div class="val">${esc(meta.einsatzort || '—')}</div></div>
            <div class="row"><div class="label">Arbeitsverantwortlicher</div><div class="val">${esc(meta.verantwortlicher || '—')}</div></div>
            <div class="row"><div class="label">Weitere Einsatzkräfte</div><div class="val">${esc(meta.weitere || '—')}</div></div>
            <div class="row"><div class="label">Ansprechpartner Kunde</div><div class="val">${esc(meta.kunde || '—')}</div></div>
            <div class="row"><div class="label">Kunde Telefon</div><div class="val">${esc(meta.kundeTel || '—')}</div></div>
            <div class="row"><div class="label">Ersthelfer vor Ort</div><div class="val">${esc(meta.ersthelfer || '—')}</div></div>
          </div>
        </div>
      </div>

      <div class="card card--sicherheit">
        <div class="card-h">Sicherheit &amp; Organisation</div>
        <div class="card-b">
          <div class="grid">
            <div class="row"><div class="label">Verkehrsrechtliche Anordnung</div><div class="val ${sicherheit.verkehr === 'ja' ? 'yes' : 'no'}">${esc(sicherheit.verkehr)}</div></div>
            <div class="row"><div class="label">Absperrung</div><div class="val">${esc(sicherheit.absperrung)}</div></div>
            <div class="row"><div class="label">Posten/Helfer</div><div class="val">${esc(sicherheit.helfer)}</div></div>
            <div class="row"><div class="label">PSA geprüft/getragen</div><div class="val ${sicherheit.psa === 'ja' ? 'yes' : 'no'}">${esc(sicherheit.psa)}</div></div>
            <div class="row"><div class="label">Zufahrt für Maschinen</div><div class="val ${sicherheit.zufahrt === 'ja' ? 'yes' : 'no'}">${esc(sicherheit.zufahrt)}</div></div>
            <div class="row"><div class="label">Maschinenbediener</div><div class="val">${esc(sicherheit.maschinenbediener)}</div></div>
          </div>

          ${ (sicherheit.psaNote && sicherheit.psaNote !== '—')
              ? '<div style="margin-top:5mm">'
                + '<div class="label">Bemerkungen PSA</div>'
                + '<div class="val">' + esc(sicherheit.psaNote) + '</div>'
              + '</div>'
              : ''
          }

          <div style="margin-top:6mm">
            <div class="label">Maschinentyp(en)</div>
            ${chips(sicherheit.maschinen)}
          </div>

          ${ sicherheit.gefaehrdungen.length
              ? '<div style="margin-top:6mm">'
                + '<div class="label">Besondere Gefährdungen</div>'
                + chips(sicherheit.gefaehrdungen.map(g => `⚠️ ${g}`))
              + '</div>'
              : ''
          }

          <div class="grid" style="margin-top:6mm">
            <div class="row"><div class="label">Maßnahmen bei Gefährdung eingeleitet</div><div class="val ${sicherheit.massnahmen === 'ja' ? 'yes' : 'no'}">${esc(sicherheit.massnahmen)}</div></div>
            <div class="row"><div class="label">Unterweisung im Trupp</div><div class="val ${sicherheit.unterwiesen === 'ja' ? 'yes' : 'no'}">${esc(sicherheit.unterwiesen)}</div></div>
          </div>
        </div>
      </div>

      <div class="card card--wetter">
        <div class="card-h">Wetterbedingungen</div>
        <div class="card-b">
          <div class="weather">
            <div class="wbox"><div class="wval">${esc(wetter.beschreibung)}</div><div class="wlab">Beschreibung</div></div>
            <div class="wbox"><div class="wval">${esc(wetter.temp)} °C</div><div class="wlab">Temperatur</div></div>
            <div class="wbox"><div class="wval">${esc(wetter.druck)} hPa</div><div class="wlab">Luftdruck</div></div>
            <div class="wbox"><div class="wval">${esc(wetter.wind)} m/s</div><div class="wlab">Wind</div></div>
            <div class="wbox"><div class="wval">${esc(wetter.wolken)} %</div><div class="wlab">Bewölkung</div></div>
          </div>
        </div>
      </div>

      <div class="card card--rettung">
        <div class="card-h">Nächste Rettungspunkte</div>
        <div class="card-b">
          <table class="tbl">
            <thead><tr><th>#</th><th>RP-Nummer</th><th>Beschreibung</th><th>Bundesland</th><th style="text-align:right">Entfernung</th></tr></thead>
            <tbody>
              ${
                rp.length
                  ? rp.map((p,i) =>
                      '<tr>'
                        + '<td>' + (i+1) + '</td>'
                        + '<td><strong>' + esc(p.rp_nr) + '</strong></td>'
                        + '<td>' + esc(p.beschreibung) + '</td>'
                        + '<td>' + esc(p.bundesland) + '</td>'
                        + '<td class="td-num">' + esc(p.entfernung_m) + ' m</td>'
                      + '</tr>'
                    ).join('')
                  : '<tr><td colspan="5" style="text-align:center;color:var(--muted);font-style:italic;padding:7mm 0">Keine Rettungspunkte gefunden</td></tr>'
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="card card--gps">
        <div class="card-h">GPS-Standort</div>
        <div class="card-b">
          <div class="gps">
            <div class="label">Koordinaten</div>
            <div class="coord">${esc(gps.lat || '—')}, ${esc(gps.lon || '—')}</div>
            <div class="map">
              ${
                mapsUrl
                  ? '<a href="' + esc(mapsUrl) + '">🗺️ Karte öffnen</a>'
                  : '<span style="color:var(--muted)">Kein Kartenlink verfügbar</span>'
              }
            </div>
          </div>
        </div>
      </div>

      <div class="card card--zustimmung">
        <div class="card-h">Zustimmung</div>
        <div class="card-b">
          <div class="consent">
            <div class="consent-check">✓</div>
            <div class="consent-text">Zustimmung des Nutzers (${esc(meta.verantwortlicher || '—')})</div>
          </div>
          <div class="consent-note">Diese digitale Zustimmung per Haken repräsentiert eine Unterschrift des Nutzers.</div>
        </div>
      </div>

    </div>
  </div>
</body>
</html>
`;

// Header-Template
const headerTemplate = `
  <style>${hcss}</style>
  <div class="wrap">
    <div class="grid">
      <div class="left">
        ${THEME.logoLeft ? `<img class="logo" src="${THEME.logoLeft}" alt="Logo left">` : ''}
      </div>
      <div class="center">
        ${THEME.logoCenter ? `<img class="logo center" src="${THEME.logoCenter}" alt="Logo center">` : ''}
        <strong>Forstauftrag</strong>
      </div>
      <div class="right">
        ${THEME.logoRight ? `<img class="logo" src="${THEME.logoRight}" alt="Logo right">` : ''}
      </div>
    </div>
    <div class="muted">Einsatzort: ${esc(meta.einsatzort || '—')} · ${esc(now)}</div>
  </div>
`;

// === CHROMIUM FOOTER ===
const footerTemplate = `
  <style>${fcss}</style>
  <div class="wrap">
    <div class="row">
      <div class="col">
        ${THEME.logoLeft ? `<img src="${THEME.logoLeft}" alt="Logo"/>` : ''}
        <strong>Ryzeup UG</strong>
        <span>Rotthang 3, 84494 Neumarkt-Sankt Veit</span>
        <span>HRB 33167, AG Traunstein</span>
      </div>
      <div class="col">
        <a>Kontakt</a><a>About</a><a>Termin</a><a>Datenschutz</a>
        <span class="num"><span class="pageNumber"></span>/<span class="totalPages"></span></span>
      </div>
    </div>
    <div class="row" style="margin-top:4px">
      <div>© ${new Date().getFullYear()} Ryzeup UG. Alle Rechte vorbehalten.</div>
    </div>
  </div>
`;

// === EMPFOHLENE DRUCK-RÄNDER FÜR Gotenberg/Chromium ===
// Diese Werte musst du beim HTTP Request mitgeben (siehe unten).
const printOptions = {
  paperWidth:  8.27,  // A4 in Inch
  paperHeight: 11.69, // A4 in Inch
  marginTop:    0.85,  // ~15 mm
  marginBottom: 0.53,  // ~15 mm
  marginLeft:   0.05, // 10 mm
  marginRight:  0, // 10 mm
  printBackground: true,
  scale: 1,
};

// ---------- Robustheits-Footer für pdf-template.js ----------

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 500;
const JITTER_MS = 250;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function hasAll(paths, root) {
  return paths.every(p => {
    const v = get(root, p);
    return v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '');
  });
}

// Wenn du Daten aus benannten Nodes brauchst, kannst du sie hier mergen.
function isReady() {
  return true;
}

// Achtung: Wir geben bewusst KEIN ...item.json zurück, um Payload-Aufblähung & Zyklen zu verhindern.
async function finalizePdfSafe(buildFn) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (isReady()) {
      const result = buildFn();

      // Mini-Validierung gegen leere PDFs
      if (!result || !result.html || typeof result.html !== 'string' || result.html.trim() === '') {
        throw new Error('TransientError: html not built yet');
      }

      // N8N-Format: Array von Items mit { json: ... }
      return { json: result };
    }
    if (attempt < MAX_ATTEMPTS) {
      const backoff = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * JITTER_MS);
      const wait = backoff + jitter;
      console.log(`[pdf-template] Inputs not ready (${attempt}/${MAX_ATTEMPTS - 1}). Wait ${wait}ms`);
      await sleep(wait);
    }
  }
  throw new Error('TransientError: PDF template inputs not ready');
}

// ---------- ENDE Robustheits-Footer ----------

function buildOriginalReturn() {
  return {
    html,
    headerTemplate,
    footerTemplate,
    printOptions,
    // << NEU: nur was der nächste Node zum Benennen braucht
    metaForFilename: {
      einsatzort: meta.einsatzort || '',
      datum: meta.datum || ''   // deine Formular-Datumsspalte
    }
  };
}

return await finalizePdfSafe(buildOriginalReturn);
