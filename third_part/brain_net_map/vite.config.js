import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'
import {resolve} from 'path'
import load_data from "./load_data.js";


// https://vitejs.dev/config/
// let p = resolve(new URL('.', import.meta.url).pathname,'src')
// console.log(p)
export default defineConfig({
    plugins: [load_data()],
    // root: resolve(new URL('.', import.meta.url).pathname,'src'),
})
