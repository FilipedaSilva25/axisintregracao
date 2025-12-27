let currentUser = null;
let currentMode = 'pessoal';
let authMode = 'login';
let pomoInterval = null;

// --- SISTEMA DE LOGIN ---
function toggleAuth(mode) {
    authMode = mode;
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('auth-main-btn').innerText = mode === 'login' ? 'Acessar' : 'Criar Conta';
}

function togglePassword() {
    const p = document.getElementById('password');
    p.type = p.type === 'password' ? 'text' : 'password';
}

function handleAuth() {
    const user = document.getElementById('username').value.trim().toUpperCase();
    const pass = document.getElementById('password').value;

    if (!user || !pass) return alert("Preencha todos os campos.");

    if (authMode === 'register') {
        const data = { 
            pass, 
            tasks: [], 
            fin: [], 
            habits: [{n:"Beber Água", d:false}, {n:"Ler 10min", d:false}, {n:"Treino", d:false}], 
            diary: {pessoal:"", profissional:""} 
        };
        localStorage.setItem('db_' + user, JSON.stringify(data));
        alert("Conta criada! Faça login.");
        toggleAuth('login');
    } else {
        const db = JSON.parse(localStorage.getItem('db_' + user));
        if (db && db.pass === pass) {
            currentUser = user;
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            updateUI();
        } else {
            alert("Dados incorretos.");
        }
    }
}

// --- NÚCLEO DO DASHBOARD ---
function switchMode() {
    const dash = document.getElementById('dashboard-main');
    dash.classList.add('changing');
    
    setTimeout(() => {
        currentMode = currentMode === 'pessoal' ? 'profissional' : 'pessoal';
        document.body.className = currentMode === 'pessoal' ? 'mode-pessoal' : 'mode-profissional';
        document.getElementById('mode-toggle').innerText = `Perfil: ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}`;
        document.getElementById('task-mode-label').innerText = currentMode.toUpperCase();
        updateUI();
        dash.classList.remove('changing');
    }, 300);
}

function updateUI() {
    const db = JSON.parse(localStorage.getItem('db_' + currentUser));
    document.getElementById('welcome-msg').innerText = currentUser;
    document.getElementById('user-initials').innerText = currentUser.substring(0,2);
    
    renderHabits(db);
    renderTasks(db);
    renderFinance(db);
    document.getElementById('diary-input').value = db.diary[currentMode] || "";
}

// --- FUNÇÕES DE DADOS ---

// 1. Hábitos
function renderHabits(db) {
    const list = document.getElementById('habit-list');
    list.innerHTML = '';
    let done = 0;
    db.habits.forEach((h, i) => {
        if (h.d) done++;
        list.innerHTML += `<div class="habit-item ${h.d?'done':''}" onclick="toggleHabit(${i})">${h.n} ${h.d?'✅':''}</div>`;
    });
    document.getElementById('habit-progress').style.width = (done/db.habits.length*100) + '%';
}

function toggleHabit(i) {
    const db = JSON.parse(localStorage.getItem('db_' + currentUser));
    db.habits[i].d = !db.habits[i].d;
    localStorage.setItem('db_' + currentUser, JSON.stringify(db));
    updateUI();
}

// 2. Tarefas
function addTodo() {
    const val = document.getElementById('todo-input').value;
    if(!val) return;
    const db = JSON.parse(localStorage.getItem('db_' + currentUser));
    db.tasks.push({text: val, mode: currentMode});
    localStorage.setItem('db_' + currentUser, JSON.stringify(db));
    document.getElementById('todo-input').value = '';
    updateUI();
}

function renderTasks(db) {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    db.tasks.filter(t => t.mode === currentMode).forEach(t => {
        list.innerHTML += `<li>${t.text}</li>`;
    });
}

// 3. Finanças Inteligentes (Verde e Vermelho)
function addFinance() {
    const desc = document.getElementById('fin-desc').value;
    const valInput = document.getElementById('fin-val').value;
    if(!desc || !valInput) return alert("Digite descrição e valor!");
    
    const val = parseFloat(valInput);
    const db = JSON.parse(localStorage.getItem('db_' + currentUser));
    
    db.fin.push({ desc, val, mode: currentMode, date: new Date().toLocaleDateString('pt-BR').slice(0,5) });
    localStorage.setItem('db_' + currentUser, JSON.stringify(db));
    
    document.getElementById('fin-desc').value = '';
    document.getElementById('fin-val').value = '';
    updateUI();
}

function renderFinance(db) {
    const list = document.getElementById('fin-list');
    list.innerHTML = '';
    let total = 0;

    const items = db.fin.filter(f => f.mode === currentMode);

    items.forEach(f => {
        total += f.val;
        const isExpense = f.val < 0;
        list.innerHTML += `
            <li class="finance-item ${isExpense ? 'expense' : 'income'}">
                <div>${f.desc} <small style="opacity:0.5; margin-left:5px">(${f.date})</small></div>
                <span>${isExpense ? '' : '+'}R$ ${f.val.toFixed(2)}</span>
            </li>
        `;
    });

    const totalEl = document.getElementById('fin-total');
    totalEl.innerText = `R$ ${total.toFixed(2)}`;
    totalEl.style.color = total >= 0 ? '#34C759' : '#FF453A';
}

// 4. Diário
function saveDiary() {
    const db = JSON.parse(localStorage.getItem('db_' + currentUser));
    db.diary[currentMode] = document.getElementById('diary-input').value;
    localStorage.setItem('db_' + currentUser, JSON.stringify(db));
    alert("Salvo!");
}

// 5. Pomodoro
function togglePomodoro() {
    if (pomoInterval) { clearInterval(pomoInterval); pomoInterval = null; }
    else {
        let t = 1500;
        pomoInterval = setInterval(() => {
            t--;
            let m = Math.floor(t/60), s = t%60;
            document.getElementById('pomo-timer').innerText = `${m}:${s<10?'0':''}${s}`;
            if (t <= 0) clearInterval(pomoInterval);
        }, 1000);
    }
}

function logout() { location.reload(); }
