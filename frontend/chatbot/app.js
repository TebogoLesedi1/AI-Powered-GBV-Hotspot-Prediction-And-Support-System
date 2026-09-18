const REPORT_URL = '../data/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt';
const STATION_URL = '../data/GBV Dataset.csv';
const CONVERSATION_DATA_URL = '../../text_data.txt';
const state = { records: [], stations: [], conversationExamples: [], ready: false, map: null, markers: [], visibleStations: [], conversation: [] };
const messages = document.querySelector('#messages');
const question = document.querySelector('#question');
const sendButton = document.querySelector('.send-button');
const chatStatus = document.querySelector('#chat-status');
const suggestionPopover = document.querySelector('#suggestion-popover');
const languageSelect = document.querySelector('#language-select');
const latestAnswer = { text: '' };
const speechDialog = document.querySelector('#speech-dialog');
const speechText = document.querySelector('#speech-text');
const translationStatus = document.querySelector('#translation-status');
const languageCodes = { 'en-ZA': 'en', 'af-ZA': 'af', 'zu-ZA': 'zu', 'xh-ZA': 'xh', 'st-ZA': 'st', 'tn-ZA': 'tn', 'nso-ZA': 'nso', 'ss-ZA': 'ss', 've-ZA': 've', 'ts-ZA': 'ts', 'nr-ZA': 'nr' };
const safetyPhrases = { 'af-ZA': 'As jy in onmiddellike gevaar is, skakel die polisie by 10111 of 112.', 'zu-ZA': 'Uma usengozini esheshayo, shayela amaphoyisa ku-10111 noma ku-112.', 'xh-ZA': 'Ukuba usengozini ngoku, tsalela amapolisa ku-10111 okanye ku-112.', 'st-ZA': 'Ha o le kotsing hona jwale, letsetsa mapolesa ho 10111 kapa 112.', 'tn-ZA': 'Fa o le mo kotsing jaanong, leletsa mapodise mo 10111 kgotsa 112.', 'nso-ZA': 'Ge o le kotsing gona bjale, letsetsa maphodisa go 10111 goba 112.', 'ss-ZA': 'Nangabe usengotini nyalo, shayela emaphoyisa ku-10111 nobe ku-112.', 've-ZA': 'Arali ni khomboni zwino, founelani mapholisa kha 10111 kana 112.', 'ts-ZA': 'Loko u ri ekhombyeni sweswi, bela maphorisa eka 10111 kumbe 112.', 'nr-ZA': 'Nangabe usengozini khonokho, fonela amapholisa ku-10111 namkha ku-112.' };
const correctionWords = ['help', 'hello', 'report', 'police', 'support', 'danger', 'safe', 'shelter', 'study', 'violence', 'emergency', 'afraid', 'scared'];
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
function distance(a, b) { const matrix = Array.from({ length: b.length + 1 }, (_, row) => [row]); for (let column = 1; column <= a.length; column += 1) matrix[0][column] = column; for (let row = 1; row <= b.length; row += 1) for (let column = 1; column <= a.length; column += 1) matrix[row][column] = b[row - 1] === a[column - 1] ? matrix[row - 1][column - 1] : Math.min(matrix[row - 1][column] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column - 1] + 1); return matrix[b.length][a.length]; }
function suggestCorrection(input) { const words = input.split(/(\s+)/); const corrections = []; const corrected = words.map(part => { const word = part.toLowerCase().replace(/[^a-z]/g, ''); if (word.length < 3) return part; const match = correctionWords.map(candidate => ({ candidate, score: distance(word, candidate) })).sort((a, b) => a.score - b.score)[0]; if (match && match.score <= Math.max(1, Math.floor(word.length / 3)) && match.candidate !== word) { corrections.push([word, match.candidate]); return part.replace(new RegExp(word, 'i'), match.candidate); } return part; }).join(''); return { corrected, corrections }; }
function formatIndicator(value) { return value.replaceAll('_', ' ').toLowerCase().replace(/(^| )\S/g, letter => letter.toUpperCase()); }
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]); }

