// Query params ziehen
const q = $json.query || $json;
let lat = q.lat ?? q.latitude ?? null;
let lon = q.lon ?? q.longitude ?? null;

// === TEST-FALLBACK ===
// greift NUR, wenn a) keine Koordinaten da sind UND b) noGeo=1 ODER Form im Testmodus ist
const isTest = String($json.formMode || '').toLowerCase() === 'test';
if ((lat == null || lon == null) && (q.noGeo === '1' || isTest)) {
  // München Marienplatz: 48.137154, 11.576124 (nur fürs Testen!)
  lat = '48.137154';
  lon = '11.576124';
  $json.geo_source = 'fallback';   // Meta fürs Debug/Sheet
}

if (lat != null && lon != null) {
  $json['Standortdaten - latitude (erster Wert in GoogleMaps)']  = String(lat);
  $json['Standortdaten - longitude (zweiter Wert in GoogleMaps)'] = String(lon);
}

if (q.einsatzort) $json['Einsatzort'] = String(q.einsatzort);
return item;
