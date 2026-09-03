const REPORT_URL = '../datasets/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt';
const STATION_URL = '../extracted_datasets/GBV Dataset.csv';
const state = { records: [], stations: [], ready: false, map: null, markers: [], visibleStations: [] };
const messages = document.querySelector('#messages');
const question = document.querySelector('#question');
const emotional_support_model = {
  intents: { emergency: ['danger', 'unsafe', 'threat', 'hurt', 'assault', 'rape', 'kill', 'suicid', 'emergency', 'help me now'], emotional_support: ['scared', 'afraid', 'anxious', 'sad', 'alone', 'ashamed', 'overwhelmed', 'stressed', 'feel', 'support'], resources: ['resource', 'shelter', 'clinic', 'ngo', 'police', 'contact', 'hotline', 'where can'], report_lookup: ['report', 'study', 'percentage', 'prevalence', 'factor', 'recommend', 'method', 'law', 'violence'] },
  emotions: { fear: ['scared', 'afraid', 'unsafe', 'threat', 'danger'], distress: ['sad', 'alone', 'ashamed', 'overwhelmed', 'hurt', 'cry'], anxiety: ['anxious', 'worried', 'stress', 'panic'] }
};

function predictSupportSignals(input) {
  const normalized = clean(input);
  const score = entries => entries.reduce((total, word) => total + (normalized.includes(word) ? 1 : 0), 0);
  const intent = Object.entries(emotional_support_model.intents).map(([name, words]) => [name, score(words)]).sort((a, b) => b[1] - a[1])[0];
  const emotion = Object.entries(emotional_support_model.emotions).map(([name, words]) => [name, score(words)]).sort((a, b) => b[1] - a[1])[0];
  return { intent: intent[1] ? intent[0] : 'unknown', emotion: emotion[1] ? emotion[0] : 'neutral', confidence: intent[1] ? Math.min(.98, .58 + intent[1] * .1) : .32 };
}

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && text[index + 1] === '"' && quoted) { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) { if (character === '\r' && text[index + 1] === '\n') index += 1; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  const headers = rows.shift();
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

function parseDelimited(text, delimiter = ';') {
  const rows = text.trim().split(/\r?\n/).map(line => line.split(delimiter));
  const headers = rows.shift();
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header.trim(), (values[index] || '').trim()])));
}

function clean(value) { return value.replaceAll('_', ' ').toLowerCase(); }
function formatIndicator(value) { return value.replaceAll('_', ' ').toLowerCase().replace(/(^| )\S/g, letter => letter.toUpperCase()); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]); }

