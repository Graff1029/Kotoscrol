// --- 1. БАЗА ДАННЫХ МАТЕРИАЛОВ ---
const mediaItems = [];

// Динамически добавляем 22 видео (cat1.mp4 ... cat22.mp4)
for (let i = 1; i <= 22; i++) {
    mediaItems.push({ 
        id: i, 
        type: "video", 
        src: `assets/videos/cat${i}.mp4`, 
        title: `Котик ${i}` 
    });
}

// Динамически добавляем 4 фото для примера
for (let i = 1; i <= 4; i++) {
    mediaItems.push({ 
        id: 4 + i, 
        type: "image", 
        src: `assets/photos/cat${i}.jpg`, 
        title: `Фото ${i}` 
    });
}

// --- 2. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И НАСТРОЙКИ ---
let currentIndex = 0;
let favorites = JSON.parse(localStorage.getItem('catFavorites')) || [];
const carousel = document.getElementById('carousel');
let globalFeedMuted = true;

const heartIcon = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
const soundOnIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
const soundOffIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

// --- Функция случайного свечения ---
function randomizeGlow() {
    const colors = [
        'rgba(255, 0, 0, 0.4)',   // Красный
        'rgba(0, 255, 0, 0.4)',   // Зеленый
        'rgba(0, 0, 255, 0.4)'    // Синий
    ];
    
    for (let i = 1; i <= 2; i++) {
        const glow = document.querySelector(`.glow-${i}`);
        if (glow) {
            const size = Math.floor(Math.random() * 40 + 40); // от 40vw до 80vw
            const top = Math.floor(Math.random() * 100 - 20); // от -20% до 80%
            const left = Math.floor(Math.random() * 100 - 20); // от -20% до 80%
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            glow.style.width = `${size}vw`;
            glow.style.height = `${size}vw`;
            glow.style.top = `${top}%`;
            glow.style.left = `${left}%`;
            glow.style.background = `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`;
        }
    }
}

// --- 3. ИНИЦИАЛИЗАЦИЯ И ВКЛАДКИ ---
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initCarousel();
    renderFavorites();
    randomizeGlow(); // Стартовое свечение
});

function initTabs() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabs = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'feed') {
                updateCarouselPositions();
            } else {
                pauseAllCarouselVideos();
                // Останавливаем видео в избранном
                document.querySelectorAll('#fav-grid video').forEach(v => v.pause());
                // Останавливаем видео победителя при переходе на другую вкладку
                const winnerContainer = document.getElementById('battle-winner');
                if (winnerContainer) {
                    winnerContainer.querySelectorAll('video').forEach(v => v.pause());
                }
            }
            if (tabId === 'battle' && tournamentVideos.length === 0) {
                startTournament();
            }
        });
    });
}

window.handleMediaError = function(element) {
    const parent = element.parentElement;
    element.style.display = 'none';
    if (!parent.querySelector('.error-fallback')) {
        const fallback = document.createElement('div');
        fallback.className = 'error-fallback';
        fallback.innerHTML = '<span>Файл не найден<br>Добавьте его в папку assets</span>';
        parent.appendChild(fallback);
    }
};

// --- 4. ЛЕНТА (КАРУСЕЛЬ) ---
let cards = [];
let isDragging = false;
let startX = 0;
let currentTranslate = 0;

function initCarousel() {
    carousel.innerHTML = '';
    if (mediaItems.length === 0) {
        carousel.innerHTML = '<div class="empty-state">Нет материалов</div>';
        return;
    }

    mediaItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'media-card hidden-card';
        card.dataset.index = index;
        
        let mediaHtml = '';
        if (item.type === 'video') {
            mediaHtml = `<video class="media-content" src="${item.src}" loop playsinline onerror="handleMediaError(this)"></video>
                         <button class="play-pause-btn">&#9658;</button>`;
        } else {
            mediaHtml = `<img class="media-content" src="${item.src}" alt="${item.title}" onerror="handleMediaError(this)">`;
        }

        const isFav = favorites.some(fav => fav.id === item.id);
        
        card.innerHTML = `
            ${mediaHtml}
            <div class="card-info">
                <div class="card-text">
                    <span class="card-title">${item.title}</span>
                    <span class="card-id">#${item.id}</span>
                </div>
                <div class="card-actions">
                    ${item.type === 'video' ? `<button class="icon-btn mute-btn" title="Включить звук">${soundOffIcon}</button>` : ''}
                    <button class="icon-btn fav-btn ${isFav ? 'active' : ''}" title="В избранное" data-id="${item.id}">${heartIcon}</button>
                </div>
            </div>
        `;

        const favBtn = card.querySelector('.fav-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(item, favBtn);
        });

        if (item.type === 'video') {
            const muteBtn = card.querySelector('.mute-btn');
            const video = card.querySelector('video');
            video.muted = true;
            
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                globalFeedMuted = !globalFeedMuted;
                video.muted = globalFeedMuted;
                muteBtn.innerHTML = globalFeedMuted ? soundOffIcon : soundOnIcon;
            });

            card.addEventListener('click', (e) => {
                if (!e.target.closest('button') && card.classList.contains('center')) {
                    if (video.paused) {
                        video.play();
                        card.classList.remove('paused');
                    } else {
                        video.pause();
                        card.classList.add('paused');
                    }
                }
            });
        }

        card.addEventListener('mousedown', dragStart);
        card.addEventListener('touchstart', dragStart, {passive: true});

        carousel.appendChild(card);
        cards.push(card);
    });

    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('mousemove', dragAction);
    document.addEventListener('touchmove', dragAction, {passive: false});

    document.getElementById('prev-btn').addEventListener('click', () => { moveCarousel(-1); randomizeGlow(); });
    document.getElementById('next-btn').addEventListener('click', () => { moveCarousel(1); randomizeGlow(); });
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('feed').classList.contains('active')) {
            if (e.key === 'ArrowLeft') { moveCarousel(-1); randomizeGlow(); }
            if (e.key === 'ArrowRight') { moveCarousel(1); randomizeGlow(); }
        }
    });

    updateCarouselPositions();
}

