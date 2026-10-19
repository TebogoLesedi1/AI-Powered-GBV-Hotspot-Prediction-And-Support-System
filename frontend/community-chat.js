const aliasWords = ['QuietHarbor', 'KindSky', 'HopefulRiver', 'SoftMorning', 'BraveBloom', 'OpenWindow', 'CalmForest', 'BrightPath'];
const roomContent = {
  general: { title: 'General peer support' },
  resources: { title: 'Resources & guidance' },
  healing: { title: 'Healing & wellness' },
  questions: { title: 'Anonymous questions' }
};

const feed = document.querySelector('#message-feed');
const input = document.querySelector('#message-input');
const aliasLabel = document.querySelector('#user-alias');
const composerAlias = document.querySelector('#composer-alias');
const aliasDialog = document.querySelector('#alias-dialog');
const aliasInput = document.querySelector('#alias-input');
const announcement = document.querySelector('#live-announcement');
const crisisDialog = document.querySelector('#crisis-dialog');
const sharedMessages = Object.fromEntries(Object.keys(roomContent).map(room => [room, []]));
const blockedAliases = new Set();
let peerAuth;
let messagesCollection;
let authUid = '';
let unsubscribeMessages;
let isConnected = false;
let activeRoom = 'general';
let alias = '';
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
  marker.textContent = 'Recent messages';
  feed.append(marker);

  const messages = sharedMessages[activeRoom]
    .filter(message => !blockedAliases.has(message.sender));

  if (!messages.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-room';
    empty.textContent = 'No recent messages in this room yet.';
    feed.append(empty);
  }

  messages.forEach(message => {
    const item = document.createElement('article');
    const own = Boolean(authUid && message.uid === authUid);
    item.className = `chat-message${own ? ' own-message' : ''}`;
    item.innerHTML = `<div class="message-meta"><strong>${escapeHtml(message.sender)}</strong><time>${escapeHtml(message.time)}</time></div><p>${escapeHtml(message.text)}</p><div class="message-actions">${own ? '<button type="button" data-action="remove">Remove</button>' : `<button type="button" data-action="report" data-sender="${escapeHtml(message.sender)}">Report</button><button type="button" data-action="block" data-sender="${escapeHtml(message.sender)}">Mute alias</button>`}</div>`;
    item.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      if (!message.id || !messagesCollection) return;
      messagesCollection.doc(message.id).delete().then(() => {
        announce('Your message was removed.');
      }).catch(error => {
        console.error('Could not remove peer-support message.', error);
        announce('Could not remove your message. Please try again.');
      });
    });
    item.querySelector('[data-action="report"]')?.addEventListener('click', event => {
      announce(`Report noted for ${event.currentTarget.dataset.sender}. No moderator was notified.`);
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

document.querySelectorAll('.room-option').forEach(button => button.addEventListener('click', () => {
  activeRoom = button.dataset.room;
  renderRoom();
  subscribeToRoom();
}));

function setConnectionStatus(label, connected = false) {
  const status = document.querySelector('#connection-label');
  isConnected = connected;
  status.lastChild.textContent = ` ${label}`;
  status.classList.toggle('is-live', connected);
  status.classList.toggle('is-offline', !connected && label === 'Offline');
  const canSend = connected && Boolean(alias);
  document.querySelector('.send-button').disabled = !canSend;
  document.querySelectorAll('[data-reaction]').forEach(button => { button.disabled = !canSend; });
}

function subscribeToRoom() {
  if (!messagesCollection || !authUid) return;
  unsubscribeMessages?.();
  setConnectionStatus('Connecting');
  const cutoff = window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 60 * 1000));
  unsubscribeMessages = messagesCollection
    .where('room', '==', activeRoom)
    .where('expiresAt', '>', cutoff)
    .orderBy('expiresAt', 'desc')
    .limit(100)
    .onSnapshot(snapshot => {
      sharedMessages[activeRoom] = snapshot.docs.map(document => {
        const data = document.data();
        return {
          id: document.id,
          uid: data.uid,
          sender: data.alias,
          text: data.text,
          time: data.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sending…',
          sortTime: data.createdAt?.toMillis() || 0
        };
      }).sort((first, second) => first.sortTime - second.sortTime);
      setConnectionStatus('Live', true);
      renderRoom();
    }, error => {
      console.error('Could not load shared peer-support messages.', error);
      setConnectionStatus('Offline');
      announce('Shared messages are unavailable. Check the Firebase room setup and connection.');
    });
}

