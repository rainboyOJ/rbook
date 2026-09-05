import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'
import {resolve, dirname} from 'path'
import {fileURLToPath} from 'url'
import {ViteEjsPlugin} from "vite-plugin-ejs";

import {menu_html} from './src/menu.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [ 
        ViteEjsPlugin({
            menu :{
                html:menu_html
            }
        })
    ],
    root: resolve(__dirname, 'src'),
    build: {
        outDir:'../dist'
    }
})
