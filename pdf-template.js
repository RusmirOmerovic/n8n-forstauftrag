// Sichere Daten + HTML für Gotenberg (self-contained)
const d = item.json || {};
const now = new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

// Helper mit Aliassen
const pick = (keys, def='—') => {
  for (const k of keys) {
    const v = d?.[k];
    if (v !== undefined && v !== null && String(v) !== '') return v;
  }
  return def;
};

// Firmenangaben
const firma = {
  name: d["Firma/Organisation"] ?? "Forstauftrag online",
  web:  d["Firma Website"] ?? "forstauftrag.online",
  mail: d["Firma E-Mail"] ?? "info@forstauftrag.online",
  tel:  d["Firma Telefon"] ?? "–",
  addr: d["Firma Adresse"] ?? "–",
};

// Logo (DataURL bevorzugt)
const uploadLogo = item.binary?.Firmenlogo || item.binary?.logo || item.binary?.jo;
const fallbackBinLogo = item.binary?.fallback_logo;
const dataUrlFromBin = (bin) => bin ? `data:${bin.mimeType || 'image/png'};base64,${bin.data}` : null;
const DEFAULT_LOGO_DATA_URL = null;
const logoDataUrl = dataUrlFromBin(uploadLogo) || dataUrlFromBin(fallbackBinLogo) || DEFAULT_LOGO_DATA_URL;

// === MAPPINGS (genau deine Feldnamen + Aliase)
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
  maschinen:         Array.isArray(d.Maschintyp) ? d.Maschintyp : (d.Maschintyp ? [d.Maschintyp] : []),
  maschinenbediener: pick(['Maschinenbediener: '], '—'),
  gefaehrdungen:     Array.isArray(d['Besondere Gefährdungen:']) ? d['Besondere Gefährdungen:'] : [],
  massnahmen:        pick(['Maßnahmen bei besonderer Gefährdung eingeleitet?']),
  unterwiesen:       pick(['Im Trupp/Arbeitsgruppe  unterwiesen?']),
};

// Zustimmung / Unterschrift-Ersatz
const zustimmung = Array.isArray(d['Zustimmung:']) ? d['Zustimmung:'].join(', ') : pick(['Zustimmung:', 'Zustimmung'], '—');

// Wetter (OpenWeatherMap)
const wetter = {
  beschreibung: d.weather?.[0]?.description ?? '—',
  temp:         d.main?.temp ?? '—',
  druck:        d.main?.pressure ?? '—',
  wind:         d.wind?.speed ?? '—',
  wolken:       d.clouds?.all ?? '—',
};

// Rettungspunkte + GPS
const rp = Array.isArray(d.top_3_rettungspunkte) ? d.top_3_rettungspunkte : [];
const gps = {
  lat: pick(['Standortdaten - latitude (erster Wert in GoogleMaps)', 'lat', 'latitude'], ''),
  lon: pick(['Standortdaten - longitude (zweiter Wert in GoogleMaps)', 'lon', 'longitude'], ''),
};
const mapsUrl = (gps.lat && gps.lon)
  ? `https://www.google.com/maps?q=${encodeURIComponent(`${gps.lat},${gps.lon}`)}`
  : null;

