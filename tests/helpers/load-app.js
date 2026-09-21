import fs from 'node:fs';
import path from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const root = path.resolve(import.meta.dirname, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

export async function loadApp(savedFavorites = null) {
    const page = html.replace('<script src="script.js"></script>', `<script>${script}</script>`);
    const virtualConsole = new VirtualConsole();

    const dom = new JSDOM(page, {
        url: 'http://localhost/',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        virtualConsole,
        beforeParse(window) {
            if (savedFavorites !== null) {
                window.localStorage.setItem('catFavorites', savedFavorites);
            }

            Object.defineProperty(window.HTMLMediaElement.prototype, 'paused', {
                configurable: true,
                get() {
                    return this.__isPaused ?? true;
                }
            });

            window.HTMLMediaElement.prototype.play = function () {
                this.__isPaused = false;
                return Promise.resolve();
            };
            window.HTMLMediaElement.prototype.pause = function () {
                this.__isPaused = true;
            };
            window.HTMLMediaElement.prototype.load = function () {};
        }
    });

    if (dom.window.document.readyState !== 'complete') {
        await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
    }

    return dom;
}
