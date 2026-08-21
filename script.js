// ========== ДАННЫЕ ==========
const SKINS = [
    { id: 1, name: 'Обычный меч', icon: '🗡️', rarity: 'common', upgradeChance: 50 },
    { id: 2, name: 'Редкий меч', icon: '⚔️', rarity: 'rare', upgradeChance: 40 },
    { id: 3, name: 'Эпический меч', icon: '🗡️', rarity: 'epic', upgradeChance: 30 },
    { id: 4, name: 'Легендарный меч', icon: '⚔️', rarity: 'legendary', upgradeChance: 20 },
    { id: 5, name: 'Обычный щит', icon: '🛡️', rarity: 'common', upgradeChance: 50 },
    { id: 6, name: 'Редкий щит', icon: '🛡️', rarity: 'rare', upgradeChance: 40 },
    { id: 7, name: 'Эпический щит', icon: '🛡️', rarity: 'epic', upgradeChance: 30 },
    { id: 8, name: 'Легендарный щит', icon: '🛡️', rarity: 'legendary', upgradeChance: 20 },
];

const UPGRADE_PATHS = {
    1: 2,  // Обычный меч -> Редкий меч
    2: 3,  // Редкий меч -> Эпический меч
    3: 4,  // Эпический меч -> Легендарный меч
    4: null, // Легендарный меч - финал
    5: 6,  // Обычный щит -> Редкий щит
    6: 7,  // Редкий щит -> Эпический щит
    7: 8,  // Эпический щит -> Легендарный щит
    8: null, // Легендарный щит - финал
};

// ========== СОСТОЯНИЕ ==========
let state = {
    currentPlayer: 'Игрок1',
    selectedSkin: null,
    multiplier: 1,
    selectedChance: 50,
    balance: 1000,
    successCount: 0,
    totalCount: 0,
    blockedPlayers: [],
    playerSkins: {},
    globalChance: 1.0,
};

// ========== ЗАГРУЗКА ДАННЫХ ==========
function loadState() {
    const saved = localStorage.getItem('bloxstrike_upgrader_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
        } catch (e) {}
    }
}

function saveState() {
    localStorage.setItem('bloxstrike_upgrader_state', JSON.stringify(state));
}

// ========== ГЛАВНАЯ СТРАНИЦА ==========
function login() {
    const nameInput = document.getElementById('playerName');
    state.currentPlayer = nameInput.value || 'Игрок1';
    if (!state.playerSkins[state.currentPlayer]) {
        state.playerSkins[state.currentPlayer] = [1, 5]; // Стартовые скины
    }
    saveState();
    renderSkins();
    updateStats();
    showMessage(`Добро пожаловать, ${state.currentPlayer}!`);
}

function renderSkins() {
    const grid = document.getElementById('skinGrid');
    grid.innerHTML = '';
    
    const playerSkins = state.playerSkins[state.currentPlayer] || [];
    
    SKINS.forEach(skin => {
        const div = document.createElement('div');
        div.className = 'slot';
        if (playerSkins.includes(skin.id)) {
            div.innerHTML = skin.icon;
            div.style.background = '#2a2a4e';
            div.title = `${skin.name} (есть)`;
        } else {
            div.innerHTML = '❓';
            div.style.background = '#1a1a2e';
            div.title = `${skin.name} (нет)`;
        }
        div.onclick = () => selectSkin(skin.id);
        if (state.selectedSkin === skin.id) {
            div.classList.add('selected');
        }
        grid.appendChild(div);
    });
}

function selectSkin(skinId) {
    const playerSkins = state.playerSkins[state.currentPlayer] || [];
    if (!playerSkins.includes(skinId)) {
        showMessage('У вас нет этого скина!', 'error');
        return;
    }
    state.selectedSkin = skinId;
    renderSkins();
    updateCenterSlot();
    saveState();
}

function updateCenterSlot() {
    const slot = document.querySelector('.center-slot .slot');
    const skin = SKINS.find(s => s.id === state.selectedSkin);
    if (skin) {
        slot.innerHTML = skin.icon;
        const chance = Math.min(skin.upgradeChance * state.globalChance, 100);
        document.getElementById('chancePercent').textContent = `${chance.toFixed(2)}%`;
        
        // Текст шанса
        const chanceText = document.getElementById('chanceText');
        if (chance >= 70) chanceText.textContent = 'высокий шанс';
        else if (chance >= 40) chanceText.textContent = 'средний шанс';
        else chanceText.textContent = 'низкий шанс';
    } else {
        slot.innerHTML = '💎';
        document.getElementById('chancePercent').textContent = '0.00%';
        document.getElementById('chanceText').textContent = 'выберите скин';
    }
}

function setMultiplier(mult) {
    state.multiplier = mult;
    showMessage(`Множитель: ×${mult}`);
}

function setChance(chance) {
    state.selectedChance = chance;
    showMessage(`Шанс: ${chance}%`);
}

