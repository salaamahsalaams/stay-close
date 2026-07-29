const STORAGE_KEY = 'stayclose_state';
const FREQ_MS = {
  daily: 86400000,
  every_3_days: 259200000,
  weekly: 604800000,
  biweekly: 1209600000,
  monthly: 2592000000,
  quarterly: 7776000000
};
const FREQ_LABELS = {
  daily: 'Daily', every_3_days: 'Every 3 days', weekly: 'Weekly',
  biweekly: 'Biweekly', monthly: 'Monthly', quarterly: 'Every 3 months'
};
const FAMILY_RELS = new Set(['parent', 'sibling', 'grandparent', 'uncle_aunt', 'cousin', 'in_law']);

let state = null;
let db = null;
let currentFilter = 'all';
let weekOffset = 0;
let searchQuery = '';
let addFormState = {};
let activeContactId = null;
let activeOccasion = null;
let toastTimer = null;

function $(id) { return document.getElementById(id); }
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function defaultState() {
  return { contacts: [], userName: '', defaultLanguage: 'en', setupDone: false };
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function save() {
  saveLocal();
  pushContacts();
  pushSettings();
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      if (!state.contacts) state.contacts = [];
      if (!state.defaultLanguage) state.defaultLanguage = 'en';
    } else {
      state = defaultState();
    }
  } catch {
    state = defaultState();
  }
}

// ── Firebase ──

function initSync() {
  const cfg = window.FIREBASE_CONFIG;
  if (typeof firebase === 'undefined' || !cfg || !cfg.apiKey) {
    console.log('Firebase not configured — local-only mode');
    return;
  }
  firebase.initializeApp(cfg);
  db = firebase.database();
  db.goOnline();

  db.ref('contacts').on('value', snap => {
    const data = snap.val() || {};
    state.contacts = Object.values(data);
    saveLocal();
    if (state.setupDone) render();
  });

  db.ref('settings').on('value', snap => {
    const data = snap.val();
    if (!data) return;
    if (data.userName) state.userName = data.userName;
    if (data.defaultLanguage) state.defaultLanguage = data.defaultLanguage;
    saveLocal();
  });

  db.ref('.info/connected').on('value', snap => {
    document.body.classList.toggle('offline', !snap.val());
  });
}

function pushContacts() {
  if (!db) return;
  try {
    const obj = {};
    state.contacts.forEach(c => { obj[c.id] = c; });
    db.ref('contacts').set(obj);
  } catch (e) { console.warn('Firebase contacts push failed:', e); }
}

function pushSettings() {
  if (!db) return;
  try {
    db.ref('settings').set({
      userName: state.userName,
      defaultLanguage: state.defaultLanguage
    });
  } catch (e) { console.warn('Firebase settings push failed:', e); }
}

function pushContact(contact) {
  if (!db) return;
  try { db.ref('contacts/' + contact.id).set(contact); }
  catch (e) { console.warn('Firebase contact push failed:', e); }
}

function removeContactFromFirebase(id) {
  if (!db) return;
  try { db.ref('contacts/' + id).remove(); }
  catch (e) { console.warn('Firebase contact remove failed:', e); }
}

// ── Reminders ──

function getContactStatus(contact) {
  if (!contact.nextReminder) return 'upcoming';
  const now = Date.now();
  const diff = contact.nextReminder - now;
  if (diff < 0) return 'overdue';
  if (diff < 86400000) return 'due-today';
  return 'upcoming';
}

function calcNextReminder(contact) {
  const base = contact.lastContacted || Date.now();
  const freq = FREQ_MS[contact.reminderFrequency] || FREQ_MS.weekly;
  return base + freq;
}

