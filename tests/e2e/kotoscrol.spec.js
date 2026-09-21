import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
});

test('сайт открывается и показывает всю ленту', async ({ page }) => {
    await expect(page).toHaveTitle('Котоскролл');
    await expect(page.locator('.media-card')).toHaveCount(26);
    await expect(page.locator('.media-card.center .card-title')).toHaveText('Котик 1');
});

test('карусель управляется кнопками и клавиатурой', async ({ page }) => {
    await page.locator('#next-btn').click();
    await expect(page.locator('.media-card.center .card-title')).toHaveText('Котик 2');

    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.media-card.center .card-title')).toHaveText('Котик 3');

    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('.media-card.center .card-title')).toHaveText('Котик 2');
});

test('карусель перелистывается перетаскиванием мышью', async ({ page }) => {
    const card = page.locator('.media-card.center');
    const box = await card.boundingBox();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 160, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();

    await expect(page.locator('.media-card.center .card-title')).toHaveText('Котик 2');
});

test('избранное сохраняется после перезагрузки', async ({ page }) => {
    await page.evaluate(() => document.querySelector('.media-card.center .fav-btn').click());
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('catFavorites')).length)).toBe(1);
    await page.reload();
    await page.locator('[data-tab="fav"]').click();

    await expect(page.locator('#fav-grid .fav-card')).toHaveCount(1);
    await expect(page.locator('#fav-grid .fav-card-title')).toHaveText('Котик 1');
});

test('королевская битва создаёт пару участников', async ({ page }) => {
    await page.locator('[data-tab="battle"]').click();

    await expect(page.locator('.battle-card')).toHaveCount(2);
    await expect(page.locator('#battle-progress')).toContainText('22');
    await page.locator('.battle-card').first().click();
    await expect(page.locator('.battle-card').first()).toHaveClass(/winner-anim/);
});

test('просмотр фотографии открывается и закрывается', async ({ page }) => {
    await page.evaluate(() => {
        localStorage.setItem('catFavorites', JSON.stringify([
            { id: 23, type: 'image', src: 'assets/photos/cat1.jpg', title: 'Фото 1' }
        ]));
    });
    await page.reload();
    await page.locator('[data-tab="fav"]').click();
    await page.locator('#fav-grid .fav-card').click();

    await expect(page.locator('#photo-viewer')).toBeVisible();
    await page.locator('#close-viewer').click();
    await expect(page.locator('#photo-viewer')).toBeHidden();
});

test('мобильная версия перестраивает шапку', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();

    await expect(page.locator('.header')).toHaveCSS('flex-direction', 'column');
    await expect(page.locator('.media-card.center')).toBeVisible();
});
