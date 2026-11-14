import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

// トップのFAQ構造化データ（FAQPage）を、画面のFAQと同じ src/data/topFaqs.json から index.html に入れる（食い違い防止）
const topFaqJsonLd = () => ({
  name: 'top-faq-jsonld',
  transformIndexHtml(html: string) {
    const topFaqs: { q: string; a: string }[] = JSON.parse(readFileSync(new URL('./src/data/topFaqs.json', import.meta.url), 'utf-8'))
    const data = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: topFaqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    }
    return html.replace('<!--TOP_FAQ_JSONLD-->', `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n    </script>`)
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), topFaqJsonLd()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
})
