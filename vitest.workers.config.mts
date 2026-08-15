import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

/**
 * The workerd project — tests that must run where the code will run.
 *
 * The store (site definitions in D1, asset bytes in R2) is only meaningfully
 * proved against real bindings inside the Workers runtime; a hand-written fake
 * proves the fake. `@cloudflare/vitest-pool-workers` boots workerd via Miniflare
 * and hands each test the bindings through `import { env } from 'cloudflare:test'`.
 *
 * Bindings mirror the deployed shape rather than inventing names:
 *   SITES — the R2 bucket `1c deploy` publishes rendered snapshots to
 *           (apps/public-site/wrangler.toml).
 *   DB    — the D1 database the store port will use. No Worker declares it yet;
 *           this is where it gets declared first, which is the point of the
 *           ticket.
 *
 * `compatibilityDate`/`compatibilityFlags` copy the apps' wrangler.toml so the
 * test runtime is the production runtime, not a newer one that would let a test
 * pass on behaviour the deployed Worker does not have.
 *
 * The pool version is pinned exactly (0.18.5, not ^0.18.5) on purpose: each
 * release pins an exact miniflare, and therefore an exact workerd, whose
 * platform binary must actually be installable under this workspace's
 * supply-chain policy. A caret silently picks a release whose workerd binary is
 * still withheld, and the failure surfaces as a postinstall error rather than as
 * a resolution one.
 */
export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: '2025-07-01',
        compatibilityFlags: ['nodejs_compat'],
        d1Databases: ['DB'],
        r2Buckets: ['SITES'],
      },
    }),
  ],
  test: {
    name: 'workers',
    // The whole routing convention (see vitest.config.mts). Anything without the
    // `.workers` marker belongs to the node project — including every test that
    // touches a filesystem, which workerd does not have.
    include: ['tests/**/*.workers.test.ts'],
  },
})