function getIndex(offset) {
    let index = (currentIndex + offset) % cards.length;
    if (index < 0) index += cards.length;
    return index;
}

function updateCarouselPositions() {
    cards.forEach((c, idx) => {
        const video = c.querySelector('video');
        if (video) {
            video.pause();
            c.classList.remove('paused');
            if (idx !== currentIndex) {
                video.currentTime = 0; 
                video.muted = true;
            }
        }
        c.className = 'media-card hidden-card';
        c.style.transform = '';
    });

    const centerCard = cards[currentIndex];
    const leftCard = cards[getIndex(-1)];
    const rightCard = cards[getIndex(1)];

    centerCard.className = 'media-card center';
    leftCard.className = 'media-card left';
    rightCard.className = 'media-card right';

    const centerVideo = centerCard.querySelector('video');
    if (centerVideo) {
        centerVideo.currentTime = 0;
        centerVideo.muted = globalFeedMuted;
        
        const muteBtn = centerCard.querySelector('.mute-btn');
        if (muteBtn) {
            muteBtn.innerHTML = globalFeedMuted ? soundOffIcon : soundOnIcon;
        }
        
        centerVideo.play().catch(e => console.log('Autoplay prevented'));
    }
}

function moveCarousel(direction) {
    currentIndex = getIndex(direction);
    updateCarouselPositions();
}

function pauseAllCarouselVideos() {
    cards.forEach(c => {
        const v = c.querySelector('video');
        if (v) v.pause();
    });
}

function dragStart(e) {
    const card = e.currentTarget;
    if (!card.classList.contains('center')) return;
    isDragging = true;
    startX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    card.style.transition = 'none';
}

function dragAction(e) {
    if (!isDragging) return;
    const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    currentTranslate = currentX - startX;
    if(e.type.includes('touch') && Math.abs(currentTranslate) > 10) e.preventDefault(); 

    const centerCard = cards[currentIndex];
    const rotation = currentTranslate * 0.05;
    centerCard.style.transform = `translateX(${currentTranslate}px) scale(1) rotate(${rotation}deg)`;
}

function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    
    const centerCard = cards[currentIndex];
    centerCard.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';

    if (currentTranslate < -100) {
        moveCarousel(1);
        randomizeGlow();
    } else if (currentTranslate > 100) {
        moveCarousel(-1);
        randomizeGlow();
    } else {
        centerCard.style.transform = '';
    }
    currentTranslate = 0;
}


// --- 5. КОРОЛЕВСКАЯ БИТВА ---
let tournamentVideos = [];
let currentRoundQueue = [];
let nextRoundQueue = [];
let currentRoundNum = 1;
let videoStats = {};

const battleArena = document.getElementById('battle-arena');
const battleActive = document.getElementById('battle-active');
const battleResults = document.getElementById('battle-results');
const roundTitle = document.getElementById('battle-round-title');
const progressText = document.getElementById('battle-progress');

document.getElementById('restart-battle-btn').addEventListener('click', startTournament);

