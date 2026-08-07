import { mountBuilder } from './app.js'
import { fetchSites, publishSite } from './api.js'
import { mountL1EditBridge } from '/framework/edit-client.js'
import { formatL1Path, L1_EDIT_PAGE_ATTR } from '/framework/site-schema-edit.js'

/**
 * Browser entry point. Kept separate from `app.js` so the composition can be
 * mounted with injected dependencies (tests, and later a server-rendered
 * bootstrap) without this module's fetch-on-load side effect.
 *
 * THE EDIT BRIDGE IS IMPORTED HERE AND NOWHERE ELSE. Those two URLs are served
 * by the builder origin, which type-strips the TypeScript sources in
 * `packages/framework` and `packages/site-schema` on the way out — so the
 * browser runs the SAME bridge the renderer's stamp was designed against, with
 * no second hand-written copy free to drift from the markup it reads.
 *
 * They are absolute URLs, which only a browser can resolve. That is exactly why
 * they live in this file: `main.js` is the one module nothing but the browser
 * loads, so no test, bundler or typechecker ever has to resolve them.
 */
const root = document.getElementById('app')
const sites = await fetchSites()

mountBuilder(root, {
  sites,
  publish: (slug) => publishSite(slug),
  editBridge: { mountL1EditBridge, formatL1Path, L1_EDIT_PAGE_ATTR },
})
