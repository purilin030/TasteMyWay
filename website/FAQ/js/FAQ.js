/* ===========================================================
   FAQ tabs, search, accordion, and image roller + state polls
   Folder layout (from your screenshot):
   - FAQ/html/FAQ.html
   - FAQ/js/FAQ.js   ← this file
   - FAQ/FoodDetail/json/food.json
   - FAQ/FoodDetail/foodImage/<images>
   =========================================================== */

/* ---------- Tabs + Search + Accordion ---------- */
const tabButtons = document.querySelectorAll('.tab-button');
const categorySections = document.querySelectorAll('.category-section');
const searchInput = document.getElementById('searchInput');
let   noResults = document.getElementById('noResults');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    tabButtons.forEach((b) => b.classList.remove('active'));
    categorySections.forEach((s) => s.classList.remove('active'));
    button.classList.add('active');

    const id = button.getAttribute('data-category');
    const section = document.getElementById(id);
    if (section) section.classList.add('active');

    if (searchInput) searchInput.value = '';
    resetSearch();
  });
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('faq-question')) {
    const item = e.target.closest('.faq-item');
    const ans  = item.querySelector('.faq-answer');

    // close all within that section
    const section = e.target.closest('.category-section');
    section.querySelectorAll('.faq-question').forEach(q => q.classList.remove('active'));
    section.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('active'));

    e.target.classList.add('active');
    ans.classList.add('active');
  }
});

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) { resetSearch(); return; }

    let any = false;
    categorySections.forEach(section => {
      const items = section.querySelectorAll('.faq-item');
      let showSection = false;
      items.forEach(item => {
        const q = item.querySelector('.faq-question').textContent.toLowerCase();
        const a = item.querySelector('.faq-answer').textContent.toLowerCase();
        const match = q.includes(term) || a.includes(term);
        item.style.display = match ? 'block' : 'none';
        if (match) { any = true; showSection = true; }
      });
      section.style.display = showSection ? 'block' : 'none';
    });

    if (noResults) noResults.classList.toggle('show', !any);
    const tabs = document.querySelector('.category-tabs');
    if (tabs) tabs.style.opacity = any ? '0.5' : '1';
  });
}

function resetSearch() {
  document.querySelectorAll('.faq-item').forEach(i => i.style.display = 'block');
  categorySections.forEach(s => s.style.display = s.classList.contains('active') ? 'block' : 'none');
  if (noResults) noResults.classList.remove('show');
  const tabs = document.querySelector('.category-tabs');
  if (tabs) tabs.style.opacity = '1';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && searchInput) {
    searchInput.value = '';
    resetSearch();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const v = document.getElementById('streetVideo');
  if (!v) return;
  const tryPlay = () => v.play().catch(() => {});
  v.addEventListener('canplay', tryPlay, { once: true });
  // If user interacts with page, try again
  ['click','touchstart'].forEach(evt => window.addEventListener(evt, tryPlay, { once: true }));
});


/* ---------- Multi-state polls (Penang, Perak, Sarawak, Melaka) ---------- */
const STATES = ["Penang", "Perak", "Sarawak", "Melaka"];
const keyVotes  = (s) => `pollVotes_${s}_v1`;
const keyVoted  = (s) => `hasVoted_${s}_v1`;
const keyChoice = (s) => `userVote_${s}_v1`;

let foodsData = [];
const votesByState = {};
const userVotedMap = {};
const userChoiceMap = {};

function fixPath(p) {
  if (!p) return '';
  if (p.startsWith('../foodImage/'))  return '../../FoodDetail/foodImage/' + p.slice('../foodImage/'.length);
  if (p.startsWith('../places/'))     return '../../places/' + p.slice('../places/'.length);
  if (p.startsWith('/FoodDetail/ingredients/')) return '..' + '/..' + p;
  return p;
}

async function loadFoodsForPolls() {
  const tries = [
    '../FoodDetail/json/food.json',   // correct for FAQ/html/
    '/FoodDetail/json/food.json',     // if served from project root
    '../../FoodDetail/json/food.json' // fallback
  ];
  for (const url of tries) {
    try {
      const r = await fetch(url, { cache: 'no-cache' });
      if (r.ok) return await r.json();
    } catch (_) {}
  }
  throw new Error('Could not fetch food.json for polls.');
}

window.addEventListener('DOMContentLoaded', initStatePolls);

async function initStatePolls() {
  try {
    foodsData = await loadFoodsForPolls();
  } catch (err) {
    console.error('Failed to load food.json for polls:', err);
    const mount = document.getElementById('state-polls');
    if (mount) mount.innerHTML = '<p style="text-align:center;color:#666;">Could not load poll options.</p>';
    return;
  }

  const mount = document.getElementById('state-polls');
  if (!mount) return;

  STATES.forEach((state) => renderStateCard(mount, state));
  STATES.forEach((state) => updateDisplay(state));
}

