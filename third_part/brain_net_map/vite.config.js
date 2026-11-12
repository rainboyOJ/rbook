import { defineConfig } from 'vite'
import loadData from './load_data.js'

export default defineConfig({ plugins: [loadData()] })