function startTournament() {
    // ОЧИСТКА: Полностью убиваем видео победителя, чтобы звук не остался на фоне
    const winnerContainer = document.getElementById('battle-winner');
    if (winnerContainer) {
        winnerContainer.querySelectorAll('video').forEach(v => {
            v.pause();
            v.src = '';
            v.removeAttribute('src');
            v.load();
        });
        winnerContainer.innerHTML = '';
    }

    tournamentVideos = mediaItems.filter(i => i.type === 'video');
    if (tournamentVideos.length < 2) {
        battleArena.innerHTML = '<p>Недостаточно видео для турнира (нужно минимум 2)</p>';
        return;
    }

    tournamentVideos.sort(() => Math.random() - 0.5);
    videoStats = {};
    tournamentVideos.forEach(v => { videoStats[v.id] = { wins: 0, reachedRound: 1, item: v }; });

    currentRoundQueue = [...tournamentVideos];
    nextRoundQueue = [];
    currentRoundNum = 1;
    
    battleActive.classList.remove('hidden');
    battleResults.classList.add('hidden');
    
    setupNextPair();
}

function setupNextPair() {
    // ОЧИСТКА: Перед удалением полностью останавливаем старые видео пары
    battleArena.querySelectorAll('video').forEach(v => {
        v.pause();
        v.src = ''; 
        v.removeAttribute('src');
        v.load();
    });
    battleArena.innerHTML = '';

    if (currentRoundQueue.length === 1) {
        const autoWin = currentRoundQueue.pop();
        nextRoundQueue.push(autoWin);
    }

    if (currentRoundQueue.length === 0) {
        if (nextRoundQueue.length === 1) {
            showTournamentResults(nextRoundQueue[0]);
            return;
        }
        currentRoundQueue = [...nextRoundQueue];
        nextRoundQueue = [];
        currentRoundNum++;
        currentRoundQueue.forEach(v => { videoStats[v.id].reachedRound = currentRoundNum; });
    }

    const v1 = currentRoundQueue.pop();
    const v2 = currentRoundQueue.pop();

    roundTitle.textContent = `Раунд ${currentRoundNum}`;
    const totalRemaining = currentRoundQueue.length + nextRoundQueue.length + 2;
    progressText.textContent = `Осталось претендентов: ${totalRemaining}`;

    const card1 = createBattleCard(v1);
    const card2 = createBattleCard(v2);

    battleArena.appendChild(card1);
    battleArena.appendChild(card2);

    const vid1 = card1.querySelector('video');
    const vid2 = card2.querySelector('video');

    // ЗВУК ПРИ НАВЕДЕНИИ МЫШИ (Hover)
    card1.addEventListener('mouseenter', () => {
        card1.classList.add('hover-target');
        card2.classList.add('dimmed-target');
        if(vid1) vid1.muted = false;
    });
    card1.addEventListener('mouseleave', () => {
        card1.classList.remove('hover-target');
        card2.classList.remove('dimmed-target');
        if(vid1) vid1.muted = true;
    });

    card2.addEventListener('mouseenter', () => {
        card2.classList.add('hover-target');
        card1.classList.add('dimmed-target');
        if(vid2) vid2.muted = false;
    });
    card2.addEventListener('mouseleave', () => {
        card2.classList.remove('hover-target');
        card1.classList.remove('dimmed-target');
        if(vid2) vid2.muted = true;
    });

    // Обработка выбора
    card1.addEventListener('click', () => {
        handleBattleChoice(card1, card2, v1);
    });
    card2.addEventListener('click', () => {
        handleBattleChoice(card2, card1, v2);
    });
}

function createBattleCard(item) {
    const div = document.createElement('div');
    div.className = 'battle-card';
    div.innerHTML = `<video src="${item.src}" autoplay loop muted playsinline onerror="handleMediaError(this)"></video>`;
    return div;
}

function handleBattleChoice(winnerCard, loserCard, winnerItem) {
    randomizeGlow(); // Меняем фон при выборе

    winnerCard.style.pointerEvents = 'none';
    loserCard.style.pointerEvents = 'none';

    // СРАЗУ ВЫКЛЮЧАЕМ ЗВУК У ОБОИХ ВИДЕО, чтобы он не звучал во время анимации или после неё
    const wVid = winnerCard.querySelector('video');
    const lVid = loserCard.querySelector('video');
    if (wVid) wVid.muted = true;
    if (lVid) lVid.muted = true;

    winnerCard.classList.remove('hover-target');
    loserCard.classList.remove('dimmed-target');
    winnerCard.classList.add('winner-anim');
    loserCard.classList.add('loser-anim');

    videoStats[winnerItem.id].wins++;
    nextRoundQueue.push(winnerItem);

    setTimeout(() => {
        setupNextPair();
    }, 800);
}