function formatTimeAgo(ts) {
  if (!ts) return 'Never';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDueIn(ts) {
  if (!ts) return '';
  const diff = ts - Date.now();
  if (diff < 0) {
    const days = Math.floor(-diff / 86400000);
    if (days === 0) return 'Due today';
    if (days === 1) return '1 day overdue';
    return `${days} days overdue`;
  }
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `Due in ${days} days`;
}

// ── EmailJS ──

function sendReminderEmail() {
  const serviceId = localStorage.getItem('ejs_service');
  const templateId = localStorage.getItem('ejs_template');
  const publicKey = localStorage.getItem('ejs_key');
  const email = localStorage.getItem('user_email');
  if (!serviceId || !templateId || !publicKey || !email) return;

  const lastSent = localStorage.getItem('last_reminder_email');
  const today = new Date().toDateString();
  if (lastSent === today) return;

  const due = state.contacts.filter(c => getContactStatus(c) !== 'upcoming');
  if (!due.length) return;

  const lines = due.map(c => {
    const emoji = RELATIONSHIP_EMOJI[c.relationship] || '👤';
    const rel = RELATIONSHIP_LABELS[c.relationship] || c.relationship;
    return `${emoji} ${c.name} (${rel}) — ${formatDueIn(c.nextReminder)}`;
  }).join('\n');

  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: email,
      to_name: state.userName || 'Friend',
      subject: `Stay Close: ${due.length} ${due.length === 1 ? 'person' : 'people'} to reach out to`,
      message: `Hey ${state.userName || 'there'}!\n\nTime to reach out to:\n\n${lines}\n\nOpen the Stay Close app to get message suggestions!`
    }
  };

  fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(() => {
    localStorage.setItem('last_reminder_email', today);
    console.log('Reminder email sent');
  }).catch(e => {
    console.warn('EmailJS send failed:', e);
  });
}

// ── Render ──

function render() {
  if (!state.setupDone) {
    $('setupScreen').hidden = false;
    $('appScreen').hidden = true;
    return;
  }
  $('setupScreen').hidden = true;
  $('appScreen').hidden = false;
  renderStatusBanner();
  renderContacts();
}

function renderStatusBanner() {
  const due = state.contacts.filter(c => getContactStatus(c) !== 'upcoming');
  if (due.length === 0) {
    $('statusBanner').hidden = true;
    return;
  }
  $('statusBanner').hidden = false;
  const overdue = due.filter(c => getContactStatus(c) === 'overdue').length;
  const dueToday = due.length - overdue;
  let text = '';
  if (overdue > 0 && dueToday > 0) {
    text = `${overdue} overdue, ${dueToday} due today`;
  } else if (overdue > 0) {
    text = `${overdue} ${overdue === 1 ? 'person' : 'people'} overdue`;
  } else {
    text = `${dueToday} ${dueToday === 1 ? 'person' : 'people'} to reach out to today`;
  }
  $('statusText').textContent = text;
}

function filterContacts() {
  let list = [...state.contacts];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(c => {
      const rel = RELATIONSHIP_LABELS[c.relationship] || c.relationship || '';
      return c.name.toLowerCase().includes(q) || rel.toLowerCase().includes(q);
    });
  }
  if (currentFilter === 'family') {
    list = list.filter(c => FAMILY_RELS.has(c.relationship));
  } else if (currentFilter === 'friends') {
    list = list.filter(c => !FAMILY_RELS.has(c.relationship));
  } else if (currentFilter === 'due') {
    list = list.filter(c => getContactStatus(c) !== 'upcoming');
  }
  const statusOrder = { 'overdue': 0, 'due-today': 1, 'upcoming': 2 };
  list.sort((a, b) => {
    const sa = statusOrder[getContactStatus(a)] ?? 2;
    const sb = statusOrder[getContactStatus(b)] ?? 2;
    if (sa !== sb) return sa - sb;
    return (a.nextReminder || 0) - (b.nextReminder || 0);
  });
  return list;
}

