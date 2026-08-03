import { mountBuilder } from './app.js'
import { fetchSites, publishSite } from './api.js'

/**
 * Browser entry point. Kept separate from `app.js` so the composition can be
 * mounted with injected dependencies (tests, and later a server-rendered
 * bootstrap) without this module's fetch-on-load side effect.
 */
const root = document.getElementById('app')
const sites = await fetchSites()

mountBuilder(root, {
  sites,
  publish: (slug) => publishSite(slug),
})