function isGreeting(input) { return /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(input.trim()); }
function isThanks(input) { return /^(thanks|thank you|thx|that helps|great)\b/i.test(input.trim()); }
function isFollowUp(input) { return /\b(tell me more|more about that|what about|why is that|can you explain|and the|how does that relate|what does that mean|why does that matter|how does it relate)\b/i.test(input); }
function isGeneralConversation(input) {
  return /\b(who are you|what can you do|how can you help|can you help me|i need help|what should i do|help me|what do you know|can we talk)\b/i.test(input) || /^(hi|hello|hey|good morning|good afternoon|good evening|hey there|hi there)$/i.test(input.trim());
}

function conversationExampleFor(input) {
  const words = clean(input).split(/[^a-z0-9]+/).filter(word => word.length > 2);
  return state.conversationExamples.map(example => {
    const prompt = clean(example.user_prompt || '');
    const promptWords = prompt.split(/[^a-z0-9]+/).filter(word => word.length > 2);
    const overlap = words.filter(word => promptWords.includes(word)).length;
    const phraseMatch = prompt && clean(input).includes(prompt) ? 5 : 0;
    return { example, score: overlap + phraseMatch };
  }).sort((a, b) => b.score - a.score)[0];
}

function answerFor(input) {
  const previous = state.conversation.at(-1);
  const followUp = isFollowUp(input) && previous?.input;
  const normalized = clean(followUp ? `${previous.input} ${input}` : input);
  const signals = predictSupportSignals(input);
  const urgent = signals.intent === 'emergency';
    if (urgent) return { text: 'Your safety matters more than finding an answer in the report. If you are in immediate danger, move to a safer place if you can and contact the police on 10111 or 112 from a mobile. The GBV Command Centre is available on 0800 428 428, or SMS *120*7867#.', matches: [], intent: 'Immediate support', tone: `${signals.emotion} · safety-first`, confidence: signals.confidence };
    const exampleMatch = conversationExampleFor(input);
    if (exampleMatch?.score >= 2) {
      const example = exampleMatch.example;
      const followUp = example.follow_up_prompt ? ` ${example.follow_up_prompt}` : '';
      return { text: `${example.bot_response}${followUp}`, matches: [], intent: formatIndicator(example.intent_category), tone: 'Conversational', confidence: Math.min(.96, .7 + exampleMatch.score * .06), followUp: example.follow_up_prompt, action: example.action_flag };
    }
  if (isGreeting(input)) return { text: 'Hello. I am here with you. I can explain the study, talk through a pattern in plain language, or help you find support. What would you like to start with?', matches: [], intent: 'Conversation', tone: 'Welcoming', confidence: .98 };
  if (isGeneralConversation(input)) return { text: 'I can help in a few ways: explain the GBV study in plain language, look at hotspot patterns, or guide you to safe support resources. What would be most useful to you right now?', matches: [], intent: 'Conversation', tone: 'Supportive', confidence: .97 };
  if (isThanks(input)) return { text: 'You are welcome. I can simplify that finding, explain the wider context, or help you find support. What would help most next?', matches: [], intent: 'Conversation', tone: 'Supportive', confidence: .96 };
  if (followUp && previous?.result?.text) {
    const previousSummary = previous.result.text.replace(/\s+Would you like.*$/i, '').replace(/\s+I found .*? evidence set\.?$/i, '');
    return { text: `I can go a bit deeper on that. ${previousSummary} In plain language, the main point is that the evidence points to a pattern that matters for prevention and support. Would you like me to explain the finding more simply or connect it to available resources?`, matches: previous.result.matches || [], intent: 'Follow-up', tone: 'Conversational', confidence: .91 };
  }
  const words = normalized.split(/[^a-z0-9]+/).filter(word => word.length > 2 && !['what','does','about','tell','the','are','and','this','study'].includes(word));
  const scored = state.records.map(record => {
    const haystack = clean(Object.values(record).join(' '));
    const score = words.reduce((total, word) => total + (haystack.includes(word) ? (haystack.includes(` ${word} `) ? 3 : 1) : 0), 0);
    return { record, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
  const matches = scored.slice(0, 4).map(item => item.record);
  if (signals.intent === 'emotional_support') return { text: `I hear that you may be feeling ${signals.emotion}. You do not have to handle this alone. If you are able, consider moving to a trusted person or safer place. I can also share the report's findings or help you find support contacts.`, matches: [], intent: 'Emotional support', tone: `${signals.emotion} detected`, confidence: signals.confidence };
  if (signals.intent === 'resources') return { text: 'For immediate support in South Africa, contact the GBV Command Centre on 0800 428 428 or SMS *120*7867#. For police or emergency assistance, call 10111 or 112. If you tell me what kind of support you need, I can guide the next step.', matches: [], intent: 'Resource referral', tone: 'Supportive', confidence: signals.confidence };
  if (!matches.length) return { text: followUp ? 'I want to make sure I follow you. Which part would you like me to expand: the study finding, its context, or available support?' : 'I could not find a grounded answer for that in this report, but I can still help with the broader context. You could ask about prevalence, risk factors, help-seeking, laws, recommendations, or the study methodology.', matches: [], intent: 'Clarification', tone: 'Open question', confidence: signals.confidence };
  const lead = matches[0];
  const value = lead.value && lead.value_type === 'percentage' ? `${lead.value}%` : lead.value;
  const note = lead.notes ? ` (${lead.notes})` : '';
  let text = `${followUp ? 'Building on that, ' : 'That is a useful question. '}The report places this under ${formatIndicator(lead.section)}. ${formatIndicator(lead.indicator)} is recorded as ${value || 'a qualitative finding'}${note}.`;
  if (matches.length > 1) text += ` I found ${matches.length} related findings in the same evidence set.`;
  text += ' Would you like the wider context, the methodology, or support options connected to this topic?';
  return { text, matches, intent: normalized.includes('recommend') ? 'Recommendations' : normalized.includes('method') ? 'Methodology' : normalized.includes('help') ? 'Help-seeking' : 'Report lookup', tone: 'Informational', confidence: signals.confidence };
}

function addMessage(text, type, result) {
  const article = document.createElement('article'); article.className = `message ${type}-message`;
  const sourceHTML = result?.matches?.length ? `<div class="sources"><strong>Report evidence</strong>${result.matches.map(item => `<div class="source-result"><b>${formatIndicator(item.indicator)}</b> · ${item.value || 'qualitative'}${item.value_type === 'percentage' ? '%' : ''}${item.notes ? ` · ${item.notes}` : ''}</div>`).join('')}</div>` : '';
  const signalHTML = result?.intent ? `<div class="signal-row"><span>Intent: <b>${result.intent}</b></span><span>Tone: <b>${result.tone}</b></span>${result.confidence ? `<span>Confidence: <b>${Math.round(result.confidence * 100)}%</b></span>` : ''}</div>` : '';
  article.innerHTML = `<div class="avatar">${type === 'user' ? 'Y' : 'S'}</div><div class="message-body"><span class="message-label">${type === 'user' ? 'You' : 'S.H.E Assistant'} <time>just now</time></span><p>${text}</p>${signalHTML}${sourceHTML}</div>`;
  messages.append(article); messages.scrollTop = messages.scrollHeight; if (type === 'assistant') latestAnswer.text = text;
}

async function loadReport() {
  try { const [reportResponse, stationResponse, conversationResponse] = await Promise.all([fetch(REPORT_URL), fetch(STATION_URL), fetch(CONVERSATION_DATA_URL)]); if (!reportResponse.ok || !stationResponse.ok || !conversationResponse.ok) throw new Error('Data unavailable'); state.records = parseCSV(await reportResponse.text()); state.stations = parseDelimited(await stationResponse.text()); state.conversationExamples = parseCSV(await conversationResponse.text()); state.ready = true; question.disabled = false; sendButton.disabled = false; messages.setAttribute('aria-busy', 'false'); try { renderStations(); } catch (error) { document.querySelector('#station-list').innerHTML = '<span class="loading-copy">Map data is unavailable, but the assistant is ready.</span>'; } chatStatus.textContent = 'Assistant ready.'; chatStatus.className = 'app-status is-ready'; } catch (error) { state.records = []; state.stations = []; state.conversationExamples = []; chatStatus.textContent = 'The assistant is offline. Check your connection and reload to try again.'; chatStatus.className = 'app-status is-error'; messages.setAttribute('aria-busy', 'false'); }
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

function submit(text) { if (!text.trim() || !state.ready) return; const original = text.trim(); const suggestion = suggestCorrection(original); const cleanText = suggestion.corrected.trim(); if (suggestion.corrections.length) { suggestionPopover.textContent = `I understood “${cleanText}” from “${original}”.`; suggestionPopover.hidden = false; window.setTimeout(() => { suggestionPopover.hidden = true; }, 5000); } addMessage(cleanText, 'user'); const result = answerFor(cleanText); state.conversation.push({ input: cleanText, result }); state.conversation = state.conversation.slice(-8); window.setTimeout(() => addMessage(result.text, 'assistant', result), 250); question.value = ''; question.style.height = 'auto'; }
document.querySelector('#chat-form').addEventListener('submit', event => { event.preventDefault(); submit(question.value); });
question.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(question.value); } });
question.addEventListener('input', () => { question.style.height = 'auto'; question.style.height = `${Math.min(question.scrollHeight, 100)}px`; });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => submit(button.dataset.prompt)));
document.querySelector('#clear-chat').addEventListener('click', () => { state.conversation = []; messages.innerHTML = ''; addMessage('Conversation cleared. What would you like to explore?', 'assistant'); });
document.querySelector('#emergency-alert').addEventListener('click', () => document.querySelector('#emergency-dialog').showModal());
async function translateAnswer(text) { const target = languageCodes[languageSelect.value]; if (!text || target === 'en') return text; const fallback = safetyPhrases[languageSelect.value] && /immediate danger|emergency|police|10111|112/i.test(text) ? `${safetyPhrases[languageSelect.value]} ${text}` : text; try { const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 480))}&langpair=en|${target}`); const data = await response.json(); return data.responseData?.translatedText || fallback; } catch (error) { return fallback; } }
async function prepareSpeech() { if (!latestAnswer.text) return; speechDialog.showModal(); speechText.textContent = latestAnswer.text; translationStatus.textContent = languageSelect.value === 'en-ZA' ? 'English response' : 'Translating with MyMemory free translation…'; const translated = await translateAnswer(latestAnswer.text); speechText.textContent = translated; translationStatus.textContent = languageSelect.value === 'en-ZA' ? 'English response' : `${languageSelect.options[languageSelect.selectedIndex].text} response`; }
function speakAnswer() { if (!('speechSynthesis' in window) || !speechText.textContent) return; window.speechSynthesis.cancel(); const speech = new SpeechSynthesisUtterance(speechText.textContent); speech.lang = languageSelect.value; window.speechSynthesis.speak(speech); }
document.querySelector('#read-aloud').addEventListener('click', prepareSpeech);
document.querySelector('#speech-play').addEventListener('click', () => { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); else speakAnswer(); });
document.querySelector('#speech-pause').addEventListener('click', () => { if ('speechSynthesis' in window) window.speechSynthesis.pause(); });
document.querySelector('#speech-close').addEventListener('click', () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); });
document.querySelector('#voice-input').addEventListener('click', () => { const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition; if (!Recognition) { chatStatus.textContent = 'Voice input is not supported by this browser.'; return; } const recognition = new Recognition(); recognition.lang = languageSelect.value; recognition.onstart = () => { chatStatus.textContent = 'Listening…'; }; recognition.onresult = event => { question.value = event.results[0][0].transcript; submit(question.value); }; recognition.onerror = () => { chatStatus.textContent = 'I could not hear that. You can type instead.'; }; recognition.onend = () => { if (state.ready) chatStatus.textContent = 'Assistant ready.'; }; recognition.start(); });
languageSelect.addEventListener('change', () => { if (languageSelect.value !== 'en-ZA') { chatStatus.textContent = `${languageSelect.options[languageSelect.selectedIndex].text}: ${safetyPhrases[languageSelect.value] || 'Translation is available when you read an answer aloud.'}`; } else if (state.ready) chatStatus.textContent = 'Assistant ready.'; });
loadReport();