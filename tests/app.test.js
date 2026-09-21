import { afterEach, describe, expect, test } from 'vitest';
import { loadApp } from './helpers/load-app.js';

let dom;

afterEach(() => {
    dom?.window.close();
    dom = null;
});

function centerTitle(document) {
    return document.querySelector('.media-card.center .card-title')?.textContent;
}

describe('Лента и навигация', () => {
    test('создаёт 26 карточек', async () => {
        dom = await loadApp();
        const { document } = dom.window;

        expect(document.querySelectorAll('.media-card')).toHaveLength(26);
    });

    test('правильно размещает первые три карточки', async () => {
        dom = await loadApp();
        const { document } = dom.window;

        expect(document.querySelectorAll('.media-card.center')).toHaveLength(1);
        expect(document.querySelectorAll('.media-card.left')).toHaveLength(1);
        expect(document.querySelectorAll('.media-card.right')).toHaveLength(1);
        expect(centerTitle(document)).toBe('Котик 1');
    });

    test('стрелки листают карусель по кругу', async () => {
        dom = await loadApp();
        const { document } = dom.window;

        document.getElementById('prev-btn').click();
        expect(centerTitle(document)).toBe('Фото 4');

        document.getElementById('next-btn').click();
        expect(centerTitle(document)).toBe('Котик 1');
    });

    test('клавиши работают только на вкладке ленты', async () => {
        dom = await loadApp();
        const { document, KeyboardEvent } = dom.window;

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(centerTitle(document)).toBe('Котик 2');

        document.querySelector('[data-tab="fav"]').click();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        document.querySelector('[data-tab="feed"]').click();
        expect(centerTitle(document)).toBe('Котик 2');
    });

    test('переключает вкладки и оставляет активной только одну', async () => {
        dom = await loadApp();
        const { document } = dom.window;

        document.querySelector('[data-tab="fav"]').click();
        expect(document.querySelector('.nav-btn.active').dataset.tab).toBe('fav');
        expect(document.querySelector('.tab-content.active').id).toBe('fav');
        expect(document.querySelectorAll('.tab-content.active')).toHaveLength(1);
    });
});

describe('Избранное и localStorage', () => {
    test('добавляет и удаляет карточку из избранного', async () => {
        dom = await loadApp();
        const { document, localStorage } = dom.window;
        const button = document.querySelector('.media-card.center .fav-btn');

        button.click();
        expect(button.classList.contains('active')).toBe(true);
        expect(JSON.parse(localStorage.getItem('catFavorites'))).toHaveLength(1);
        expect(document.querySelectorAll('#fav-grid .fav-card')).toHaveLength(1);

        button.click();
        expect(JSON.parse(localStorage.getItem('catFavorites'))).toHaveLength(0);
        expect(document.getElementById('fav-empty').classList.contains('hidden')).toBe(false);
    });

    test('видео и фото с разными id одновременно сохраняются в избранном', async () => {
        const items = [
            { id: 5, type: 'video', src: 'assets/videos/cat5.mp4', title: 'Котик 5' },
            { id: 23, type: 'image', src: 'assets/photos/cat1.jpg', title: 'Фото 1' }
        ];
        dom = await loadApp(JSON.stringify(items));
        const { document } = dom.window;

        expect(document.querySelectorAll('#fav-grid .fav-card')).toHaveLength(2);
        expect([...document.querySelectorAll('#fav-grid .fav-card-title')].map(item => item.textContent))
            .toEqual(['Котик 5', 'Фото 1']);
    });

    test('все карточки имеют уникальные id', async () => {
        dom = await loadApp();
        const ids = [...dom.window.document.querySelectorAll('.fav-btn')].map(button => button.dataset.id);
        expect(new Set(ids).size).toBe(26);
    });

    test('открывает фото и закрывает просмотр кнопкой', async () => {
        const photo = [{ id: 23, type: 'image', src: 'assets/photos/cat1.jpg', title: 'Фото 1' }];
        dom = await loadApp(JSON.stringify(photo));
        const { document } = dom.window;

        document.querySelector('[data-tab="fav"]').click();
        document.querySelector('#fav-grid .fav-card').click();
        expect(document.getElementById('photo-viewer').classList.contains('hidden')).toBe(false);
        expect(document.getElementById('viewer-img').getAttribute('src')).toBe(photo[0].src);

        document.getElementById('close-viewer').click();
        expect(document.getElementById('photo-viewer').classList.contains('hidden')).toBe(true);
        expect(document.getElementById('viewer-img').getAttribute('src')).toBe('');
    });

    test('удаляет карточку из раздела избранного', async () => {
        const favorite = [{ id: 1, type: 'video', src: 'assets/videos/cat1.mp4', title: 'Котик 1' }];
        dom = await loadApp(JSON.stringify(favorite));
        const { document } = dom.window;
        dom.window.setTimeout = callback => {
            callback();
            return 1;
        };

        document.querySelector('[data-tab="fav"]').click();
        document.querySelector('#fav-grid .remove-fav-btn').click();

        expect(document.querySelectorAll('#fav-grid .fav-card')).toHaveLength(0);
        expect(document.getElementById('fav-empty').classList.contains('hidden')).toBe(false);
        expect(JSON.parse(dom.window.localStorage.getItem('catFavorites'))).toEqual([]);
    });
});