function showTournamentResults(winner) {
    randomizeGlow(); // Меняем фон на результатах

    battleActive.classList.add('hidden');
    battleResults.classList.remove('hidden');

    const winnerContainer = document.getElementById('battle-winner');
    // Звук у победителя включаем автоматически (muted = false)
    winnerContainer.innerHTML = `<video src="${winner.src}" autoplay loop playsinline onerror="handleMediaError(this)"></video>`;
    
    const winVid = winnerContainer.querySelector('video');
    if(winVid) {
        winVid.muted = false;
        winVid.play().catch(e => console.log('Autoplay sound prevented:', e));
    }

    const sortedStats = Object.values(videoStats).sort((a, b) => {
        if (b.reachedRound !== a.reachedRound) return b.reachedRound - a.reachedRound;
        return b.wins - a.wins;
    });

    const top5 = sortedStats.slice(0, 5);
    const list = document.getElementById('battle-top-list');
    list.innerHTML = '';
    
    top5.forEach((stat, index) => {
        const li = document.createElement('li');
        let medal = '';
        if(index === 0) medal = '🥇 ';
        if(index === 1) medal = '🥈 ';
        if(index === 2) medal = '🥉 ';
        li.textContent = `${medal}${stat.item.title} (Раунд: ${stat.reachedRound}, Побед: ${stat.wins})`;
        list.appendChild(li);
    });
}

// --- 6. ИЗБРАННОЕ И РАБОТА С LOCALSTORAGE ---
function toggleFavorite(item, btnElement) {
    const index = favorites.findIndex(fav => fav.id === item.id);
    if (index === -1) {
        favorites.push(item);
        btnElement.classList.add('active');
    } else {
        favorites.splice(index, 1);
        btnElement.classList.remove('active');
    }
    localStorage.setItem('catFavorites', JSON.stringify(favorites));
    renderFavorites(); 
}

function renderFavorites() {
    const grid = document.getElementById('fav-grid');
    const emptyState = document.getElementById('fav-empty');
    
    // Останавливаем старые видео перед очисткой
    grid.querySelectorAll('video').forEach(v => {
        v.pause();
        v.src = '';
    });
    grid.innerHTML = '';

    if (favorites.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        document.getElementById('go-to-feed-btn').onclick = () => {
            document.querySelector('.nav-btn[data-tab="feed"]').click();
        };
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    favorites.forEach(item => {
        const card = document.createElement('div');
        card.className = 'fav-card';
        
        let mediaHtml = item.type === 'video' 
            ? `<video class="media-content" src="${item.src}" loop muted playsinline onerror="handleMediaError(this)"></video>`
            : `<img class="media-content" src="${item.src}" alt="${item.title}" onerror="handleMediaError(this)">`;

        card.innerHTML = `
            ${mediaHtml}
            <div class="fav-card-info">
                <span class="fav-card-title">${item.title}</span>
                <div class="fav-actions">
                    ${item.type === 'video' ? `<button class="floating-fav-mute" title="Звук">${soundOffIcon}</button>` : ''}
                    <button class="remove-fav-btn" title="Удалить">&times;</button>
                </div>
            </div>
        `;

        const removeBtn = card.querySelector('.remove-fav-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            card.style.opacity = '0';
            setTimeout(() => {
                const carouselBtn = document.querySelector(`.fav-btn[data-id="${item.id}"]`);
                if (carouselBtn) carouselBtn.classList.remove('active');
                toggleFavorite(item, document.createElement('div')); 
            }, 300);
        });

        // Кнопка звука в избранном
        if (item.type === 'video') {
            const muteBtn = card.querySelector('.floating-fav-mute');
            const video = card.querySelector('video');
            muteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                video.muted = !video.muted;
                muteBtn.innerHTML = video.muted ? soundOffIcon : soundOnIcon;
            });
        }

        card.addEventListener('click', () => {
            randomizeGlow(); // Меняем фон при клике
            if (item.type === 'video') {
                const v = card.querySelector('video');
                if (v.paused) {
                    // Останавливаем остальные видео в сетке
                    document.querySelectorAll('#fav-grid video').forEach(otherV => {
                        if (otherV !== v) {
                            otherV.pause();
                        }
                    });
                    v.play();
                } else {
                    v.pause();
                }
            } else {
                openPhotoViewer(item.src);
            }
        });

        grid.appendChild(card);
    });
}

// --- 7. ПРОСМОТРЩИК ФОТО ---
const viewer = document.getElementById('photo-viewer');
const viewerImg = document.getElementById('viewer-img');
const closeViewerBtn = document.getElementById('close-viewer');

function openPhotoViewer(src) {
    viewerImg.src = src;
    viewer.classList.remove('hidden');
}

closeViewerBtn.addEventListener('click', () => {
    viewer.classList.add('hidden');
    viewerImg.src = '';
});
viewer.addEventListener('click', (e) => {
    if (e.target === viewer) {
        viewer.classList.add('hidden');
    }
});