function upgrade() {
    if (!state.selectedSkin) {
        showMessage('Выберите скин для улучшения!', 'error');
        return;
    }
    
    const skin = SKINS.find(s => s.id === state.selectedSkin);
    if (!skin) return;
    
    // Проверка блокировки
    if (state.blockedPlayers.includes(state.currentPlayer)) {
        showMessage('❌ Ваши улучшения заблокированы администратором!', 'error');
        return;
    }
    
    const nextSkinId = UPGRADE_PATHS[skin.id];
    if (!nextSkinId) {
        showMessage('Этот скин уже максимального уровня!', 'error');
        return;
    }
    
    // Расчет шанса
    const baseChance = Math.min(skin.upgradeChance * state.globalChance, 100);
    const finalChance = Math.min(baseChance, state.selectedChance);
    
    state.totalCount += state.multiplier;
    let success = 0;
    
    for (let i = 0; i < state.multiplier; i++) {
        if (Math.random() * 100 < finalChance) {
            success++;
            state.successCount++;
        }
    }
    
    // Результат
    if (success > 0) {
        const playerSkins = state.playerSkins[state.currentPlayer] || [];
        for (let i = 0; i < success; i++) {
            if (!playerSkins.includes(nextSkinId)) {
                playerSkins.push(nextSkinId);
            }
        }
        state.playerSkins[state.currentPlayer] = playerSkins;
        showMessage(`✅ Успешно! Получен ${SKINS.find(s => s.id === nextSkinId)?.name} (${success} шт)`, 'success');
    } else {
        showMessage(`❌ Провал! Все ${state.multiplier} попытки не удались`, 'error');
    }
    
    // Убираем использованные скины (если они есть)
    const playerSkins = state.playerSkins[state.currentPlayer] || [];
    for (let i = 0; i < state.multiplier; i++) {
        const idx = playerSkins.indexOf(skin.id);
        if (idx > -1) playerSkins.splice(idx, 1);
    }
    state.playerSkins[state.currentPlayer] = playerSkins;
    
    renderSkins();
    updateStats();
    saveState();
}

function updateStats() {
    document.getElementById('balance').textContent = state.balance;
    document.getElementById('successCount').textContent = state.successCount;
    document.getElementById('totalCount').textContent = state.totalCount;
}

function showMessage(text, type = 'info') {
    const existing = document.querySelector('.toast-message');
    if (existing) existing.remove();
    
    const div = document.createElement('div');
    div.className = `toast-message ${type}`;
    div.textContent = text;
    div.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 30px;
        border-radius: 10px;
        background: ${type === 'success' ? '#00ff8822' : type === 'error' ? '#ff6b6b22' : '#f0c04022'};
        border: 2px solid ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff6b6b' : '#f0c040'};
        color: #fff;
        z-index: 1000;
        animation: fadeIn 0.5s;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ========== АДМИН-ПАНЕЛЬ ==========
function adminLogin() {
    const password = document.getElementById('adminPassword')?.value || '';
    if (password === 'admin123') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        populateAdminSkins();
        updatePlayerList();
    } else {
        alert('Неверный пароль!');
    }
}

function adminLogout() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
}

function populateAdminSkins() {
    const select = document.getElementById('giveSkin');
    if (!select) return;
    select.innerHTML = '';
    SKINS.forEach(skin => {
        const option = document.createElement('option');
        option.value = skin.id;
        option.textContent = `${skin.icon} ${skin.name}`;
        select.appendChild(option);
    });
}

function blockPlayer() {
    const name = document.getElementById('blockPlayer').value.trim();
    if (!name) return;
    if (!state.blockedPlayers.includes(name)) {
        state.blockedPlayers.push(name);
        saveState();
        updatePlayerList();
        showMessage(`✅ Игрок ${name} заблокирован`, 'success');
    }
}

function unblockPlayer() {
    const name = document.getElementById('blockPlayer').value.trim();
    if (!name) return;
    state.blockedPlayers = state.blockedPlayers.filter(p => p !== name);
    saveState();
    updatePlayerList();
    showMessage(`✅ Игрок ${name} разблокирован`, 'success');
}

function giveSkin() {
    const name = document.getElementById('givePlayer').value.trim();
    const skinId = parseInt(document.getElementById('giveSkin')?.value || '1');
    if (!name) return;
    
    if (!state.playerSkins[name]) {
        state.playerSkins[name] = [];
    }
    if (!state.playerSkins[name].includes(skinId)) {
        state.playerSkins[name].push(skinId);
        saveState();
        updatePlayerList();
        const skin = SKINS.find(s => s.id === skinId);
        showMessage(`✅ Выдан ${skin?.name} игроку ${name}`, 'success');
    } else {
        showMessage(`У игрока уже есть этот скин`, 'info');
    }
}

function setGlobalChance() {
    const value = parseFloat(document.getElementById('globalChance').value || '1.0');
    state.globalChance = value;
    saveState();
    updateCenterSlot();
    showMessage(`Глобальный множитель: ${value}x`, 'success');
}

function updatePlayerList() {
    const list = document.getElementById('playerList');
    if (!list) return;
    
    const players = Object.keys(state.playerSkins);
    list.innerHTML = players.map(name => `
        <div style="padding: 5px; border-bottom: 1px solid #2a2a4e;">
            <strong>${name}</strong>
            ${state.blockedPlayers.includes(name) ? '🔒' : '✅'}
            (${state.playerSkins[name].length} скинов)
        </div>
    `).join('');
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
loadState();
if (state.currentPlayer) {
    document.getElementById('playerName').value = state.currentPlayer;
    login();
}
updateCenterSlot();

// Для админки - автозаполнение
setTimeout(() => {
    if (document.getElementById('loginForm')) {
        // На странице админки
        document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') adminLogin();
        });
    }
}, 100);
