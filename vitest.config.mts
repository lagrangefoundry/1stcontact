import { defineConfig } from 'vitest/config'

/**
 * The root config is an orchestrator, not a suite.
 *
 * Two runtimes have to be tested and one Vitest pool cannot serve both. Most of
 * the suite drives the generator against a real filesystem, which workerd does
 * not have. The store work needs real D1 and R2 bindings, which only exist
 * inside workerd via `@cloudflare/vitest-pool-workers` — its own pool. So the
 * two live in sibling project configs and this file only composes them.
 *
 * (The node side used to need Astro's `.astro` transform as well, which is why
 * its config was Astro's rather than plain Vite's. REQ-148 removed the last
 * `.astro` file and REQ-150 removed Astro; the filesystem is what keeps the
 * split honest now.)
 *
 * ROUTING, stated once: a test file named `*.workers.test.ts` runs in the
 * workerd project; every other `*.test.ts` runs in the node project. The
 * suffix is the whole convention — there is no per-file opt-in comment and no
 * directory split, so a file's runtime is legible from its name alone.
 *
 * (lagrange-framework spells the same split the other way round — `*.node.test.js`
 * marks the exception — because workerd is its default. Here node is, so the
 * marked side is workerd.)
 */
export default defineConfig({
  test: {
    projects: ['./vitest.node.config.mts', './vitest.workers.config.mts'],
  },
})
