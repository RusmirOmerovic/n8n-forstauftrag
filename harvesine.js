// 1) GPS-Quelle: Form3 bevorzugt; Fallback: Form1; zusätzlich formQueryParameters (lat/lon)
function getFormNode() {
const f3 = $('Form3').first();
if (f3 && f3.json) return { name: 'Form3', json: f3.json };
const f1 = $('Form1').first();
if (f1 && f1.json) return { name: 'Form1', json: f1.json };
return { name: null, json: null };
}
const { name: formNodeName, json: form } = getFormNode();

// Robust: Koordinaten aus Formularfeldern ODER formQueryParameters
const latStr = form?.['Standortdaten - latitude (erster Wert in GoogleMaps)'];
const lonStr = form?.['Standortdaten - longitude (zweiter Wert in GoogleMaps)'];
const qpLat = form?.formQueryParameters?.lat;
const qpLon = form?.formQueryParameters?.lon;

// Helper: Kommas & Strings tolerant parsen
function toNum(v) {
if (v === null || v === undefined) return NaN;
return Number.parseFloat(String(v).replace(',', '.').trim());
}

let latitude = toNum(latStr);
let longitude = toNum(lonStr);
let source = 'form_fields';
if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
latitude = toNum(qpLat);
longitude = toNum(qpLon);
if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
source = 'formQueryParameters:lat|lon';
}
}

// Wenn weiterhin keine gültigen Koordinaten → leer zurückgeben (aber nicht hart failen)
if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
return [{
json: {
gps_ursprung: null,
top_3_rettungspunkte: [],
naechster_rettungspunkt: null,
hinweis: 'Kein gültiges GPS im Formular gefunden.',
debug: {
form_node_found: !!form,
form_node_name: formNodeName ?? null,
form_keys: form ? Object.keys(form) : []
}
}
}];
}

// 2) Rettungspunkte kommen als Items vom Supabase-Node
const rettungspunkte = $items();

// 3) Haversine – Meter
function distM(lat1, lon1, lat2, lon2) {
const R = 6371e3, toRad = d => d * Math.PI / 180;
const φ1 = toRad(lat1), φ2 = toRad(lat2);
const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * R;
}

// 4) Maps-Link-Builder (Google, OSM, Apple)
function mapsFor(lat, lon, label = 'Standort') {
const latS = Number(lat).toFixed(6);
const lonS = Number(lon).toFixed(6);
const q = `${latS},${lonS}`;
return {
gmaps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
osm: `https://www.openstreetmap.org/?mlat=${latS}&mlon=${lonS}#map=17/${latS}/${lonS}`,
apple: `https://maps.apple.com/?ll=${latS},${lonS}&q=${encodeURIComponent(label)}`
};
}

// 5) Distanzen + Links berechnen
const list = rettungspunkte.map(p => {
const latP = toNum(p.json.wgs_breite);
const lonP = toNum(p.json.wgs_laenge);
if (!Number.isFinite(latP) || !Number.isFinite(lonP)) return null;
const m = Math.round(distM(latitude, longitude, latP, lonP));
const maps = mapsFor(latP, lonP, `Rettungspunkt ${p.json.rp_nr ?? ''}`.trim());
return {
rp_nr: p.json.rp_nr,
entfernung_m: m,
entfernung_text: m < 1000 ? `${m} m` : `${(m/1000).toFixed(2)} km`,
lat: latP, lon: lonP,
id: p.json.id,
beschreibung: p.json.beschreibung,
bundesland: p.json.bundesland,
maps
};
}).filter(Boolean);

if (!list.length) {
return [{
json: {
gps_ursprung: { latitude, longitude, source, maps: mapsFor(latitude, longitude) },
top_3_rettungspunkte: [],
naechster_rettungspunkt: null
}
}];
}

// 6) Sortierung & Output
const top3 = list.sort((a,b) => a.entfernung_m - b.entfernung_m).slice(0, 3);
return [{
json: {
gps_ursprung: { latitude, longitude, source, maps: mapsFor(latitude, longitude, 'Einsatzort') },
top_3_rettungspunkte: top3,
naechster_rettungspunkt: top3[0]
}
}];