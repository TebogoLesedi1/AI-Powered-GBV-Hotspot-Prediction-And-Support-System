const DATA_URL = '../extracted_datasets/GBV Dataset.csv';
const state = { stations: [], map: null, markers: [] };

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
  if (typeof L !== 'undefined') {
    state.map = L.map('station-map', { scrollWheelZoom: false }).setView([-29.2, 24.7], 4.7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.map);
  }
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error('Station dataset unavailable');
  state.stations = parseDelimited(await response.text());
  const provinces = [...new Set(state.stations.map(station => station.Province).filter(Boolean))].sort();
  document.querySelector('#province-filter').innerHTML = '<option value="all">All provinces</option>' + provinces.map(province => `<option>${escapeHTML(province)}</option>`).join('');
  document.querySelector('#province-filter').addEventListener('change', drawMap);
  document.querySelector('#year-filter').addEventListener('change', drawMap);
  document.querySelector('#map-reset').addEventListener('click', drawMap);
  drawMap();
  window.setTimeout(() => state.map.invalidateSize(), 0);
}

init().catch(error => { document.querySelector('#station-map').innerHTML = `<p class="map-error">${escapeHTML(error.message)}</p>`; });