function renderContacts() {
  const container = $('contactList');
  const weekView = $('weekView');
  const empty = $('emptyState');

  if (currentFilter === 'week') {
    container.hidden = true;
    weekView.hidden = false;
    empty.hidden = true;
    renderWeekView();
    return;
  }

  container.hidden = false;
  weekView.hidden = true;
  const list = filterContacts();

  if (list.length === 0) {
    container.innerHTML = '';
    empty.hidden = false;
    if (state.contacts.length > 0 && currentFilter !== 'all') {
      empty.querySelector('.empty-text').textContent = 'No contacts here';
      empty.querySelector('.empty-sub').textContent = 'Try a different tab';
    } else {
      empty.querySelector('.empty-text').textContent = 'No contacts yet';
      empty.querySelector('.empty-sub').textContent = 'Tap + to add someone you want to stay close to';
    }
    return;
  }

  empty.hidden = true;
  const frag = document.createDocumentFragment();

  for (const contact of list) {
    const status = getContactStatus(contact);
    const emoji = RELATIONSHIP_EMOJI[contact.relationship] || '👤';
    const relLabel = RELATIONSHIP_LABELS[contact.relationship] || contact.relationship;

    const card = el('div', `contact-card ${status}`);
    card.dataset.id = contact.id;

    card.innerHTML = `
      <div class="card-emoji">${emoji}</div>
      <div class="card-body">
        <div class="card-name">${esc(contact.name)}</div>
        <div class="card-meta">
          <span class="card-status ${status}"></span>
          <span>${formatDueIn(contact.nextReminder)}</span>
          <span class="card-lang">${contact.language === 'fr' ? 'FR' : 'EN'}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="card-btn card-btn-edit" title="Edit" data-action="edit">✏️</button>
        <button class="card-btn card-btn-msg" title="Generate message" data-action="msg">💬</button>
        <button class="card-btn card-btn-check" title="Mark as contacted" data-action="check">✓</button>
      </div>
    `;

    frag.appendChild(card);
  }

  container.innerHTML = '';
  container.appendChild(frag);
}

// ── Week View ──

function getWeekDays(offset) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function getContactsForDay(date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayEnd.getTime();

  return state.contacts.filter(c => {
    if (!c.nextReminder) return false;
    if (c.nextReminder <= dayEndMs && c.nextReminder >= dayStartMs) return true;
    if (c.nextReminder < dayStartMs) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dayStartMs === today.getTime()) return true;
    }
    return false;
  });
}

function renderWeekView() {
  const days = getWeekDays(weekOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const weekStart = days[0];
  const weekEnd = days[6];
  const monthFmt = { month: 'short', day: 'numeric' };
  const label = `${weekStart.toLocaleDateString(undefined, monthFmt)} – ${weekEnd.toLocaleDateString(undefined, monthFmt)}`;

  let html = `
    <div class="week-nav">
      <button class="week-nav-btn" id="weekPrev">‹</button>
      <div class="week-nav-label">
        ${label}
        ${weekOffset === 0 ? '<div style="font-size:11px;color:var(--txt-lt);font-weight:400">This week</div>' : ''}
      </div>
      <button class="week-nav-btn" id="weekNext">›</button>
    </div>
  `;

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = days[i];
    const dMs = new Date(d); dMs.setHours(0, 0, 0, 0);
    const isToday = dMs.getTime() === todayMs;
    const contacts = getContactsForDay(d);

    html += `<div class="week-day">
      <div class="week-day-header ${isToday ? 'is-today' : ''}">
        <span class="week-day-name">${DAY_NAMES[i]}</span>
        <span class="week-day-date">${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        ${contacts.length ? `<span style="margin-left:auto;font-size:12px;color:var(--txt-lt)">${contacts.length}</span>` : ''}
      </div>
      <div class="week-day-items">`;

    for (const c of contacts) {
      const emoji = RELATIONSHIP_EMOJI[c.relationship] || '👤';
      const relLabel = RELATIONSHIP_LABELS[c.relationship] || c.relationship;
      const status = getContactStatus(c);
      const statusLabel = status === 'overdue' ? 'Overdue' : status === 'due-today' ? 'Today' : 'Upcoming';
      html += `
        <div class="week-item" data-id="${c.id}">
          <div class="week-item-emoji">${emoji}</div>
          <div class="week-item-info">
            <div class="week-item-name">${esc(c.name)}</div>
            <div class="week-item-rel">${relLabel}</div>
          </div>
          <span class="week-item-status ${status}">${statusLabel}</span>
        </div>`;
    }

    html += `</div></div>`;
  }

  $('weekView').innerHTML = html;

  $('weekPrev').addEventListener('click', () => { weekOffset--; renderWeekView(); });
  $('weekNext').addEventListener('click', () => { weekOffset++; renderWeekView(); });
  $('weekView').querySelectorAll('.week-item').forEach(item => {
    item.addEventListener('click', () => showDetail(item.dataset.id));
  });
}

