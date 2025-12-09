import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
    base,
    plugins: [
        react(),
        tailwindcss(),
    ],
})
