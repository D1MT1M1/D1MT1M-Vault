// API Configuration
// Используем config.js если доступен, иначе Render URL напрямую
let API_BASE_URL;

if (typeof API_CONFIG !== 'undefined') {
    // Если config.js подключен
    API_BASE_URL = API_CONFIG.getCurrent();
} else {
    // Fallback на production URL (Render)
    API_BASE_URL = 'https://music-player-backend-u83s.onrender.com';
}

console.log('🌐 API Base URL:', API_BASE_URL);

document.addEventListener('DOMContentLoaded', () => {
    // === ЭЛЕМЕНТЫ АВТОРИЗАЦИИ ===
    const authScreen = document.getElementById('authScreen');
    const mainApp = document.getElementById('mainApp');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const authMessage = document.getElementById('authMessage');
    const welcomeUser = document.getElementById('welcomeUser');
    const logoutBtn = document.getElementById('logoutBtn');

    // === ЭЛЕМЕНТЫ ПЛЕЕРА ===
    const trackList = document.getElementById('trackList');
    const fileInput = document.getElementById('fileInput');
    const currentTrackName = document.getElementById('currentTrackName');
    const audio = document.getElementById('audioPlayer');
    
    // Кнопки управления
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    
    // Прогресс-бар
    const progressContainer = document.querySelector('.progress-container');
    const progressFill = document.querySelector('.progress-fill');
    const progressKnob = document.querySelector('.progress-knob');
    const currentTimeText = document.getElementById('currentTime');
    const totalTimeText = document.getElementById('totalTime');
    
    // Громкость
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeLabel = document.querySelector('.volume-label');

    // === ПЕРЕМЕННЫЕ СОСТОЯНИЯ ===
    let isRepeatOne = false;
    let currentTrackIndex = -1;
    let trackElements = [];
    let tracksData = [];

    // ==========================================
    // АВТОРИЗАЦИЯ
    // ==========================================

    const checkAuth = () => {
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        if (userId && username) {
            authScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
            welcomeUser.textContent = `Привет, ${username}!`;
            fetchLibrary();
        }
    };

    loginBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: usernameInput.value, password: passwordInput.value})
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('userId', data.user_id);
                localStorage.setItem('username', data.username);
                location.reload();
            } else {
                authMessage.textContent = data.error || 'Ошибка входа';
                authMessage.style.color = '#f87171';
            }
        } catch (error) {
            console.error('Login error:', error);
            authMessage.textContent = 'Ошибка сети. Проверьте если бекенд запущен';
            authMessage.style.color = '#f87171';
        }
    });

    registerBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: usernameInput.value, password: passwordInput.value})
            });
            const data = await response.json();
            
            if (response.ok) {
                authMessage.style.color = '#4ade80';
                authMessage.textContent = "✓ Успешно! Теперь вы можете войти.";
            } else {
                authMessage.style.color = '#f87171';
                authMessage.textContent = data.error || 'Ошибка регистрации';
            }
        } catch (error) {
            console.error('Registration error:', error);
            authMessage.style.color = '#f87171';
            authMessage.textContent = 'Ошибка сети';
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });

    // ==========================================
    // ЗАГРУЗКА И ОТРИСОВКА ТРЕКОВ
    // ==========================================

    const fetchLibrary = async () => {
        const userId = localStorage.getItem('userId');
        try {
            const response = await fetch(`${API_BASE_URL}/api/tracks`, {
                headers: {'X-User-ID': userId}
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            tracksData = await response.json();
            renderTracks(tracksData);
        } catch (error) {
            console.error('Fetch library error:', error);
            trackList.innerHTML = '<div class="empty-state">⚠️ Ошибка загрузки. Проверьте бекенд.</div>';
        }
    };

    const renderTracks = (tracks) => {
        trackList.innerHTML = '';
        trackElements = [];
        
        if (tracks.length === 0) {
            trackList.innerHTML = '<div class="empty-state">📭 Библиотека пуста. Загрузите музыку!</div>';
            return;
        }

        tracks.forEach((trackObj, index) => {
            const div = document.createElement('div');
            div.className = 'track-item';
            div.textContent = trackObj.filename;
            trackElements.push(div);

            div.addEventListener('click', () => playTrack(index));
            trackList.appendChild(div);
        });
    };

    // ==========================================
    // УПРАВЛЕНИЕ ВОСПРОИЗВЕДЕНИЕМ
    // ==========================================

    const playTrack = (index) => {
        if (index < 0 || index >= tracksData.length) return;
        
        currentTrackIndex = index;
        
        // Обновляем визуальное выделение
        trackElements.forEach(el => el.classList.remove('playing'));
        trackElements[index].classList.add('playing');
        
        // Загружаем и воспроизводим трек
        const trackObj = tracksData[index];
        currentTrackName.textContent = trackObj.filename;
        audio.src = trackObj.url;
        audio.play();
        playBtn.querySelector('span').textContent = '⏸';
    };

    // Кнопка Play/Pause
    playBtn.addEventListener('click', () => {
        if (!audio.src) return;
        if (audio.paused) {
            audio.play();
            playBtn.querySelector('span').textContent = '⏸';
        } else {
            audio.pause();
            playBtn.querySelector('span').textContent = '▶';
        }
    });

    // Кнопка Previous Track
    prevBtn.addEventListener('click', () => {
        let newIndex = currentTrackIndex - 1;
        if (newIndex < 0) newIndex = tracksData.length - 1;
        playTrack(newIndex);
    });

    // Кнопка Next Track
    nextBtn.addEventListener('click', () => {
        let newIndex = currentTrackIndex + 1;
        if (newIndex >= tracksData.length) newIndex = 0;
        playTrack(newIndex);
    });

    // Кнопка Repeat
    repeatBtn.addEventListener('click', () => {
        isRepeatOne = !isRepeatOne;
        audio.loop = isRepeatOne;
        repeatBtn.classList.toggle('active', isRepeatOne);
    });

    // Автоматический переход на следующий трек при окончании
    audio.addEventListener('ended', () => {
        if (isRepeatOne) {
            audio.currentTime = 0;
            audio.play();
        } else {
            nextBtn.click();
        }
    });

    // ==========================================
    // ПРОГРЕСС-БАР И ВРЕМЯ
    // ==========================================

    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${percent}%`;
        progressKnob.style.left = `${percent}%`;
        currentTimeText.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
        totalTimeText.textContent = formatTime(audio.duration);
    });

    progressContainer.addEventListener('click', (e) => {
        if (!audio.src) return;
        const rect = progressContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
    });

    // ==========================================
    // УПРАВЛЕНИЕ ГРОМКОСТЬЮ
    // ==========================================

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
        const percent = Math.round(e.target.value * 100);
        if (volumeLabel) volumeLabel.textContent = percent + '%';
    });

    // ==========================================
    // ЗАГРУЗКА ФАЙЛА
    // ==========================================

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const userId = localStorage.getItem('userId');
        currentTrackName.textContent = "⏳ Загружаем в облако...";

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: {'X-User-ID': userId},
                body: formData
            });

            if (response.ok) {
                currentTrackName.textContent = "✓ Успешно загружено!";
                setTimeout(() => fetchLibrary(), 1000);
            } else {
                const data = await response.json();
                currentTrackName.textContent = data.error || "❌ Ошибка загрузки.";
            }
        } catch (error) {
            console.error('Upload error:', error);
            currentTrackName.textContent = "❌ Ошибка сети при загрузке.";
        } finally {
            fileInput.value = '';
        }
    });

    // ==========================================
    // УТИЛИТЫ
    // ==========================================

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ==========================================
    // ИНИЦИАЛИЗАЦИЯ
    // ==========================================

    checkAuth();
});