function renderStateCard(mount, state) {
  const items = foodsData.filter(f => f.state === state).slice(0, 4);
  votesByState[state] = Object.fromEntries(items.map(f => [f.id, 0]));

  const saved = sessionStorage.getItem(keyVotes(state));
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.keys(votesByState[state]).forEach(k => {
      if (parsed[k] != null) votesByState[state][k] = parsed[k];
    });
  } else {
    sessionStorage.setItem(keyVotes(state), JSON.stringify(votesByState[state]));
  }
  userVotedMap[state]  = sessionStorage.getItem(keyVoted(state)) === 'true';
  userChoiceMap[state] = sessionStorage.getItem(keyChoice(state));

  const slug = state.toLowerCase();
  const card = document.createElement('article');
  card.className = 'poll-card';
  card.id = `poll-${slug}`;

  card.innerHTML = `
    <header class="poll-card__header">
      <div class="poll-card__emoji">🍽️</div>
      <h2 class="poll-card__title">${state} – Food Battle</h2>
    </header>
    <div class="poll-options" id="options-${slug}"></div>
    <div class="poll-card__footer">
      <div class="poll-card__totals">
        <span>Total Votes</span>
        <strong id="total-${slug}">0</strong>
      </div>
      <div id="status-${slug}" class="status-message"></div>
    </div>
  `;
  mount.appendChild(card);

  const container = card.querySelector(`#options-${slug}`);
  items.forEach((food, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.id = `${slug}-${food.id}`;
    btn.addEventListener('click', () => vote(state, food.id));

    const imgSrc = fixPath(food.image);
    const imgHtml = imgSrc ? `<img src="${imgSrc}" alt="${food.name}" class="option-img">` : '🍽️';

    btn.innerHTML = `
      <div class="option-content">
        <div class="option-media">${imgHtml}</div>
        <div class="option-text">
          <h3>${idx + 1}) ${food.name}</h3>
          <p>${food.state}${Array.isArray(food.tags) && food.tags.length ? ' • ' + food.tags.join(', ') : ''}</p>
        </div>
      </div>
      <div class="check-mark" id="check-${slug}-${food.id}" style="display:none;">✓</div>
      <div class="results" id="results-${slug}-${food.id}">
        <div class="result-stats">
          <span id="votes-${slug}-${food.id}">0 votes</span>
          <span id="percent-${slug}-${food.id}">0%</span>
        </div>
        <div class="result-bar"><div class="result-fill" id="bar-${slug}-${food.id}" style="width:0%"></div></div>
      </div>
    `;
    container.appendChild(btn);
  });

  if (userVotedMap[state]) showResults(state);
}

function vote(state, foodId) {
  const slug = state.toLowerCase();

  const prev = userChoiceMap[state];
  if (userVotedMap[state] && prev && votesByState[state][prev] > 0) {
    votesByState[state][prev]--;
  }

  votesByState[state][foodId] = (votesByState[state][foodId] || 0) + 1;
  userVotedMap[state]  = true;
  userChoiceMap[state] = foodId;

  sessionStorage.setItem(keyVotes(state),  JSON.stringify(votesByState[state]));
  sessionStorage.setItem(keyVoted(state),  'true');
  sessionStorage.setItem(keyChoice(state), foodId);

  updateDisplay(state);
  showResults(state);

  const status = document.getElementById(`status-${slug}`);
  if (status) {
    const food = foodsData.find(f => f.id === foodId);
    status.innerHTML = `<p>Thanks for voting! You chose ${food ? food.name : foodId} 🎉<br><small>You can change your vote by clicking another option.</small></p>`;
    status.className = 'status-message status-voted';
  }
}

function updateDisplay(state) {
  const slug = state.toLowerCase();
  const voteMap = votesByState[state];
  const ids = Object.keys(voteMap);
  const total = ids.reduce((s, k) => s + (voteMap[k] || 0), 0);

  ids.forEach(id => {
    const percent = total > 0 ? Math.round((voteMap[id] / total) * 100) : 0;
    const votesEl   = document.getElementById(`votes-${slug}-${id}`);
    const percentEl = document.getElementById(`percent-${slug}-${id}`);
    const barEl     = document.getElementById(`bar-${slug}-${id}`);
    if (votesEl)   votesEl.textContent   = `${voteMap[id]} vote${voteMap[id] !== 1 ? 's' : ''}`;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (barEl)     barEl.style.width     = percent + '%';
  });

  const totalEl = document.getElementById(`total-${slug}`);
  if (totalEl) totalEl.textContent = total;
}

function showResults(state) {
  const slug = state.toLowerCase();
  const voteMap = votesByState[state];
  Object.keys(voteMap).forEach(id => {
    const res   = document.getElementById(`results-${slug}-${id}`);
    const check = document.getElementById(`check-${slug}-${id}`);
    const btn   = document.getElementById(`${slug}-${id}`);
    if (res) res.classList.add('show');
    if (check && btn) {
      if (id === userChoiceMap[state]) { check.style.display = 'block'; btn.classList.add('voted'); }
      else                             { check.style.display = 'none';  btn.classList.remove('voted'); }
    }
  });
}
