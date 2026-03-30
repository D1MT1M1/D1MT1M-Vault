// ==========================================
// ВНИМАНИЕ: Вставь сюда ссылку на свой бэкенд
// Например: 'https://твой-ник-d1mt1m-vault.hf.space'
// ==========================================
const API_BASE_URL = 'https://d1mt1m-music-player.hf.space';

document.addEventListener('DOMContentLoaded', () => {
    // UI элементы списка
    const trackList = document.getElementById('trackList');
    const fileInput = document.getElementById('fileInput');
    const currentTrackName = document.getElementById('currentTrackName');

    // UI элементы плеера
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const currentTimeText = document.getElementById('currentTime');
    const totalTimeText = document.getElementById('totalTime');
    const progressContainer = document.querySelector('.progress-container');
    const progressFill = document.querySelector('.progress-fill');
    const progressKnob = document.querySelector('.progress-knob');
    const volumeSlider = document.getElementById('volumeSlider');

    // Состояние
    let isRepeatOne = false;
    let trackElements = []; // Список DOM-элементов треков

    // Форматирование времени (00:00)
    const formatTime = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // Загрузка библиотеки треков
    const fetchLibrary = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tracks`);
            const tracks = await response.json();
            renderTracks(tracks);
        } catch (error) {
            trackList.innerHTML = '<div class="empty-state">Failed to connect to the server. Check API_BASE_URL.</div>';
            console.error('Error fetching tracks:', error);
        }
    };

    // Отрисовка списка
    const renderTracks = (tracks) => {
        trackList.innerHTML = '';
        trackElements = []; // Очищаем список DOM-элементов
        if (tracks.length === 0) {
            trackList.innerHTML = '<div class="empty-state">Library is empty. Upload your first track!</div>';
            return;
        }

        tracks.forEach(track => {
            const div = document.createElement('div');
            div.className = 'track-item';
            div.textContent = track;
            trackElements.push(div); // Сохраняем элемент

            div.addEventListener('click', () => {
                playTrack(track, div);
            });

            trackList.appendChild(div);
        });
    };

    // Воспроизведение конкретного трека
    const playTrack = (trackName, element) => {
        // Обновляем активный класс
        trackElements.forEach(el => el.classList.remove('playing'));
        if (element) element.classList.add('playing');
        
        // Обновляем плеер и запускаем
        currentTrackName.textContent = trackName;
        audio.src = `${API_BASE_URL}/tracks/${encodeURIComponent(trackName)}`;
        audio.play();
        playBtn.textContent = '❚❚'; // Icon for Pause
    };

    // Логика кнопок управления
    playBtn.addEventListener('click', () => {
        if (!audio.src) return; // Нет трека - нет действия
        if (audio.paused) {
            audio.play();
            playBtn.textContent = '❚❚';
        } else {
            audio.pause();
            playBtn.textContent = '▶';
        }
    });

    // Навигация (базовая по списку)
    const findActiveIndex = () => {
        return trackElements.findIndex(el => el.classList.contains('playing'));
    };

    prevBtn.addEventListener('click', () => {
        if (!audio.src) return;
        const currentIndex = findActiveIndex();
        if (currentIndex > 0) {
            const prevElement = trackElements[currentIndex - 1];
            playTrack(prevElement.textContent, prevElement);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (!audio.src) return;
        const currentIndex = findActiveIndex();
        if (currentIndex !== -1 && currentIndex < trackElements.length - 1) {
            const nextElement = trackElements[currentIndex + 1];
            playTrack(nextElement.textContent, nextElement);
        }
    });

    // === Функция повтора ОДНОГО трека ===
    repeatBtn.addEventListener('click', () => {
        isRepeatOne = !isRepeatOne;
        audio.loop = isRepeatOne; // Браузер сам повторяет трек при true
        repeatBtn.classList.toggle('active', isRepeatOne);
    });

    // Обновление прогресс бара и времени
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = `${percent}%`;
        progressKnob.style.left = `calc(${percent}% - 6px)`; // Центрируем ручку
        currentTimeText.textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
        totalTimeText.textContent = formatTime(audio.duration);
    });

    // Seek logic (клик по прогресс бару)
    progressContainer.addEventListener('click', (e) => {
        if (!audio.src) return;
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const containerWidth = rect.width;
        const seekTime = (clickX / containerWidth) * audio.duration;
        audio.currentTime = seekTime;
    });

    // Управление громкостью
    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
    });

    // Загрузка файла
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Визуальный фидбек
            currentTrackName.textContent = `Uploading: ${file.name}...`;

            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                currentTrackName.textContent = `Upload successful!`;
                await fetchLibrary();
            } else {
                const err = await response.json();
                alert(`Upload failed: ${err.error}`);
                currentTrackName.textContent = `Upload failed.`;
            }
        } catch (error) {
            console.error('Upload error:', error);
            currentTrackName.textContent = `Error connecting to server.`;
        } finally {
            fileInput.value = ''; 
        }
    });

    // Инициализация
    fetchLibrary();
});