async function connectSharedRoom() {
  const config = window.FIREBASE_CONFIG;
  try {
    if (!config || !window.firebase?.auth || !window.firebase?.firestore) {
      throw new Error('Firebase services are not configured.');
    }
    let app = window.firebase.apps.find(existing => existing.name === 'peer-support');
    if (!app) app = window.firebase.initializeApp(config, 'peer-support');
    peerAuth = app.auth();
    await peerAuth.setPersistence(window.firebase.auth.Auth.Persistence.SESSION);
    const credential = peerAuth.currentUser
      ? { user: peerAuth.currentUser }
      : await peerAuth.signInAnonymously();
    authUid = credential.user.uid;
    messagesCollection = app.firestore().collection('peerSupportMessages');
    peerAuth.onAuthStateChanged(user => {
      authUid = user?.uid || '';
      if (user) subscribeToRoom();
      else setConnectionStatus('Offline');
    });
    subscribeToRoom();
  } catch (error) {
    console.error('Could not connect to peer-support rooms.', error);
    setConnectionStatus('Offline');
  }
}

function openAliasDialog() {
  aliasInput.value = alias;
  aliasDialog.showModal();
  aliasInput.focus();
}

document.querySelector('#new-alias').addEventListener('click', openAliasDialog);
document.querySelector('#generate-alias').addEventListener('click', () => {
  aliasInput.value = makeAlias();
  aliasInput.focus();
});
document.querySelector('#alias-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!aliasInput.reportValidity()) return;
  alias = aliasInput.value.trim();
  aliasLabel.textContent = alias;
  composerAlias.textContent = alias;
  input.disabled = false;
  setConnectionStatus(isConnected ? 'Live' : 'Connecting', isConnected);
  aliasDialog.close();
  input.placeholder = 'Share only what feels safe. Avoid identifying details.';
  input.focus();
  renderRoom();
});
aliasDialog.addEventListener('cancel', event => {
  if (!alias) event.preventDefault();
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
  if (!alias) {
    openAliasDialog();
    return;
  }
  const draft = input.value.trim();
  if (!draft) return;
  if (hasCrisisSignal(draft)) crisisDialog.showModal();
  const clean = sanitizeMessage(draft);
  if (!clean) return;
  if (!messagesCollection || !authUid) {
    announce('The shared room is offline, so your message was not sent.');
    return;
  }
  const sendButton = document.querySelector('.send-button');
  sendButton.disabled = true;
  messagesCollection.add({
    uid: authUid,
    alias,
    room: activeRoom,
    text: clean,
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
    expiresAt: window.firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000))
  }).then(() => {
    input.value = '';
    document.querySelector('#character-count').textContent = '0 / 600';
    if (clean !== draft) announce('Some possible contact details were hidden. Please review your message.');
  }).catch(error => {
    console.error('Could not send peer-support message.', error);
    announce('Your message was not sent. Check the Firebase room setup and connection.');
  }).finally(() => {
    sendButton.disabled = !alias || !authUid || !isConnected;
  });
});

document.querySelector('#continue-message').addEventListener('click', () => crisisDialog.close());

function exitPeerSupport() {
  blockedAliases.clear();
  input.value = '';
  alias = '';
  const homePage = new URL('index.html', window.location.href);
  window.location.replace(homePage.href);
}

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

document.querySelector('#quick-exit').addEventListener('click', exitPeerSupport);
document.querySelector('#alias-exit').addEventListener('click', exitPeerSupport);

connectSharedRoom();
aliasDialog.showModal();