// ── Contact Detail ──

function showDetail(id) {
  const contact = state.contacts.find(c => c.id === id);
  if (!contact) return;
  activeContactId = id;

  const emoji = RELATIONSHIP_EMOJI[contact.relationship] || '👤';
  const relLabel = RELATIONSHIP_LABELS[contact.relationship] || contact.relationship;
  const status = getContactStatus(contact);
  const freq = FREQ_LABELS[contact.reminderFrequency] || contact.reminderFrequency;

  let html = `
    <div class="detail-header">
      <div class="detail-emoji">${emoji}</div>
      <div class="detail-info">
        <div class="detail-name">${esc(contact.name)}</div>
        <div class="detail-rel">${relLabel} · ${contact.language === 'fr' ? 'French' : 'English'} · ${freq}</div>
      </div>
    </div>
  `;

  if (contact.profile?.topics?.length) {
    html += `<div class="detail-sec">
      <div class="detail-sec-title">Topics</div>
      <div class="detail-tags">${contact.profile.topics.map(t => `<span class="detail-tag">${esc(t)}</span>`).join('')}</div>
    </div>`;
  }

  const notes = contact.profile?.notes || contact.profile?.culturalNotes || '';
  if (notes) {
    html += `<div class="detail-sec">
      <div class="detail-sec-title">Notes</div>
      <div class="detail-note">${esc(notes)}</div>
    </div>`;
  }

  if (contact.profile?.specialDates?.length) {
    html += `<div class="detail-sec">
      <div class="detail-sec-title">Special Dates</div>
      <div class="detail-tags">${contact.profile.specialDates.map(d => `<span class="detail-tag">🎂 ${d.date}</span>`).join('')}</div>
    </div>`;
  }

  html += `<div class="detail-sec">
    <div class="detail-sec-title">Status</div>
    <div class="detail-note">
      <span class="card-status ${status}" style="display:inline-block;vertical-align:middle;margin-right:6px"></span>
      ${formatDueIn(contact.nextReminder)}<br>
      Last contacted: ${formatTimeAgo(contact.lastContacted)}
      ${contact.reminderStartDate ? '<br>Start date: ' + new Date(contact.reminderStartDate).toLocaleDateString() : ''}
    </div>
  </div>`;

  if (contact.messageHistory?.length) {
    html += `<div class="detail-sec">
      <div class="detail-sec-title">Recent Messages</div>
      <ul class="detail-history">
        ${contact.messageHistory.slice(-5).reverse().map(m => `<li>${esc(m.text).substring(0, 80)}${m.text.length > 80 ? '...' : ''}<span class="detail-history-date">${new Date(m.date).toLocaleDateString()} · ${OCCASION_LABELS[m.occasion] || m.occasion}</span></li>`).join('')}
      </ul>
    </div>`;
  }

  html += `<div class="detail-actions">
    <button class="btn-primary" onclick="openMsgModal('${contact.id}')">Generate Message</button>
    <button class="btn-secondary" onclick="markContacted('${contact.id}')">Mark as Contacted</button>
    <button class="btn-secondary" onclick="openEditModal('${contact.id}')">Edit Contact</button>
    <button class="btn-danger" onclick="confirmDelete('${contact.id}')">Delete Contact</button>
  </div>`;

  $('detailContent').innerHTML = html;
  $('detailModal').classList.add('open');
}

// ── Edit Contact ──

