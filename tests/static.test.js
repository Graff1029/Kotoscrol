import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const root = path.resolve(import.meta.dirname, '..');

describe('Файлы проекта', () => {
    test('основные файлы существуют и не пустые', () => {
        for (const name of ['index.html', 'style.css', 'script.js', 'README.txt']) {
            const file = path.join(root, name);
            expect(fs.existsSync(file), `${name} не найден`).toBe(true);
            expect(fs.statSync(file).size, `${name} пустой`).toBeGreaterThan(0);
        }
    });

    test('HTML подключает существующие CSS и JavaScript', () => {
        const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
        const links = [...html.matchAll(/(?:href|src)="([^"]+\.(?:css|js))"/g)].map(match => match[1]);

        expect(links).toEqual(['style.css', 'script.js']);
        links.forEach(link => expect(fs.existsSync(path.join(root, link))).toBe(true));
    });

    test('есть все 22 видео с правильной сигнатурой MP4', () => {
        for (let number = 1; number <= 22; number++) {
            const file = path.join(root, 'assets', 'videos', `cat${number}.mp4`);
            expect(fs.existsSync(file), `Нет cat${number}.mp4`).toBe(true);
            const header = fs.readFileSync(file).subarray(4, 8).toString('ascii');
            expect(header, `cat${number}.mp4 не похож на MP4`).toBe('ftyp');
        }
    });

    test('есть все 4 фотографии и они имеют допустимый формат', () => {
        for (let number = 1; number <= 4; number++) {
            const file = path.join(root, 'assets', 'photos', `cat${number}.jpg`);
            expect(fs.existsSync(file), `Нет cat${number}.jpg`).toBe(true);
            const header = fs.readFileSync(file).subarray(0, 8);
            const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
            const isPng = [...header].join(',') === '137,80,78,71,13,10,26,10';
            expect(isJpeg || isPng, `cat${number}.jpg не является изображением`).toBe(true);
        }
    });

    test('в HTML нет повторяющихся id', () => {
        const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
        const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
        expect(new Set(ids).size).toBe(ids.length);
    });
});
