import { defineConfig } from 'orval'
import { config } from 'dotenv'

config()

export default defineConfig({
  'files-storage': {
    input: `${process.env.VITE_API_BASE_URL || 'http://localhost:3000'}/docs/swagger.yml`,
    output: {
      target: './src/api/orval',
      mode: 'split',
      client: 'react-query',
    },
  },
})