function openEditModal(id) {
  const contact = state.contacts.find(c => c.id === id);
  if (!contact) return;
  $('detailModal').classList.remove('open');

  let html = `
    <div class="form-group">
      <label class="form-label">Name</label>
      <input id="editName" type="text" class="form-input" value="${esc(contact.name)}">
    </div>
    <div class="form-group">
      <label class="form-label">Language</label>
      <div class="toggle-row">
        <button class="toggle-btn edit-lang ${contact.language === 'en' ? 'active' : ''}" data-lang="en">English</button>
        <button class="toggle-btn edit-lang ${contact.language === 'fr' ? 'active' : ''}" data-lang="fr">Français</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Reminder Frequency</label>
      <div class="pill-grid">
        ${Object.entries(FREQ_LABELS).map(([k, v]) =>
          `<button class="pill edit-freq ${contact.reminderFrequency === k ? 'active' : ''}" data-freq="${k}">${v}</button>`
        ).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Start reminders from</label>
      <input id="editStartDate" type="date" class="form-input" value="${contact.reminderStartDate ? new Date(contact.reminderStartDate).toISOString().split('T')[0] : ''}">
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea id="editNotes" class="form-textarea" rows="4">${esc(contact.profile?.notes || contact.profile?.culturalNotes || '')}</textarea>
    </div>
    <div class="detail-actions" style="margin-top:12px;margin-bottom:8px">
      <button class="btn-danger" onclick="confirmDelete('${contact.id}')">Delete Contact</button>
    </div>
    <div class="modal-acts">
      <button class="btn-primary" onclick="saveEdit('${contact.id}')">Save Changes</button>
    </div>
  `;

  $('editContent').innerHTML = html;
  $('editModal').classList.add('open');

  $('editContent').addEventListener('click', e => {
    const langBtn = e.target.closest('.edit-lang');
    if (langBtn) {
      $('editContent').querySelectorAll('.edit-lang').forEach(b => b.classList.remove('active'));
      langBtn.classList.add('active');
    }
    const freqBtn = e.target.closest('.edit-freq');
    if (freqBtn) {
      $('editContent').querySelectorAll('.edit-freq').forEach(b => b.classList.remove('active'));
      freqBtn.classList.add('active');
    }
  });
}

function saveEdit(id) {
  const contact = state.contacts.find(c => c.id === id);
  if (!contact) return;

  contact.name = $('editName').value.trim() || contact.name;
  const langBtn = $('editContent').querySelector('.edit-lang.active');
  if (langBtn) contact.language = langBtn.dataset.lang;
  const freqBtn = $('editContent').querySelector('.edit-freq.active');
  const startDateVal = $('editStartDate').value;
  if (startDateVal) {
    contact.reminderStartDate = new Date(startDateVal).getTime();
  }
  if (freqBtn) {
    contact.reminderFrequency = freqBtn.dataset.freq;
  }
  const freq = FREQ_MS[contact.reminderFrequency] || FREQ_MS.weekly;
  if (contact.lastContacted) {
    contact.nextReminder = contact.lastContacted + freq;
  } else {
    contact.nextReminder = contact.reminderStartDate || Date.now();
  }
  if (!contact.profile) contact.profile = {};
  contact.profile.notes = $('editNotes').value.trim();
  contact.profile.culturalNotes = contact.profile.notes;

  save();
  render();
  $('editModal').classList.remove('open');
  showToast('Contact updated');
}

function confirmDelete(id) {
  const contact = state.contacts.find(c => c.id === id);
  if (!contact) return;
  if (!confirm(`Delete ${contact.name}? This cannot be undone.`)) return;
  state.contacts = state.contacts.filter(c => c.id !== id);
  removeContactFromFirebase(id);
  save();
  render();
  $('detailModal').classList.remove('open');
  $('editModal').classList.remove('open');
  showToast('Contact deleted');
}

function markContacted(id) {
  const contact = state.contacts.find(c => c.id === id);
  if (!contact) return;
  contact.lastContacted = Date.now();
  contact.nextReminder = calcNextReminder(contact);
  save();
  render();
  $('detailModal').classList.remove('open');
  showToast(`Marked ${contact.name} as contacted`);
}

// ── Message Generator ──

function openMsgModal(id) {
  activeContactId = id;
  activeOccasion = null;
  const contact = state.contacts.find(c => c.id === id);
  if (!contact) return;

  $('msgTitle').textContent = `Message for ${contact.name}`;
  $('occasionPicker').hidden = false;
  $('msgResult').hidden = true;
  $('msgLoading').hidden = true;
  $('msgPointerWrap').hidden = true;
  $('msgPointers').value = '';
  $('detailModal').classList.remove('open');

  $('occasionPicker').querySelectorAll('.occasion-pill').forEach(p => p.classList.remove('active'));
  $('msgModal').classList.add('open');
}