describe('Медиа и турнир', () => {
    test('переключает звук центрального видео', async () => {
        dom = await loadApp();
        const { document } = dom.window;
        const card = document.querySelector('.media-card.center');
        const video = card.querySelector('video');

        expect(video.muted).toBe(true);
        card.querySelector('.mute-btn').click();
        expect(video.muted).toBe(false);
        card.querySelector('.mute-btn').click();
        expect(video.muted).toBe(true);
    });

    test('показывает понятную заглушку при ошибке загрузки', async () => {
        dom = await loadApp();
        const { document } = dom.window;
        const media = document.querySelector('.media-card.center .media-content');

        dom.window.handleMediaError(media);
        dom.window.handleMediaError(media);
        expect(media.style.display).toBe('none');
        expect(media.parentElement.querySelectorAll('.error-fallback')).toHaveLength(1);
    });

    test('запускает королевскую битву и принимает выбор', async () => {
        dom = await loadApp();
        const { document } = dom.window;

        document.querySelector('[data-tab="battle"]').click();
        const cards = document.querySelectorAll('.battle-card');
        expect(cards).toHaveLength(2);
        expect(document.getElementById('battle-progress').textContent).toContain('22');

        cards[0].dispatchEvent(new dom.window.MouseEvent('mouseenter', { bubbles: true }));
        expect(cards[0].classList.contains('hover-target')).toBe(true);
        expect(cards[1].classList.contains('dimmed-target')).toBe(true);

        cards[0].click();
        expect(cards[0].classList.contains('winner-anim')).toBe(true);
        expect(cards[1].classList.contains('loser-anim')).toBe(true);
    });

    test('доводит турнир до победителя и формирует топ-5', async () => {
        dom = await loadApp();
        const { document } = dom.window;
        dom.window.setTimeout = callback => {
            callback();
            return 1;
        };

        document.querySelector('[data-tab="battle"]').click();
        let choices = 0;
        while (document.getElementById('battle-results').classList.contains('hidden') && choices < 30) {
            document.querySelector('.battle-card').click();
            choices++;
        }

        expect(choices).toBe(21);
        expect(document.getElementById('battle-results').classList.contains('hidden')).toBe(false);
        expect(document.querySelector('#battle-winner video')).not.toBeNull();
        expect(document.querySelectorAll('#battle-top-list li')).toHaveLength(5);
    });

    test('случайное свечение получает допустимые размеры и координаты', async () => {
        dom = await loadApp();
        const { document } = dom.window;

        for (const glow of document.querySelectorAll('.glow')) {
            const size = Number.parseInt(glow.style.width, 10);
            const top = Number.parseInt(glow.style.top, 10);
            const left = Number.parseInt(glow.style.left, 10);
            expect(size).toBeGreaterThanOrEqual(40);
            expect(size).toBeLessThanOrEqual(79);
            expect(top).toBeGreaterThanOrEqual(-20);
            expect(top).toBeLessThanOrEqual(79);
            expect(left).toBeGreaterThanOrEqual(-20);
            expect(left).toBeLessThanOrEqual(79);
        }
    });
});
