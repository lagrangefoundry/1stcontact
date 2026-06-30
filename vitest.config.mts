import { getViteConfig } from 'astro/config'

// Astro's `getViteConfig` wires the `.astro` transform plugin into Vitest so
// framework module components can be imported and rendered via the container
// API. Plain `.ts` UATs (site-schema, naming) are unaffected.
export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
  },
})