async function generateMsg(occasion, pointers) {
  const contact = state.contacts.find(c => c.id === activeContactId);
  if (!contact) return;

  activeOccasion = occasion;
  $('occasionPicker').hidden = true;
  $('msgResult').hidden = true;
  $('msgLoading').hidden = false;

  try {
    const text = await generateMessage(contact, occasion, pointers);
    $('msgBubble').textContent = text;
    $('msgLoading').hidden = true;
    $('msgResult').hidden = false;
  } catch (e) {
    console.error('Message generation failed:', e);
    $('msgLoading').hidden = true;
    $('msgResult').hidden = false;
    $('msgBubble').textContent = getTemplateMessage(contact, occasion);
  }
}

// ── Add Contact Flow ──

function resetAddForm() {
  addFormState = {
    name: '', relationship: '', language: state.defaultLanguage || 'en',
    formality: 'semi_formal', closeness: 'close', topics: [],
    notes: '', reminderFrequency: 'weekly',
    startDate: '', birthday: ''
  };
  $('addName').value = '';
  $('addNotes').value = '';
  $('addStartDate').value = new Date().toISOString().split('T')[0];
  $('addBirthday').value = '';
  showAddStep(1);

  $('addModal').querySelectorAll('.pill').forEach(p => {
    p.classList.remove('active');
    p.classList.remove('active-multi');
  });
  $('addModal').querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  $('addModal').querySelector('.toggle-btn[data-lang="' + addFormState.language + '"]').classList.add('active');
}

function showAddStep(n) {
  for (let i = 1; i <= 5; i++) {
    $('addStep' + i).hidden = (i !== n);
  }
}

function saveContact() {
  addFormState.name = $('addName').value.trim();
  addFormState.notes = $('addNotes').value.trim();
  addFormState.startDate = $('addStartDate').value;
  addFormState.birthday = $('addBirthday').value;

  if (!addFormState.name) { showToast('Please enter a name'); return; }
  if (!addFormState.relationship) { showToast('Please select a relationship'); return; }

  const startTs = addFormState.startDate ? new Date(addFormState.startDate).getTime() : Date.now();
  const freq = FREQ_MS[addFormState.reminderFrequency] || FREQ_MS.weekly;

  const contact = {
    id: uid(),
    name: addFormState.name,
    relationship: addFormState.relationship,
    language: addFormState.language,
    reminderFrequency: addFormState.reminderFrequency,
    lastContacted: null,
    nextReminder: startTs,
    reminderStartDate: startTs,
    profile: {
      closeness: addFormState.closeness,
      formality: addFormState.formality,
      topics: addFormState.topics,
      notes: addFormState.notes,
      culturalNotes: addFormState.notes,
      specialDates: addFormState.birthday ? [{ date: addFormState.birthday, occasion: 'Birthday' }] : []
    },
    messageHistory: []
  };

  state.contacts.push(contact);
  pushContact(contact);
  save();
  render();
  $('addModal').classList.remove('open');
  showToast(`${contact.name} added!`);
}

// ── Settings ──

function openSettings() {
  $('setName').value = state.userName || '';
  $('setGeminiKey').value = localStorage.getItem('gemini_api_key') || '';
  $('setEmail').value = localStorage.getItem('user_email') || '';
  $('setEjsService').value = localStorage.getItem('ejs_service') || 'service_n7vi3cp';
  $('setEjsTemplate').value = localStorage.getItem('ejs_template') || 'template_g12p1g4';
  $('setEjsKey').value = localStorage.getItem('ejs_key') || 'SKTDXa5RC6ClKNCNA';

  $('settingsModal').querySelectorAll('.set-lang').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === state.defaultLanguage);
  });

  $('settingsModal').classList.add('open');
}

