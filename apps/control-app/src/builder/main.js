import { mountBuilder } from './app.js'
import { fetchAiStatus, fetchBusinesses, publishSite } from './api.js'
import { loadOrSignOut } from './session.js'
import { mountL1EditBridge } from '/framework/edit-client.js'
import { formatL1Path, L1_EDIT_PAGE_ATTR } from '/framework/site-schema-edit.js'
import { shadeHex } from '/framework/site-schema-shade.js'

/**
 * Browser entry point. Kept separate from `app.js` so the composition can be
 * mounted with injected dependencies (tests, and later a server-rendered
 * bootstrap) without this module's fetch-on-load side effect.
 *
 * THE FRAMEWORK SOURCES ARE IMPORTED HERE AND NOWHERE ELSE. Those URLs are
 * served by the builder origin, which type-strips the TypeScript sources in
 * `packages/framework` and `packages/site-schema` on the way out — so the
 * browser runs the SAME bridge the renderer's stamp was designed against, and
 * the SAME shade arithmetic the render path resolves a palette reference
 * through (REQ-133), with no second hand-written copy free to drift.
 *
 * They are absolute URLs, which only a browser can resolve. That is exactly why
 * they live in this file: `main.js` is the one module nothing but the browser
 * loads, so no test, bundler or typechecker ever has to resolve them.
 */
const root = document.getElementById('app')
/**
 * IN PARALLEL, because neither answer depends on the other and the status call
 * gates what is drawn rather than what is fetched (REQ-173). Serialising them
 * would put a second round trip in front of the first paint for a question whose
 * answer is almost always "yes".
 *
 * THE SITE LIST IS NO LONGER ASKED FOR HERE ([[REQ-179]]). It was, and it could
 * not be: `/api/sites` is business-scoped, and which business is a question this
 * file cannot answer — the remembered selection lives in the shell's own
 * namespaced storage, which does not exist until the shell is mounted. So the
 * builder resolves its own scope and reads the sites of the business it settles
 * on, which is one round trip in the same place rather than two in two.
 */
/**
 * AND A REFUSED SESSION DRAWS A REASON RATHER THAN A BLANK PAGE ([[BUG-52]]).
 *
 * The decision is `loadOrSignOut`'s, in `session.js`, and not written here on
 * purpose: this file imports three modules by absolute URL that only a browser
 * can resolve, so anything decided in it is decided where no suite can reach.
 * What stays here is the wiring — which calls open the builder, and what is
 * mounted when they answer.
 */
const loaded = await loadOrSignOut(root, () =>
  Promise.all([fetchBusinesses(), fetchAiStatus()]),
)

if (loaded) {
  const [businesses, aiStatus] = loaded
  mountBuilder(root, {
    businesses: businesses.businesses,
    account: businesses.account,
    aiStatus,
    publish: (slug) => publishSite(slug),
    editBridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
    shadeHex,
  })
}