// Helpers
const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const chip = (t) => `<span class="chip">${esc(t)}</span>`;
const chips = (arr=[]) => arr.length ? `<div class="chips">${arr.map(chip).join('')}</div>` : '<span class="muted">—</span>';
const badge = (t) => `<span class="badge">${esc(t)}</span>`;
const badges = (arr=[]) => arr.length ? `<div class="badges-list">${arr.map(badge).join('')}</div>` : '<span class="muted">—</span>';
// Header/Footer (Chromium)
const headerTemplate = `
  <style>
    *{box-sizing:border-box} body{margin:0;font-family:Arial,Helvetica,sans-serif}
    .h-wrap{background:#B8E6F1; padding:10px 24px; display:flex; align-items:center; justify-content:space-between; font-size:10px;}
    .h-left{display:flex; align-items:center; gap:12px}
    .h-left img{width:28px;height:28px;object-fit:contain}
    .h-title{font-size:14px;font-weight:700}
    .h-meta{font-size:10px;opacity:.8}
  </style>
  <div class="h-wrap">
    <div class="h-left">
      ${logoDataUrl ? `<img src="${esc(logoDataUrl)}" alt="Logo"/>` : `<div style="width:28px;height:28px;border-radius:4px;background:#fff;"></div>`}
      <div>
        <div class="h-title">${esc(firma.name)}</div>
        <div class="h-meta">Arbeitsauftrag • ${esc(meta.einsatzort || '—')}</div>
      </div>
    </div>
    <div>
      <div><b>Datum:</b> ${esc(meta.datum || '—')}</div>
      <div><b>Erstellt:</b> ${esc(now)}</div>
    </div>
  </div>
`;

const footerTemplate = `
  <style>
    *{box-sizing:border-box} body{margin:0;font-family:Arial,Helvetica,sans-serif}
    .f-wrap{background:#BFC0C3; padding:8px 24px; display:flex; align-items:center; justify-content:space-between; font-size:9px;}
    .f-stack{display:flex; gap:16px; align-items:center}
    .f-stack a:first-child{font-weight:700}
    .page::after{content: counter(page) " / " counter(pages);}
  </style>
  <div class="f-wrap">
    <div class="f-stack">
      <a>${esc(firma.web)}</a>
      <a>${esc(firma.mail)}</a>
      <span>${esc(firma.tel)}</span>
      <span>${esc(firma.addr)}</span>
    </div>
    <div class="page"></div>
  </div>
`;

// === Logos als Data-URLs (klein & inline) ===
const LOGO_RYZEUP =
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...a3OsjqVrc6yOpWB1nd6iCrW93qIKvbv7/9P7kwWAbzG//hAAAAAElFTkSuQmCC';

const LOGO_BG =
'data:image/png;base64,iVBORw0KGgoAAAAN...rnhsxHpXFDzw1+5qes4+tnuK+yGnlEvgbyf74KI2LxKXQSAAAAAElFTkSuQmCC';

const LOGO_AUFTRAG =
'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...TGCAgoRKOExhghFDEJP6ZvBQoUKFCgwH/jn+jaYT69zpq7AAAAAElFTkSuQmCC';

// Verbesserter JavaScript Code für das PDF-Layout
// Dieser Code ersetzt den bestehenden HTML-Generierungsteil in Ihrem n8n Workflow

