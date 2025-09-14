// Mode: Run Once For All Items
// 1) GPS-Quelle: das erste Item von Form3 (oder Form1, wenn dir lieber)
const form = $('Form3').first().json;
// alternativ: const form = $('Form1').first().json;

const latStr = form['Standortdaten - latitude (erster Wert in GoogleMaps)'];
const lonStr = form['Standortdaten - longitude (zweiter Wert in GoogleMaps)'];

const latitude  = Number.parseFloat(String(latStr).replace(',', '.'));
const longitude = Number.parseFloat(String(lonStr).replace(',', '.'));

if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
  // Flow nicht hart abbrechen: leere Struktur zurückgeben
  return [{ json: { gps_ursprung: null, top_3_rettungspunkte: [], naechster_rettungspunkt: null } }];
}

// 2) Rettungspunkte kommen als Items vom Supabase-Node
const rettungspunkte = $items();

// 3) Haversine – saubere, getestete Version (Meter)
function distM(lat1, lon1, lat2, lon2) {
  const R = 6371e3, toRad = d => d * Math.PI / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * R;
}

// 4) Distanzen berechnen
const list = rettungspunkte.map(p => {
  const latP = Number.parseFloat(p.json.wgs_breite);
  const lonP = Number.parseFloat(p.json.wgs_laenge);
  if (!Number.isFinite(latP) || !Number.isFinite(lonP)) return null;
  const m = Math.round(distM(latitude, longitude, latP, lonP));
  return {
    rp_nr: p.json.rp_nr,
    entfernung_m: m,
    entfernung_text: m < 1000 ? `${m} m` : `${(m/1000).toFixed(2)} km`,
    lat: latP, lon: lonP,
    id: p.json.id,
    beschreibung: p.json.beschreibung,
    bundesland: p.json.bundesland,
  };
}).filter(Boolean);

if (!list.length) {
  return [{ json: { gps_ursprung: { latitude, longitude }, top_3_rettungspunkte: [], naechster_rettungspunkt: null } }];
}

const top3 = list.sort((a,b) => a.entfernung_m - b.entfernung_m).slice(0,3);

return [{
  json: {
    gps_ursprung: { latitude, longitude },
    top_3_rettungspunkte: top3,
    naechster_rettungspunkt: top3[0],
  }
}];
