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
 *   BLOBS — the ticket store's attachment bucket (REQ-162). A SECOND bucket,
 *           not a prefix in SITES, because its contents are the client's
 *           private material and SITES is bound by the Worker that serves the
 *           public internet. Declaring it separately here is what lets the
 *           attachment UATs prove isolation against real R2 rather than a map.
 *   DB    — the D1 database the store port will use. No Worker declares it yet;
 *           this is where it gets declared first, which is the point of the
 *           ticket.
 *   IMAGES — Cloudflare Images ([[REQ-222]]), what a publish builds a picture's
 *           delivery width ladder with. Miniflare backs it locally with `sharp`,
 *           so a UAT can publish a REAL photograph and assert the widths that
 *           came out rather than the widths a fake was told to return.
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
      /**
       * THE ENTRY THE DEPLOYED WORKER USES, named here for ONE reason
       * ([[REQ-307]]): a Durable Object binding resolves its `className` against
       * the main module's exports, and `SessionJunction` is exported from
       * `worker.ts`. Pointing this at a test-only module that re-exported the
       * class would run the suites against a second assembly of this Worker —
       * the shape wrangler builds is the shape the junction UATs should prove.
       *
       * It changes nothing for the suites that do not use it: every test here
       * imports the module it exercises directly and calls it, exactly as before.
       */
      main: './apps/control-app/src/worker.ts',
      miniflare: {
        compatibilityDate: '2025-07-01',
        compatibilityFlags: ['nodejs_compat'],
        d1Databases: ['DB'],
        r2Buckets: ['SITES', 'BLOBS'],
        // IMAGES — the renderer an edit recipe is applied by (REQ-219).
        //
        // Locally this is Miniflare's own implementation over `sharp`, and it is
        // a THIRD of the real one: it honours `rotate`, `width` and `height` and
        // silently drops trim, gravity and every colour adjustment. That is why
        // `compileRecipe` is a pure function asserted directly — a suite that
        // cropped and compared pixels here would pass against an uncropped
        // image, which is worse than no suite at all. What these bindings do
        // prove is the half the local renderer really performs, against the real
        // binding API rather than a hand-written stand-in of it.
        //
        // REQ-222 uses the SAME binding for a publish's delivery width ladder,
        // and that half the local renderer does perform faithfully — `width` is
        // one of the three verbs it honours — so a UAT can publish a real
        // photograph and assert the widths that actually came out.
        images: { binding: 'IMAGES' },
        // SESSION_JUNCTION — the live junction, made durable ([[REQ-307]]).
        //
        // A REAL DURABLE OBJECT AND NOT A STAND-IN, which is the whole reason
        // these UATs run in this project rather than the node one. What is under
        // test is that a turn's records survive the isolate that wrote them, and
        // a hand-written fake for the thing that is supposed to be durable would
        // prove the fake. Miniflare gives the class its own SQLite, so `since`,
        // `append` and `replace` are exercised against the API the deployed
        // object has.
        // `useSQLite` IS THE `new_sqlite_classes` MIGRATION, said here.
        // `ctx.storage.sql` is the whole reason a Durable Object can satisfy the
        // junction's synchronous port at all, and a class provisioned without it
        // throws on the first statement — so the two declarations have to agree,
        // and a suite that ran on key-value storage would prove nothing about the
        // object this repository deploys.
        durableObjects: {
          SESSION_JUNCTION: { className: 'SessionJunction', useSQLite: true },
        },
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
