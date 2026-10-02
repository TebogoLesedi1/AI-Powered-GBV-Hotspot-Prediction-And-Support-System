const aliasWords = ['QuietHarbor', 'KindSky', 'HopefulRiver', 'SoftMorning', 'BraveBloom', 'OpenWindow', 'CalmForest', 'BrightPath'];
const roomContent = {
  general: {
    title: 'General peer support',
    messages: [
      ['QuietHarbor_42', 'Some days I just need someone to listen. You do not have to have the perfect words for someone else.', '10:14'],
      ['KindSky_08', 'That makes sense. Taking things one step at a time is enough for today.', '10:18']
    ]
  },
  resources: {
    title: 'Resources & guidance',
    messages: [
      ['BrightPath_31', 'It can help to ask a trusted local organisation about current shelter and counseling availability before traveling.', '09:42'],
      ['OpenWindow_16', 'The Resources page has national support contacts. Check service hours directly when it is safe to do so.', '09:49']
    ]
  },
  healing: {
    title: 'Healing & wellness',
    messages: [
      ['SoftMorning_27', 'A small grounding step that helps me: notice three things I can see and one thing that feels steady.', '11:06'],
      ['CalmForest_53', 'Rest is not something you have to earn. Go at the pace that feels manageable for you.', '11:12']
    ]
  },
  questions: {
    title: 'Anonymous questions',
    messages: [
      ['BraveBloom_09', 'You can ask a general question without sharing a personal story or identifying details.', '08:36'],
      ['QuietHarbor_42', 'For advice about your own situation, a qualified local service may be able to talk through options privately.', '08:41']
    ]
  }
};

const feed = document.querySelector('#message-feed');
const input = document.querySelector('#message-input');
const aliasLabel = document.querySelector('#user-alias');
const composerAlias = document.querySelector('#composer-alias');
const announcement = document.querySelector('#live-announcement');
const crisisDialog = document.querySelector('#crisis-dialog');
const localMessages = Object.fromEntries(Object.keys(roomContent).map(room => [room, []]));
const blockedAliases = new Set();
let activeRoom = 'general';
let alias = makeAlias();
let announcementTimer;