function answerFor(input) {
  const normalized = clean(input);
  const signals = predictSupportSignals(input);
  const urgent = signals.intent === 'emergency';
  const words = normalized.split(/[^a-z0-9]+/).filter(word => word.length > 2 && !['what','does','about','tell','the','are','and','this','study'].includes(word));
  const scored = state.records.map(record => {
    const haystack = clean(Object.values(record).join(' '));
    const score = words.reduce((total, word) => total + (haystack.includes(word) ? (haystack.includes(` ${word} `) ? 3 : 1) : 0), 0);
    return { record, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  const matches = scored.slice(0, 4).map(item => item.record);
  if (urgent) return { text: 'Your safety matters more than finding an answer in the report. If you are in immediate danger, move to a safer place if you can and contact the police on 10111 or 112 from a mobile. The GBV Command Centre is available on 0800 428 428, or SMS *120*7867#.', matches: [], intent: 'Immediate support', tone: `${signals.emotion} · safety-first`, confidence: signals.confidence };
  if (signals.intent === 'emotional_support') return { text: `I hear that you may be feeling ${signals.emotion}. You do not have to handle this alone. If you are able, consider moving to a trusted person or safer place. I can also share the report's findings or help you find support contacts.`, matches: [], intent: 'Emotional support', tone: `${signals.emotion} detected`, confidence: signals.confidence };
  if (signals.intent === 'resources') return { text: 'For immediate support in South Africa, contact the GBV Command Centre on 0800 428 428 or SMS *120*7867#. For police or emergency assistance, call 10111 or 112. If you tell me what kind of support you need, I can guide the next step.', matches: [], intent: 'Resource referral', tone: 'Supportive', confidence: signals.confidence };
  if (!matches.length) return { text: 'I could not find a grounded answer for that in this report. Try asking about prevalence, intimate partner violence, risk factors, help-seeking, laws, recommendations, or the study methodology.', matches: [], intent: 'Unknown', tone: 'Neutral', confidence: signals.confidence };
  const lead = matches[0];
  const value = lead.value && lead.value_type === 'percentage' ? `${lead.value}%` : lead.value;
  const note = lead.notes ? ` (${lead.notes})` : '';
  let text = `The report places this under ${formatIndicator(lead.section)}. ${formatIndicator(lead.indicator)} is recorded as ${value || 'a qualitative finding'}${note}.`;
  if (matches.length > 1) text += ` I found ${matches.length} related findings in the same evidence set.`;
  return { text, matches, intent: normalized.includes('recommend') ? 'Recommendations' : normalized.includes('method') ? 'Methodology' : normalized.includes('help') ? 'Help-seeking' : 'Report lookup', tone: 'Informational', confidence: signals.confidence };
}

function addMessage(text, type, result) {
  const article = document.createElement('article'); article.className = `message ${type}-message`;
  const sourceHTML = result?.matches?.length ? `<div class="sources"><strong>Report evidence</strong>${result.matches.map(item => `<div class="source-result"><b>${formatIndicator(item.indicator)}</b> · ${item.value || 'qualitative'}${item.value_type === 'percentage' ? '%' : ''}${item.notes ? ` · ${item.notes}` : ''}</div>`).join('')}</div>` : '';
  const signalHTML = result?.intent ? `<div class="signal-row"><span>Intent: <b>${result.intent}</b></span><span>Tone: <b>${result.tone}</b></span>${result.confidence ? `<span>Confidence: <b>${Math.round(result.confidence * 100)}%</b></span>` : ''}</div>` : '';
  article.innerHTML = `<div class="avatar">${type === 'user' ? 'Y' : 'U'}</div><div class="message-body"><span class="message-label">${type === 'user' ? 'You' : 'Ubuntu assistant'} <time>just now</time></span><p>${text}</p>${signalHTML}${sourceHTML}</div>`;
  messages.append(article); messages.scrollTop = messages.scrollHeight;
}

async function loadReport() {
  try { const [reportResponse, stationResponse] = await Promise.all([fetch(REPORT_URL), fetch(STATION_URL)]); if (!reportResponse.ok || !stationResponse.ok) throw new Error('Data unavailable'); state.records = parseCSV(await reportResponse.text()); state.stations = parseDelimited(await stationResponse.text()); state.ready = true; renderStations(); } catch (error) { state.records = []; state.stations = []; }
  document.querySelector('#record-count').textContent = state.ready ? 'Report online' : 'Report unavailable';
  document.querySelector('#model-status').textContent = 'NLP baseline online';
  document.querySelector('#row-count').textContent = state.records.length || '—';
  document.querySelector('#section-count').textContent = new Set(state.records.map(item => item.section)).size || '—';
}

function renderStations() {
  const filter = document.querySelector('#province-filter');
  const yearFilter = document.querySelector('#year-filter');
  if (!state.map) {
    state.map = L.map('station-map', { zoomControl: false, scrollWheelZoom: false }).setView([-29.2, 24.7], 4.7);
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
  }
  const provinces = [...new Set(state.stations.map(station => station.Province).filter(Boolean))].sort();
  filter.innerHTML = '<option value="all">All provinces</option>' + provinces.map(province => `<option value="${province}">${province}</option>`).join('');
  const draw = () => {
    const selected = filter.value;
    const year = yearFilter.value;
    const stations = state.stations.filter(station => station.Station && station.Latitude && station.Longitude && (selected === 'all' || station.Province === selected)).sort((a, b) => Number(b[year] || 0) - Number(a[year] || 0));
    state.visibleStations = stations;
    state.markers.forEach(marker => marker.remove()); state.markers = [];
    stations.forEach(station => {
      const riskColor = station.Risk === 'High' ? '#b34d8e' : '#d7a7f3';
      const marker = L.circleMarker([Number(station.Latitude.replace('=', '')), Number(station.Longitude.replace('=', ''))], { radius: 8, color: '#fff', weight: 2, fillColor: riskColor, fillOpacity: .92 }).addTo(state.map);
      marker.bindPopup(`<strong>${escapeHTML(station.Station)}</strong><br>${escapeHTML(station.Province)} · ${escapeHTML(station.Risk)}<br><b>${Number(station[year] || 0).toLocaleString()}</b> cases ${year === 'TOTAL' ? 'total' : `in ${year}`}`); state.markers.push(marker);
    });
    document.querySelector('#station-list').innerHTML = stations.slice(0, 5).map(station => `<div class="station-row"><span class="legend-dot ${station.Risk === 'High' ? 'high' : 'medium'}"></span><span class="station-name">${escapeHTML(station.Station)}<small>${escapeHTML(station.Province)}</small></span><b>${Number(station[year] || 0).toLocaleString()}</b></div>`).join('') || '<span class="loading-copy">No station records for this province.</span>';
    document.querySelector('#visible-count').textContent = stations.length;
    document.querySelector('#visible-cases').textContent = stations.reduce((total, station) => total + Number(station[year] || 0), 0).toLocaleString();
    if (stations.length) state.map.fitBounds(L.latLngBounds(state.markers.map(marker => marker.getLatLng())), { padding: [22, 22], maxZoom: 8 });
  };
  filter.addEventListener('change', draw); yearFilter.addEventListener('change', draw); document.querySelector('#map-reset').addEventListener('click', draw); draw(); window.setTimeout(() => state.map.invalidateSize(), 0);
}

function submit(text) { if (!text.trim()) return; addMessage(text.trim(), 'user'); const result = state.ready ? answerFor(text) : { text: 'The report is still loading. Please try that question again in a moment.', matches: [] }; window.setTimeout(() => addMessage(result.text, 'assistant', result), 250); question.value = ''; question.style.height = 'auto'; }
document.querySelector('#chat-form').addEventListener('submit', event => { event.preventDefault(); submit(question.value); });
question.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(question.value); } });
question.addEventListener('input', () => { question.style.height = 'auto'; question.style.height = `${Math.min(question.scrollHeight, 100)}px`; });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => submit(button.dataset.prompt)));
document.querySelector('#clear-chat').addEventListener('click', () => { messages.innerHTML = ''; addMessage('Conversation cleared. What would you like to explore?', 'assistant'); });
loadReport();