function saveSettings() {
  state.userName = $('setName').value.trim();
  const langBtn = $('settingsModal').querySelector('.set-lang.active');
  if (langBtn) state.defaultLanguage = langBtn.dataset.lang;

  const geminiKey = $('setGeminiKey').value.trim();
  if (geminiKey) localStorage.setItem('gemini_api_key', geminiKey);
  else localStorage.removeItem('gemini_api_key');

  const email = $('setEmail').value.trim();
  if (email) localStorage.setItem('user_email', email);
  else localStorage.removeItem('user_email');

  const ejsService = $('setEjsService').value.trim();
  if (ejsService) localStorage.setItem('ejs_service', ejsService);
  else localStorage.removeItem('ejs_service');

  const ejsTemplate = $('setEjsTemplate').value.trim();
  if (ejsTemplate) localStorage.setItem('ejs_template', ejsTemplate);
  else localStorage.removeItem('ejs_template');

  const ejsKey = $('setEjsKey').value.trim();
  if (ejsKey) localStorage.setItem('ejs_key', ejsKey);
  else localStorage.removeItem('ejs_key');

  save();
  $('settingsModal').classList.remove('open');
  showToast('Settings saved');
}

async function sendTestEmail() {
  const serviceId = $('setEjsService').value.trim();
  const templateId = $('setEjsTemplate').value.trim();
  const publicKey = $('setEjsKey').value.trim();
  const email = $('setEmail').value.trim();

  if (!serviceId || !templateId || !publicKey || !email) {
    showToast('Please fill in all EmailJS fields');
    return;
  }

  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: email,
          to_name: state.userName || 'Friend',
          subject: 'Stay Close — Test Email',
          message: 'This is a test email from Stay Close. If you received this, email reminders are working!'
        }
      })
    });
    if (res.ok) showToast('Test email sent!');
    else showToast('Email send failed');
  } catch {
    showToast('Email send failed');
  }
}

async function testGeminiKey() {
  const key = $('setGeminiKey').value.trim();
  if (!key) { showToast('Please enter an API key first'); return; }
  showToast('Testing...');
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say "Connected!" in one word.' }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });
    if (res.ok) showToast('Gemini API key works!');
    else {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || `Error ${res.status}`;
      showToast('API key failed: ' + msg);
    }
  } catch {
    showToast('Connection failed — check your internet');
  }
}

// ── Toast ──

function showToast(msg) {
  clearTimeout(toastTimer);
  $('toast').textContent = msg;
  $('toast').classList.add('show');
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 2500);
}

// ── Events ──

