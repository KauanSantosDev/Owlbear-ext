import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'public/manifest.json',
                    dest: '' // isso vai copiar para a pasta raiz do dist
                }
            ]
        })
    ]
});