function makeAlias() {
  const word = aliasWords[Math.floor(Math.random() * aliasWords.length)];
  const number = String(Math.floor(Math.random() * 90) + 10);
  return `${word}_${number}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function sanitizeMessage(value) {
  let clean = value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email hidden]')
    .replace(/(?:https?:\/\/|www\.)\S+/gi, '[link hidden]')
    .replace(/(?<!\w)@[a-z0-9_.-]{2,}/gi, '[handle hidden]')
    .replace(/\b\d{1,5}\s+(?:[a-z0-9.'-]+\s){0,4}(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|crescent|close)\b/gi, '[address hidden]')
    .replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, match => {
      const digits = match.replace(/\D/g, '');
      return digits.length >= 8 && digits.length <= 15 ? '[number hidden]' : match;
    });
  return clean.trim();
}

function hasCrisisSignal(value) {
  return /\b(?:immediate danger|in danger right now|unsafe right now|he is here now|she is here now|they are here now|being attacked|being followed|threatened me|threatened to kill me|going to hurt me|partner is outside|want to kill myself|kill myself|end my life|suicid(?:e|al)|self[- ]?harm|hurt myself|forced me)\b/i.test(value);
}

function announce(message) {
  window.clearTimeout(announcementTimer);
  announcement.textContent = message;
  announcement.classList.add('is-visible');
  announcementTimer = window.setTimeout(() => announcement.classList.remove('is-visible'), 3200);
}

function renderRoom() {
  const room = roomContent[activeRoom];
  document.querySelector('#room-title').textContent = room.title;
  document.querySelectorAll('.room-option').forEach(button => {
    const selected = button.dataset.room === activeRoom;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  feed.replaceChildren();
  const marker = document.createElement('div');
  marker.className = 'day-marker';
  marker.textContent = 'Sample conversation · local preview';
  feed.append(marker);

  const previewMessages = room.messages
    .filter(([sender]) => !blockedAliases.has(sender))
    .map(([sender, text, time]) => ({ sender, text, time, sample: true }));
  const messages = [...previewMessages, ...localMessages[activeRoom]]
    .filter(message => !blockedAliases.has(message.sender));

  if (!messages.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-room';
    empty.textContent = 'No messages in this local preview yet. You can add a message using your alias.';
    feed.append(empty);
  }

  messages.forEach(message => {
    const item = document.createElement('article');
    const own = message.sender === alias;
    item.className = `chat-message${own ? ' own-message' : ''}`;
    item.innerHTML = `<div class="message-meta"><strong>${escapeHtml(message.sender)}</strong>${message.sample ? '<span class="sample-tag">Sample</span>' : ''}<time>${escapeHtml(message.time)}</time></div><p>${escapeHtml(message.text)}</p><div class="message-actions">${own ? '<button type="button" data-action="remove">Remove</button>' : `<button type="button" data-action="report" data-sender="${escapeHtml(message.sender)}">Report</button><button type="button" data-action="block" data-sender="${escapeHtml(message.sender)}">Mute alias</button>`}</div>`;
    item.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      localMessages[activeRoom] = localMessages[activeRoom].filter(entry => entry !== message);
      renderRoom();
      announce('Your local message was removed.');
    });
    item.querySelector('[data-action="report"]')?.addEventListener('click', event => {
      announce(`Report noted for ${event.currentTarget.dataset.sender}. In this preview, it is not sent to a moderator.`);
    });
    item.querySelector('[data-action="block"]')?.addEventListener('click', event => {
      const sender = event.currentTarget.dataset.sender;
      blockedAliases.add(sender);
      renderRoom();
      announce(`${sender} is muted in this tab. This action is local only.`);
    });
    feed.append(item);
  });
  feed.scrollTop = feed.scrollHeight;
}

function resetAlias() {
  alias = makeAlias();
  aliasLabel.textContent = alias;
  composerAlias.textContent = alias;
  localMessages[activeRoom] = localMessages[activeRoom].filter(message => message.sender !== alias);
  renderRoom();
}

document.querySelectorAll('.room-option').forEach(button => button.addEventListener('click', () => {
  activeRoom = button.dataset.room;
  renderRoom();
}));

document.querySelector('#new-alias').addEventListener('click', () => {
  const previousAlias = alias;
  alias = makeAlias();
  while (alias === previousAlias) alias = makeAlias();
  aliasLabel.textContent = alias;
  composerAlias.textContent = alias;
  renderRoom();
  announce(`Your new temporary alias is ${alias}.`);
});

document.querySelectorAll('[data-reaction]').forEach(button => button.addEventListener('click', () => {
  input.value = `${input.value}${input.value ? ' ' : ''}${button.dataset.reaction}`;
  input.focus();
  document.querySelector('#character-count').textContent = `${input.value.length} / 600`;
}));

input.addEventListener('input', () => {
  document.querySelector('#character-count').textContent = `${input.value.length} / 600`;
});

document.querySelector('#message-form').addEventListener('submit', event => {
  event.preventDefault();
  const draft = input.value.trim();
  if (!draft) return;
  if (hasCrisisSignal(draft)) crisisDialog.showModal();
  const clean = sanitizeMessage(draft);
  if (!clean) return;
  localMessages[activeRoom].push({ sender: alias, text: clean, time: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date()) });
  input.value = '';
  document.querySelector('#character-count').textContent = '0 / 600';
  renderRoom();
  if (clean !== draft) announce('Some possible contact details were hidden. Please review your message.');
});

document.querySelector('#continue-message').addEventListener('click', () => crisisDialog.close());

const supportDrawer = document.querySelector('#support-drawer');
const drawerBackdrop = document.querySelector('#drawer-backdrop');
const supportToggle = document.querySelector('#support-toggle');
function closeDrawer() {
  supportDrawer.hidden = true;
  drawerBackdrop.hidden = true;
  supportToggle.setAttribute('aria-expanded', 'false');
}
supportToggle.addEventListener('click', () => {
  const open = supportDrawer.hidden;
  supportDrawer.hidden = !open;
  drawerBackdrop.hidden = !open;
  supportToggle.setAttribute('aria-expanded', String(open));
});
document.querySelector('#support-close').addEventListener('click', closeDrawer);
drawerBackdrop.addEventListener('click', closeDrawer);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDrawer(); });

document.querySelector('#quick-exit').addEventListener('click', () => {
  Object.values(localMessages).forEach(messages => messages.splice(0));
  blockedAliases.clear();
  input.value = '';
  location.replace('index.html');
});

resetAlias();