function bindEvents() {
  // Setup
  $('setupBtn').addEventListener('click', () => {
    const name = $('setupName').value.trim();
    if (!name) { showToast('Please enter your name'); return; }
    state.userName = name;
    state.setupDone = true;
    save();
    render();
  });
  $('setupName').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('setupBtn').click();
  });

  // Search
  $('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    $('searchClear').hidden = !searchQuery;
    renderContacts();
  });
  $('searchClear').addEventListener('click', () => {
    $('searchInput').value = '';
    searchQuery = '';
    $('searchClear').hidden = true;
    renderContacts();
  });

  // Tabs
  document.querySelector('.tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    if (currentFilter !== 'week') weekOffset = 0;
    renderContacts();
  });

  // Contact list
  $('contactList').addEventListener('click', e => {
    const action = e.target.closest('[data-action]');
    if (action) {
      e.stopPropagation();
      const card = action.closest('.contact-card');
      const id = card.dataset.id;
      if (action.dataset.action === 'msg') {
        openMsgModal(id);
      } else if (action.dataset.action === 'edit') {
        openEditModal(id);
      } else if (action.dataset.action === 'check') {
        markContacted(id);
      }
      return;
    }
    const card = e.target.closest('.contact-card');
    if (card) showDetail(card.dataset.id);
  });

  // Add button
  $('addBtn').addEventListener('click', () => {
    resetAddForm();
    $('addModal').classList.add('open');
  });

  // Add flow — step navigation
  $('addModal').addEventListener('click', e => {
    const next = e.target.closest('.step-next');
    if (next) {
      const step = parseInt(next.dataset.next);
      if (step === 2 && !addFormState.relationship) {
        showToast('Please select a relationship');
        return;
      }
      addFormState.name = $('addName').value.trim();
      if (step === 2 && !addFormState.name) {
        showToast('Please enter a name');
        return;
      }
      showAddStep(step);
      return;
    }
    const back = e.target.closest('.step-back');
    if (back) {
      showAddStep(parseInt(back.dataset.back));
      return;
    }
  });

  // Add flow — pill selections
  $('relPicker').addEventListener('click', e => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    $('relPicker').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    addFormState.relationship = pill.dataset.rel;
  });

  $('addModal').addEventListener('click', e => {
    const langBtn = e.target.closest('.toggle-btn[data-lang]');
    if (langBtn && langBtn.closest('#addStep2')) {
      langBtn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      langBtn.classList.add('active');
      addFormState.language = langBtn.dataset.lang;
    }

    const formPill = e.target.closest('.formality-pill');
    if (formPill) {
      $('addModal').querySelectorAll('.formality-pill').forEach(p => p.classList.remove('active'));
      formPill.classList.add('active');
      addFormState.formality = formPill.dataset.form;
    }

    const closePill = e.target.closest('.closeness-pill');
    if (closePill) {
      $('addModal').querySelectorAll('.closeness-pill').forEach(p => p.classList.remove('active'));
      closePill.classList.add('active');
      addFormState.closeness = closePill.dataset.close;
    }

    const topicPill = e.target.closest('.topic-pill');
    if (topicPill) {
      topicPill.classList.toggle('active-multi');
      const topic = topicPill.dataset.topic;
      if (addFormState.topics.includes(topic)) {
        addFormState.topics = addFormState.topics.filter(t => t !== topic);
      } else {
        addFormState.topics.push(topic);
      }
    }

    const freqPill = e.target.closest('.freq-pill');
    if (freqPill) {
      $('addModal').querySelectorAll('.freq-pill').forEach(p => p.classList.remove('active'));
      freqPill.classList.add('active');
      addFormState.reminderFrequency = freqPill.dataset.freq;
    }
  });

  // Save contact
  $('saveContactBtn').addEventListener('click', saveContact);

  // Settings
  $('settingsBtn').addEventListener('click', openSettings);
  $('saveSettingsBtn').addEventListener('click', saveSettings);
  $('testEmailBtn').addEventListener('click', sendTestEmail);
  $('testGeminiBtn').addEventListener('click', testGeminiKey);

  $('settingsModal').addEventListener('click', e => {
    const langBtn = e.target.closest('.set-lang');
    if (langBtn) {
      $('settingsModal').querySelectorAll('.set-lang').forEach(b => b.classList.remove('active'));
      langBtn.classList.add('active');
    }
  });

  // Message generator — occasion pick
  $('occasionPicker').addEventListener('click', e => {
    const pill = e.target.closest('.occasion-pill');
    if (!pill) return;
    generateMsg(pill.dataset.occ);
  });

  // Message actions
  $('msgRegen').addEventListener('click', () => {
    if (activeOccasion) {
      const pointers = $('msgPointers').value.trim();
      generateMsg(activeOccasion, pointers || undefined);
    }
  });

  $('msgPointerBtn').addEventListener('click', () => {
    const wrap = $('msgPointerWrap');
    wrap.hidden = !wrap.hidden;
    if (!wrap.hidden) $('msgPointers').focus();
  });

  $('msgCopy').addEventListener('click', () => {
    const text = $('msgBubble').textContent;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => {
      showToast('Could not copy');
    });
  });

  $('msgSend').addEventListener('click', () => {
    const contact = state.contacts.find(c => c.id === activeContactId);
    if (!contact) return;
    const text = $('msgBubble').textContent;

    if (!contact.messageHistory) contact.messageHistory = [];
    contact.messageHistory.push({
      text: text,
      date: Date.now(),
      language: contact.language,
      occasion: activeOccasion
    });
    if (contact.messageHistory.length > 20) {
      contact.messageHistory = contact.messageHistory.slice(-20);
    }

    contact.lastContacted = Date.now();
    contact.nextReminder = calcNextReminder(contact);

    save();
    render();
    $('msgModal').classList.remove('open');
    showToast(`Message saved & ${contact.name} marked as contacted`);
  });

  // Modal close — generic
  document.querySelectorAll('.modal-x[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      $(btn.dataset.close).classList.remove('open');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
}

// ── Service Worker ──

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(e => {
      console.warn('SW registration failed:', e);
    });
  }
}

// ── Init ──

function init() {
  load();
  initSync();
  bindEvents();
  render();
  registerSW();
  sendReminderEmail();
}

document.addEventListener('DOMContentLoaded', init);