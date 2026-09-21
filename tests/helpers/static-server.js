import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const types = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.mp4': 'video/mp4',
    '.png': 'image/png'
};

http.createServer((request, response) => {
    const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relativePath = urlPath === '/' ? 'index.html' : urlPath.slice(1);
    const file = path.resolve(root, relativePath);

    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        response.writeHead(404);
        response.end('Not found');
        return;
    }

    const stat = fs.statSync(file);
    const commonHeaders = {
        'Accept-Ranges': 'bytes',
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store'
    };
    const range = request.headers.range;

    if (range) {
        const match = /bytes=(\d+)-(\d*)/.exec(range);
        const start = Number(match?.[1] ?? 0);
        const end = match?.[2] ? Number(match[2]) : stat.size - 1;
        response.writeHead(206, {
            ...commonHeaders,
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Content-Length': end - start + 1
        });
        fs.createReadStream(file, { start, end }).pipe(response);
        return;
    }

    response.writeHead(200, { ...commonHeaders, 'Content-Length': stat.size });
    fs.createReadStream(file).pipe(response);
}).listen(4173, '127.0.0.1');
