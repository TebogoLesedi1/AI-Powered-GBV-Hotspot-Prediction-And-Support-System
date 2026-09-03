const DATA_URL = '../extracted_datasets/GBV Dataset.csv';
const state = { stations: [], map: null, markers: [] };
const EMBEDDED_STATIONS = [
  ['Free State','Park Road',-29.11994,26.21159,'High',1903,1982,1933,1806,1682,9306],
  ['Gauteng','Midrand',-25.997,28.128,'High',1420,1765,1764,1736,1679,8364],['Gauteng','Honeydew',-26.0732,27.9201,'High',2149,1717,1838,1644,1665,9013],['Gauteng','Roodepoort',-26.17733,27.97173,'High',1367,1806,1858,1603,1558,8192],['Gauteng','JHB Central',-26.20676,28.03141,'High',2021,2231,1954,1556,1505,9267],['Gauteng','Ivory park',-25.99001,28.20162,'Med-high',1342,1411,1408,1273,1407,6841],['Gauteng','Tembisa',-26.00749,28.22014,'High',1473,1553,1423,1314,1397,7160],['Gauteng','Brooklyn',-25.75555,28.23751,'High',1631,1489,1521,1427,1359,7427],['Gauteng','Sandton',-26.08026,28.0615,'Med-high',1320,1268,1530,1536,1329,6983],
  ['KwaZulu-Natal','Inanda',-29.6968,30.93351,'High',1379,1437,1423,1506,1787,7532],['KwaZulu-Natal','Durban Central',-29.84249,31.02867,'High',2037,2386,2207,2044,1784,10458],['KwaZulu-Natal','Phoenix',-29.70143,31.00799,'High',1816,1927,1979,1976,1612,9310],['KwaZulu-Natal','Plessislaer',-29.64513,30.33879,'High',1494,1627,1544,1457,1567,7689],['KwaZulu-Natal','Chatsworth',-29.91231,30.88538,'High',1284,1476,1630,1827,1463,7680],['KwaZulu-Natal','Kwadukuza',-29.34719,31.2843,'High',1445,1525,1520,1420,1404,7314],['KwaZulu-Natal','Pinetown',-29.81797,30.87201,'High',1516,1454,1493,1450,1392,7305],['KwaZulu-Natal','Empangeni',-28.74586,31.88623,'High',1476,1452,1399,1385,1333,7045],['KwaZulu-Natal','Umlazi',-29.96252,30.92848,'Med-high',1195,1263,1413,1236,1285,6392],['KwaZulu-Natal','Verulam',-29.64474,31.04136,'Med-high',1158,1178,1434,1295,1277,6342],
  ['Limpopo','Polokwane',-23.91312,29.45481,'Med-high',1165,1300,1488,1454,1342,6749],['Limpopo','Thohoyandou',-22.97234,30.45594,'Med-high',1236,1459,1474,1541,1285,6995],['Limpopo','Seshego',-23.85429,29.38227,'Med-high',1018,1221,1410,1285,1276,6210],['North West','Rustenburg',-25.66821,27.24845,'High',1681,1854,1807,1564,1433,8339],
  ['Western Cape','Cape Town central',-33.92774,18.4231,'High',2653,3079,3322,3102,2824,14980],['Western Cape','Mitchells Plain',-34.04761,18.62321,'High',1973,2218,2116,1771,1861,9939],['Western Cape','Mfuleni',-33.98106,18.68742,'High',1433,1817,1953,1938,1691,8832],['Western Cape','Delft',-33.97502,18.64209,'High',1564,1597,1640,1767,1576,8144],['Western Cape','Kraaifontein',-33.85696,18.7271,'High',1450,1578,1784,1578,1502,7892],['Western Cape','Worcester',-33.64546,19.44373,'High',1574,1601,1567,1371,1306,7419],['Western Cape','Stellenbosch',-33.9356,18.85603,'High',1428,1544,1595,1498,1286,7351]
].map(([Province, Station, Latitude, Longitude, Risk, y2022, y2023, y2024, y2025, y2026, TOTAL]) => ({ Province, Station, Latitude, Longitude, Risk, 2022: y2022, 2023: y2023, 2024: y2024, 2025: y2025, 2026: y2026, TOTAL }));

function parseDelimited(text) {
  const rows = text.trim().split(/\r?\n/).map(line => line.split(';'));
  const headers = rows.shift().map(header => header.trim());
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] || '').trim()])));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
}

