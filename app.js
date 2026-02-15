/* app.js
   Логика вкладок, рендер теории, тестов и история в localStorage.
   Не требует изменений для смены цветовой схемы.
*/

const DATA = [
  { id: "q1", title: "Введение и СИ", theory: "Физика — фундаментальная наука. СИ: метр, килограмм, секунда, ампер, кельвин, моль, кандела.", quiz: [{ q: "Сколько основных единиц в СИ?", choices: ["5","7","8","6"], answer:1 }] },
  { id: "q2", title: "Кинематика точки", theory: "r(t), v = dr/dt, a = d2r/dt2. Естественная система: v = ds/dt, an = v^2/R.", quiz: [{ q: "Скорость это", choices:["dr/dt","d2r/dt2","r(t)","s(t)"], answer:0 }] },
  { id: "q3", title: "Прямая и обратная задачи", theory: "Прямая: по r(t) найти v и a. Обратная: по a и начальным условиям найти r через интегрирование.", quiz: [{ q: "Обратная задача решается через", choices:["Дифференцирование","Интегрирование","Линеаризацию","Фурье"], answer:1 }] },
  { id: "q4", title: "Кинематика АТТ", theory: "АТТ имеет 6 степеней свободы. Виды движения: поступательное, вращательное, плоское, винтовое.", quiz: [{ q: "Степеней свободы у АТТ", choices:["3","4","6","5"], answer:2 }] },
  { id: "q5", title: "Закон инерции", theory: "Первый закон Ньютона. Преобразования Галилея x' = x - V t.", quiz: [{ q: "Закон инерции это", choices:["1-й закон","2-й закон","3-й закон","Закон сохранения"], answer:0 }] }
];

// DOM
const tabsEl = document.getElementById('tabs');
const tocEl = document.getElementById('toc');
const qTitle = document.getElementById('q-title');
const theoryEl = document.getElementById('theory');
const quizQuestions = document.getElementById('quiz-questions');
const submitBtn = document.getElementById('submit-quiz');
const resetBtn = document.getElementById('reset-quiz');
const historyModal = document.getElementById('history-modal');
const openHistoryBtn = document.getElementById('open-history');
const closeHistoryBtn = document.getElementById('close-history');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const toggleTabsBtn = document.getElementById('toggle-tabs');

let currentId = null;

function buildUI(){
  DATA.forEach((item, idx) => {
    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.role = 'tab';
    tab.dataset.id = item.id;
    tab.textContent = `${idx+1}. ${item.title}`;
    tab.addEventListener('click', () => select(item.id));
    tabsEl.appendChild(tab);

    const li = document.createElement('li');
    li.textContent = `${idx+1}. ${item.title}`;
    li.tabIndex = 0;
    li.dataset.id = item.id;
    li.addEventListener('click', () => select(item.id));
    tocEl.appendChild(li);
  });
}

function select(id){
  const item = DATA.find(d => d.id === id);
  if(!item) return;
  currentId = id;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.id === id));
  document.querySelectorAll('.toc li').forEach(li => li.classList.toggle('active', li.dataset.id === id));
  qTitle.textContent = item.title;
  theoryEl.innerHTML = `<p>${escapeHtml(item.theory)}</p>`;
  renderQuiz(item.quiz);
  document.getElementById('content-panel').focus();
}

function renderQuiz(quiz){
  quizQuestions.innerHTML = '';
  quiz.forEach((q, i) => {
    const qWrap = document.createElement('div');
    qWrap.className = 'question';
    qWrap.innerHTML = `<strong>${i+1}. ${escapeHtml(q.q)}</strong>`;
    q.choices.forEach((c, ci) => {
      const label = document.createElement('label');
      label.className = 'choice';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${i}`;
      input.value = ci;
      label.appendChild(input);
      const span = document.createElement('span');
      span.textContent = c;
      label.appendChild(span);
      qWrap.appendChild(label);
    });
    quizQuestions.appendChild(qWrap);
  });
}

submitBtn.addEventListener('click', () => {
  if(!currentId) return alert('Выберите вкладку');
  const item = DATA.find(d => d.id === currentId);
  const quiz = item.quiz;
  let correct = 0;
  const answers = [];
  quiz.forEach((q, i) => {
    const sel = document.querySelector(`input[name="q${i}"]:checked`);
    const chosen = sel ? Number(sel.value) : null;
    answers.push(chosen);
    if(chosen === q.answer) correct++;
  });
  const score = Math.round((correct / quiz.length) * 100);
  const entry = { id: item.id, title: item.title, date: new Date().toISOString(), correct, total: quiz.length, score, answers };
  saveHistory(entry);
  showToast(`Результат: ${correct}/${quiz.length} — ${score}%`);
});

resetBtn.addEventListener('click', () => {
  quizQuestions.querySelectorAll('input[type=radio]').forEach(i => i.checked = false);
});

openHistoryBtn.addEventListener('click', () => { renderHistory(); historyModal.classList.add('show'); historyModal.setAttribute('aria-hidden','false'); });
closeHistoryBtn.addEventListener('click', () => { historyModal.classList.remove('show'); historyModal.setAttribute('aria-hidden','true'); });
clearHistoryBtn.addEventListener('click', () => {
  if(confirm('Очистить всю историю тестов?')) {
    localStorage.removeItem('physics_quiz_history');
    renderHistory();
  }
});

function saveHistory(entry){
  const key = 'physics_quiz_history';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.unshift(entry);
  localStorage.setItem(key, JSON.stringify(arr.slice(0,200)));
  renderHistory();
}

function renderHistory(){
  const key = 'physics_quiz_history';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  historyList.innerHTML = '';
  if(arr.length === 0){
    historyList.innerHTML = '<p style="color:var(--muted)">История пуста</p>';
    return;
  }
  arr.forEach((h, i) => {
    const row = document.createElement('div');
    row.className = 'history-row';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.style.padding = '8px';
    row.style.borderRadius = '8px';
    row.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,252,255,0.88))';
    row.innerHTML = `<div style="flex:1">
      <strong>${escapeHtml(h.title)}</strong>
      <div style="color:var(--muted);font-size:13px">${new Date(h.date).toLocaleString()} — ${h.correct}/${h.total} (${h.score}%)</div>
    </div>
    <div style="margin-left:12px">
      <button class="btn" data-idx="${i}">Открыть</button>
    </div>`;
    const btn = row.querySelector('button');
    btn.addEventListener('click', () => {
      select(h.id);
      historyModal.classList.remove('show');
    });
    historyList.appendChild(row);
  });
}

function showToast(text){
  const t = document.createElement('div');
  t.textContent = text;
  t.style.position = 'fixed';
  t.style.left = '50%';
  t.style.transform = 'translateX(-50%)';
  t.style.bottom = '28px';
  t.style.padding = '10px 16px';
  t.style.borderRadius = '12px';
  t.style.background = 'linear-gradient(90deg, rgba(11,102,255,0.12), rgba(77,166,255,0.12))';
  t.style.color = '#04203a';
  t.style.boxShadow = '0 8px 30px rgba(6,30,60,0.12)';
  document.body.appendChild(t);
  setTimeout(() => t.style.opacity = '0', 1800);
  setTimeout(() => t.remove(), 2200);
}

toggleTabsBtn.addEventListener('click', () => {
  const visible = tabsEl.style.display !== 'flex';
  tabsEl.style.display = visible ? 'flex' : 'none';
});

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

buildUI();
select(DATA[0].id);
renderHistory();
