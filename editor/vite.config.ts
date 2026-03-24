import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import type { Plugin } from 'vite';

/** Serve files from the monorepo demo/ directory under /demo/ URL path */
function serveDemoFiles(): Plugin {
  const demoDir = path.resolve(__dirname, '../demo');
  return {
    name: 'serve-demo-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/demo/')) return next();
        const relPath = decodeURIComponent(req.url.slice('/demo/'.length).split('?')[0]);
        const filePath = path.join(demoDir, relPath);

        let stat: fs.Stats;
        try {
          stat = fs.statSync(filePath);
          if (!stat.isFile()) return next();
        } catch {
          return next();
        }

        const ext = path.extname(filePath).toLowerCase();
        const mime: Record<string, string> = {
          '.mp4': 'video/mp4', '.webm': 'video/webm',
          '.ogg': 'video/ogg', '.mov': 'video/quicktime',
        };
        const contentType = mime[ext] || 'application/octet-stream';
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunkSize = end - start + 1;

          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType,
          });
          fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
          });
          fs.createReadStream(filePath).pipe(res);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveDemoFiles()],
  server: {
    port: 3001,
    open: true,
    fs: {
      allow: ['..'],
    },
  },
});