function drawMap() {
  const province = document.querySelector('#province-filter').value;
  const year = document.querySelector('#year-filter').value;
  const stations = state.stations.filter(station => station.Station && station.Latitude && station.Longitude && (province === 'all' || station.Province === province));
  if (!state.map) {
    drawFallbackMap(stations, year);
    return;
  }
  state.markers.forEach(marker => marker.remove());
  state.markers = stations.map(station => {
    const latitude = Number(station.Latitude.replace('=', ''));
    const longitude = Number(station.Longitude.replace('=', ''));
    const color = station.Risk === 'High' ? '#b34d8e' : '#d7a7f3';
    const marker = L.circleMarker([latitude, longitude], { radius: 9, color: '#fff', weight: 2, fillColor: color, fillOpacity: .94 }).addTo(state.map);
    marker.bindPopup(`<strong>${escapeHTML(station.Station)}</strong><br>${escapeHTML(station.Province)} · ${escapeHTML(station.Risk)}<br><b>${Number(station[year] || 0).toLocaleString()}</b> cases ${year === 'TOTAL' ? 'total' : `in ${year}`}`);
    return marker;
  });
  document.querySelector('#visible-count').textContent = stations.length;
  document.querySelector('#visible-cases').textContent = stations.reduce((total, station) => total + Number(station[year] || 0), 0).toLocaleString();
  if (state.markers.length) state.map.fitBounds(L.latLngBounds(state.markers.map(marker => marker.getLatLng())), { padding: [30, 30], maxZoom: 8 });
}

function drawFallbackMap(stations, year) {
  const mapElement = document.querySelector('#station-map');
  mapElement.innerHTML = `<div class="fallback-map"><div class="fallback-label">South Africa · station records</div><div class="fallback-grid"></div>${stations.map(station => {
    const latitude = Number(station.Latitude.replace('=', ''));
    const longitude = Number(station.Longitude.replace('=', ''));
    const left = Math.max(3, Math.min(97, ((longitude - 16) / 18) * 100));
    const top = Math.max(5, Math.min(95, ((-latitude - 22) / 14) * 100));
    const colorClass = station.Risk === 'High' ? 'high' : 'medium';
    return `<button class="fallback-marker ${colorClass}" style="left:${left}%;top:${top}%" title="${escapeHTML(station.Station)}" data-station="${escapeHTML(station.Station)}" data-province="${escapeHTML(station.Province)}" data-risk="${escapeHTML(station.Risk)}" data-cases="${Number(station[year] || 0).toLocaleString()}"></button>`;
  }).join('')}<div class="fallback-info" id="fallback-info">Select a station marker for details.</div></div>`;
  mapElement.querySelectorAll('.fallback-marker').forEach(marker => marker.addEventListener('click', () => {
    mapElement.querySelector('#fallback-info').innerHTML = `<strong>${marker.dataset.station}</strong><br>${marker.dataset.province} · ${marker.dataset.risk}<br><b>${marker.dataset.cases}</b> cases ${year === 'TOTAL' ? 'total' : `in ${year}`}`;
  }));
  document.querySelector('#visible-count').textContent = stations.length;
  document.querySelector('#visible-cases').textContent = stations.reduce((total, station) => total + Number(station[year] || 0), 0).toLocaleString();
}

async function init() {
  if (EMBEDDED_STATIONS.length) {
    state.stations = EMBEDDED_STATIONS;
  } else {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error('Station dataset unavailable');
    state.stations = parseDelimited(await response.text());
  }
  const provinces = [...new Set(state.stations.map(station => station.Province).filter(Boolean))].sort();
  document.querySelector('#province-filter').innerHTML = '<option value="all">All provinces</option>' + provinces.map(province => `<option>${escapeHTML(province)}</option>`).join('');
  document.querySelector('#province-filter').addEventListener('change', drawMap);
  document.querySelector('#year-filter').addEventListener('change', drawMap);
  document.querySelector('#map-reset').addEventListener('click', drawMap);
  if (typeof L !== 'undefined') {
    try {
      state.map = L.map('station-map', { scrollWheelZoom: false }).setView([-29.2, 24.7], 4.7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.map);
    } catch (error) {
      state.map = null;
    }
  }
  drawMap();
  if (state.map) window.setTimeout(() => state.map.invalidateSize(), 0);
}

init().catch(error => { document.querySelector('#station-map').innerHTML = `<p class="map-error">${escapeHTML(error.message)}</p>`; });