const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Arbeitsauftrag Forstwirtschaft</title>
<style>
  :root{
    --bg: #0c1512;
    --surface: #12211a;
    --surface-2: #0e1b15;
    --card: #12261c;
    --brand-1: #10b981;      /* Akzentgrün */
    --brand-2: #34d399;      /* Verlauf */
    --text: #e6f2ec;         /* Haupttext */
    --muted: #9fb3aa;        /* Sekundärtext */
    --border: #1f3a2e;       /* Kartenrahmen */
    --warn: #f59e0b;
    --ok: #22c55e;
    --chip-bg: #0f3326;
  }

  /* Vollflächig drucken */
  @page { size: A4; margin: 0; }
  html, body { height: 100%; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  body{
    margin:0; padding:0;
    background: var(--bg);
    color: var(--text);
    font: 12pt/1.45 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  }

  /* Eine A4-Seite mit Innenabstand – keine äußeren Ränder */
  .page{
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: var(--surface);
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: 16mm 16mm 14mm 16mm;   /* Innenabstand statt Seitenränder */
  }

  /* Obere Logozeile */
  .logos{
    display:flex; align-items:center; justify-content:flex-start; gap:16mm;
    margin-bottom: 8mm;
  }
  .logos img{
    height: 14mm; width:auto; display:block;
    filter: drop-shadow(0 1px 0 rgba(0,0,0,.15));
  }

  /* Headline-Bar */
  .header{
    background: linear-gradient(135deg, var(--brand-1), var(--brand-2));
    color:#05110d;
    border-radius: 10px;
    padding: 10mm 12mm;
    margin-bottom: 8mm;
  }
  .header h1{ margin:0 0 2mm 0; font-size: 20pt; letter-spacing: .2px; }
  .header .sub{ margin:0; opacity:.85; }
  .meta{
    margin-top: 2mm;
    display:flex; gap:10mm; flex-wrap:wrap;
    font-size:10pt; color:#052017; font-weight:600;
  }

  /* Inhalt */
  .content{ display:block; }

  .card{
    background: var(--card);
    border:1px solid var(--border);
    border-radius:12px;
    margin: 0 0 6mm 0;
    overflow:hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,.18);
    page-break-inside: avoid;
    break-inside: avoid-page;
  }
  .card .card-h{
    background: linear-gradient(90deg, #0f2b20, rgba(15,43,32,0));
    padding: 8mm 10mm 5mm 10mm;
    font-weight:700; letter-spacing:.3px; border-bottom:1px solid var(--border);
  }
  .card .card-b{ padding: 8mm 10mm; }

  .grid{
    display:grid; grid-template-columns: 1fr 1fr; gap: 6mm 10mm;
  }
  .row{ display:flex; flex-direction:column; }
  .label{ font-size: 9pt; color: var(--muted); text-transform: uppercase; letter-spacing:.35px; margin-bottom:1mm; }
  .val{ font-size: 11.5pt; font-weight:600; }

  .yes{ color: var(--ok); }
  .no{ color: var(--warn); }

  .chips{ display:flex; flex-wrap:wrap; gap:4mm; margin-top:2mm; }
  .chip{
    background: var(--chip-bg);
    border:1px solid var(--border);
    padding: 2.5mm 4mm; border-radius: 999px;
    font-size:9pt; font-weight:700; color: var(--text);
  }
  .chip.hazard{ background:#3b1f0a; border-color:#7a3c11; color:#ffcc88; }

  .weather{
    display:grid; grid-template-columns: repeat(5, 1fr); gap:6mm; text-align:center;
  }
  .wbox{
    background: var(--surface-2);
    border:1px solid var(--border); border-radius:10px; padding:6mm 4mm;
  }
  .wval{ font-size: 16pt; font-weight:800; color: var(--brand-2); margin-bottom:1mm; }
  .wlab{ font-size:8.5pt; color: var(--muted); text-transform:uppercase; }

  table.tbl{ width:100%; border-collapse:separate; border-spacing:0; background:var(--surface-2); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
  .tbl thead th{
    background:#0f2b20; color:#c9f0e1; text-align:left; padding:4.5mm 5mm; font-size:10pt; border-bottom:1px solid var(--border);
  }
  .tbl td{ padding:4.5mm 5mm; border-bottom:1px solid var(--border); }
  .tbl tr:last-child td{ border-bottom:0; }
  .td-num{ text-align:right; font-weight:700; color: var(--brand-2); }

  .gps{
    background: var(--surface-2); border:1px solid var(--border); border-radius:10px; padding:6mm; text-align:center;
  }
  .coord{ font: 700 14pt/1.1 "SFMono-Regular", ui-monospace, Menlo, Consolas, monospace; color: #8be0b6; margin: 2mm 0 3mm; }
  .map a{ color: var(--brand-2); text-decoration:none; font-weight:700; }
  .map a:hover{ text-decoration:underline; }

  .consent-text{ font-size:10pt; line-height:1.4; }

  .footer{
    margin-top: 8mm;
    border-top: 1px solid var(--border);
    padding-top: 6mm;
    display:flex; align-items:flex-start; justify-content:space-between; gap:8mm; color: var(--muted); font-size:9.5pt;
  }
  .f-left{ max-width: 105mm; }
  .f-right{ text-align:right; }

  /* Mobile Vorschau */
  @media screen and (max-width: 900px){
    .grid{ grid-template-columns:1fr; }
    .weather{ grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>
  <div class="page">

    <!-- Logos -->
    <div class="logos">
      <img src="DATA_URI_RYZEUP" alt="RYZEUP">
      <img src="DATA_URI_BG" alt="BG">
      <img src="DATA_URI_AUFTRAG" alt="Auftrag">
    </div>

    <!-- Header -->
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

      <div class="card">
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

      <div class="card">
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

          ${sicherheit.psaNote && sicherheit.psaNote !== '—' ? `
          <div style="margin-top:5mm">
            <div class="label">Bemerkungen PSA</div>
            <div class="val">${esc(sicherheit.psaNote)}</div>
          </div>` : ''}

          <div style="margin-top:6mm">
            <div class="label">Maschinentyp(en)</div>
            <div class="chips">${sicherheit.maschinen.map(m => `<span class="chip">${esc(m)}</span>`).join('')}</div>
          </div>

          ${sicherheit.gefaehrdungen.length ? `
          <div style="margin-top:6mm">
            <div class="label">Besondere Gefährdungen</div>
            <div class="chips">${sicherheit.gefaehrdungen.map(g => `<span class="chip hazard">${esc(g)}</span>`).join('')}</div>
          </div>` : ''}

          <div class="grid" style="margin-top:6mm">
            <div class="row"><div class="label">Maßnahmen bei Gefährdung eingeleitet</div><div class="val ${sicherheit.massnahmen === 'ja' ? 'yes' : 'no'}">${esc(sicherheit.massnahmen)}</div></div>
            <div class="row"><div class="label">Unterweisung im Trupp</div><div class="val ${sicherheit.unterwiesen === 'ja' ? 'yes' : 'no'}">${esc(sicherheit.unterwiesen)}</div></div>
          </div>
        </div>
      </div>

      <div class="card">
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

      <div class="card">
        <div class="card-h">Nächste Rettungspunkte</div>
        <div class="card-b">
          <table class="tbl">
            <thead><tr><th>#</th><th>RP-Nummer</th><th>Beschreibung</th><th>Bundesland</th><th style="text-align:right">Entfernung</th></tr></thead>
            <tbody>
              ${rp.length ? rp.map((p,i)=>`
              <tr>
                <td>${i+1}</td>
                <td><strong>${esc(p.rp_nr)}</strong></td>
                <td>${esc(p.beschreibung)}</td>
                <td>${esc(p.bundesland)}</td>
                <td class="td-num">${esc(p.entfernung_m)} m</td>
              </tr>`).join('') :
              `<tr><td colspan="5" style="text-align:center;color:var(--muted);font-style:italic;padding:7mm 0">Keine Rettungspunkte gefunden</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-h">GPS-Standort</div>
        <div class="card-b">
          <div class="gps">
            <div class="label">Koordinaten</div>
            <div class="coord">${esc(gps.lat || '—')}, ${esc(gps.lon || '—')}</div>
            <div class="map">
              ${mapsUrl ? `<a href="${esc(mapsUrl)}">🗺️ Karte öffnen</a>` : '<span style="color:var(--muted)">Kein Kartenlink verfügbar</span>'}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-h">Zustimmung</div>
        <div class="card-b">
          <div class="consent-text">${esc(zustimmung)}</div>
        </div>
      </div>
    </div>

    <!-- Footer im Body (keine Gotenberg-Header/Footer nötig) -->
    <div class="footer">
      <div class="f-left">
        <div><strong>Ryzeup UG (haftungsbeschränkt)</strong></div>
        <div>Vertretungsberechtigt: Robin Alexander Riemel</div>
        <div>Rotthang 3, 84494 Neumarkt-Sankt Veit</div>
        <div>Amtsgericht Traunstein · HRB 31367</div>
      </div>
      <div class="f-right">
        <div>© 2025 Ryzeup UG (haftungsbeschränkt). All rights reserved.</div>
        <div>ryzeup.ai · info@ryzeup.ai</div>
      </div>
    </div>

  </div>
</body>
</html>
`;

// Rückgabe
return { json: { ...item.json, html, headerTemplate, footerTemplate } };
