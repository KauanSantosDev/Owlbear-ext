// vite.config.js
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'public/manifest.json',
                    dest: '' // Isso vai copiar para a raiz do dist/
                }
            ]
        })
    ]
});
