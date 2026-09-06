#!/usr/bin/env node
/**
 * `bin/smoke` — post-deploy assertions against a LIVE origin (REQ-144).
 *
 * A deploy that reported success has proved that bytes were uploaded. It has not
 * proved that anything serves. This does: every check here is an HTTP request to
 * a real origin, and the script exits non-zero naming the assertion that failed.
 *
 * WHY PLAIN JAVASCRIPT. This runs from a shell, in CI, and straight after a
 * deploy — the moments when the toolchain is least likely to be warm and most
 * likely to be a different Node than the one on the operator's laptop. It
 * therefore takes no transform, no bundler and no dependency: `node` and
 * `fetch`. The assertion engine is exported so the UATs drive it with a fake
 * origin, which is what lets the failure path (AC5) be tested without breaking a
 * real deploy.
 *
 * WHAT IT COVERS, and where each check comes from — these are the things CHAT-11
 * verified by hand for `public-site`, turned into something that runs:
 *
 *   - the apex resolves at all;
 *   - the trailing-slash 301 holds. Load-bearing, not cosmetic: rendered pages
 *     reference assets document-relatively, so the missing slash resolves every
 *     one of them a level too high and yields an unstyled page (REQ-109/REQ-111);
 *   - a published site's referenced assets ALL return 200, with the content
 *     type their extension implies — including the ones referenced from inside
 *     CSS, which is where fonts hide;
 *   - `cache-control` is the published policy, and a miss is a 404 rather than a
 *     listing;
 *   - an unknown site key 404s, and does so INDISTINGUISHABLY from a key that
 *     exists but has published nothing. A 404 that says which would answer
 *     questions about sites the asker has no business knowing exist.
 *   - the control app is PRIVATE (REQ-147): unauthenticated callers are
 *     challenged rather than served, on the Access hostname AND on the
 *     workers.dev hostname an Access policy cannot cover.
 *
 * THERE IS ONE CHANNEL TO SMOKE (REQ-149 D7, [[BUG-57]]). Five checks here used
 * to address `/site/<slug>/draft/<sha>/…`, behind a `--draft` flag. That channel
 * was deleted with the `1c deploy` that was the only producer of sha-addressed
 * snapshots — `apps/public-site/src/routes.ts` treats `draft` as an ordinary
 * segment again — so those checks could only skip forever, or fail against a
 * route the grammar no longer has. They are gone rather than stubbed, and what
 * they were worth (the asset crawl, the cache policy, the 404-on-miss) is
 * asserted on the published channel instead, where it can actually run.
 */

/**
 * Published URLs are not revision-scoped, so they are cached briefly rather than
 * immutably. Restated from `PUBLISHED_CACHE` in `apps/public-site/src/index.ts`
 * for the same reason {@link EXPECTED_CONTENT_TYPES} is — this file runs outside
 * the Worker bundle and cannot import it, so the duplication is across a
 * deployment boundary and is pinned by a UAT.
 */
const PUBLISHED_CACHE = 'public, max-age=60'

/**
 * Extension → the content type the origin must answer with.
 *
 * Deliberately a SECOND statement of the Worker's own table
 * (`apps/public-site/src/content-type.ts`), because this file runs outside the
 * Worker bundle and cannot import it. The duplication is across a deployment
 * boundary and is pinned by a UAT rather than by hope — the same arrangement,
 * and the same reasoning, that table already records for `1c deploy`.
 */
const EXPECTED_CONTENT_TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  ico: 'image/x-icon',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
}

export { EXPECTED_CONTENT_TYPES }

/** A site key nothing will ever deploy. Fixed, so a failure is reproducible. */
const ABSENT_SITE_KEY = 'smoke-absent-site-do-not-deploy'

/**
 * The deployment this repo describes: the apex, and the control app beside it.
 *
 * Declared as a PAIR because the second is only knowable from the first here.
 * `apps/control-app/wrangler.toml` declares exactly one route,
 * `app.1stcontact.io/*`, and public-site owns the `*.1stcontact.io/*` wildcard
 * with `app` reserved out of it — so for this apex the control origin is a fact
 * about the deployment rather than an operator's choice, and making the operator
 * retype it on every run is what left the REQ-147 gate unchecked by default
 * ([[BUG-57]]).
 */
const DEFAULT_ORIGIN = 'https://1stcontact.io'
const DEFAULT_CONTROL_ORIGIN = 'https://app.1stcontact.io'

/**
 * The control app's origin for the origin under test, or `undefined`.
 *
 * DERIVED FOR THE DEFAULT APEX AND NOTHING ELSE. The tempting generalisation is
 * `app.<host>` of whatever `--origin` says, and it is wrong: pointed at a
 * staging or preview origin that has no `app.` sibling, the fetch throws and the
 * check reports a FAILING control gate for a host that was never the control
 * app. A false alarm on the one assertion that says "the builder is not public"
 * is worse than a skip, so anything other than the known apex must be named with
 * `--control-origin`.
 */
function controlOriginFor(origin) {
  return origin === DEFAULT_ORIGIN ? DEFAULT_CONTROL_ORIGIN : undefined
}

class Failed extends Error {}

/** Assert, with the message that will be reported when it does not hold. */
function ensure(condition, message) {
  if (!condition) throw new Failed(message)
}

function extensionOf(pathname) {
  const name = pathname.slice(pathname.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase()
}

/**
 * Every same-origin asset the document references.
 *
 * Attribute references plus `url(…)` from inline CSS. External origins,
 * `data:`, `mailto:` and bare fragments are not this script's business — a
 * broken third-party link is not a broken deploy.
 */
export function referencedAssets(html, baseUrl) {
  const found = new Set()
  const add = (raw) => {
    const value = raw.trim()
    if (value === '' || value.startsWith('#') || value.startsWith('data:')) return
    let resolved
    try {
      resolved = new URL(value, baseUrl)
    } catch {
      return
    }
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return
    if (resolved.origin !== new URL(baseUrl).origin) return
    resolved.hash = ''
    found.add(resolved.href)
  }

  for (const m of html.matchAll(/<(?:link|script|img|source|use)\b[^>]*?\b(?:href|src)\s*=\s*"([^"]*)"/gi)) {
    add(m[1])
  }
  for (const m of html.matchAll(/<(?:link|script|img|source|use)\b[^>]*?\b(?:href|src)\s*=\s*'([^']*)'/gi)) {
    add(m[1])
  }
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) add(m[1])
  return [...found]
}

/** The `url(…)` references inside a stylesheet, resolved against its own URL. */
export function referencedFromCss(css, cssUrl) {
  const found = new Set()
  for (const m of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
    const value = m[1].trim()
    if (value === '' || value.startsWith('data:')) continue
    let resolved
    try {
      resolved = new URL(value, cssUrl)
    } catch {
      continue
    }
    if (resolved.origin !== new URL(cssUrl).origin) continue
    resolved.hash = ''
    found.add(resolved.href)
  }
  return [...found]
}

/**
 * Run the smoke suite.
 *
 * `fetchImpl` is injected so the UATs can drive a fake origin — including a
 * deliberately broken one, which is the only honest way to test that a failure
 * actually fails.
 */
export async function runSmoke(options = {}) {
  const origin = (options.origin ?? DEFAULT_ORIGIN).replace(/\/+$/, '')
  const siteKey = options.siteKey
  const doFetch = options.fetch ?? globalThis.fetch
  const maxAssets = options.maxAssets ?? 200
  const strip = (value) => (value ? value.replace(/\/+$/, '') : undefined)
  const controlOrigin = strip(options.controlOrigin) ?? strip(controlOriginFor(origin))
  const workersDevOrigin = strip(options.workersDevOrigin)
  const checks = []

  const get = (url, init) => doFetch(url, { redirect: 'manual', ...init })

  async function check(name, fn) {
    try {
      const detail = await fn()
      checks.push({ name, status: 'pass', detail: detail ?? '' })
    } catch (err) {
      checks.push({
        name,
        status: 'fail',
        detail: err instanceof Failed ? err.message : `threw: ${err?.message ?? String(err)}`,
      })
    }
  }

  function skip(name, why) {
    checks.push({ name, status: 'skip', detail: why })
  }

  await check('apex_resolves', async () => {
    const res = await get(`${origin}/`)
    ensure(res.status === 200, `GET ${origin}/ returned ${res.status}, expected 200`)
    return `200 ${res.headers.get('content-type') ?? ''}`
  })

  await check('unknown_site_not_found', async () => {
    const res = await get(`${origin}/site/${ABSENT_SITE_KEY}/`)
    ensure(res.status === 404, `an unknown site key returned ${res.status}, expected 404`)
    return '404'
  })

  // ── the published channel (REQ-111) ────────────────────────────────────────
  //
  // Every check below needs a site key, and there is no way to discover one from
  // here: the script takes no dependency, so it cannot ask D1, and a key is 128
  // random bits, so it cannot be guessed. `--site-key` is therefore the one thing
  // the operator has to supply, and without it these skip.
  //
  // THE SEGMENT IS A KEY, NOT A SLUG ([[REQ-190]]). It used to carry a name the
  // operator chose, which is why the flag and two of the check names said "slug".
  // Renamed rather than aliased: an unknown argument is already an error here, so
  // `--slug` fails loudly instead of quietly smoking the wrong thing.
  if (siteKey) {
    const siteRoot = `${origin}/site/${siteKey}`

    await check('unpublished_site_indistinguishable', async () => {
      const absent = await get(`${origin}/site/${ABSENT_SITE_KEY}/`)
      const known = await get(`${siteRoot}/`)
      // Either the site has a live revision (200) or it has not (404). Only the
      // second is comparable — and it is the case that leaks, so it is the one
      // worth asserting on.
      if (known.status === 200) return 'the site has a live revision; nothing to compare'
      ensure(
        known.status === absent.status,
        `'${siteKey}' returned ${known.status} but an unknown site key returned ` +
          `${absent.status} — the difference tells a stranger the site exists`,
      )
      const knownBody = await known.text()
      const absentBody = await absent.text()
      ensure(
        knownBody === absentBody,
        `the 404 body for '${siteKey}' differs from the one for an unknown site key`,
      )
      return `both ${known.status}, identical bodies`
    })

    await check('published_root_redirects', async () => {
      const res = await get(siteRoot)
      ensure(res.status === 301, `GET /site/${siteKey} returned ${res.status}, expected 301`)
      const location = res.headers.get('location') ?? ''
      ensure(
        location.endsWith(`/site/${siteKey}/`),
        `redirect went to '${location}', expected it to end with /site/${siteKey}/`,
      )
      return `301 → ${location}`
    })

    await check('published_index_serves_html', async () => {
      const res = await get(`${siteRoot}/`)
      ensure(res.status === 200, `GET ${siteRoot}/ returned ${res.status}, expected 200`)
      const type = res.headers.get('content-type') ?? ''
      ensure(
        type === EXPECTED_CONTENT_TYPES.html,
        `content-type was '${type}', expected '${EXPECTED_CONTENT_TYPES.html}'`,
      )
      return `200 ${type}`
    })

    await check('published_cache_policy', async () => {
      const res = await get(`${siteRoot}/`)
      const cache = res.headers.get('cache-control') ?? ''
      ensure(
        cache === PUBLISHED_CACHE,
        `cache-control was '${cache}', expected '${PUBLISHED_CACHE}'`,
      )
      return cache
    })

    await check('published_miss_is_404', async () => {
      // Named so it cannot collide with a real page: the assertion is about the
      // bucket's answer to a key nobody uploaded, and a site that happened to
      // publish this file would turn a pass into a false one.
      const res = await get(`${siteRoot}/smoke-no-such-asset.css`)
      ensure(res.status === 404, `a missing published asset returned ${res.status}, expected 404`)
      // A 404 and never a listing — the bucket's key space is not a browsable
      // filesystem and must not become one by accident (public-site/index.ts).
      const res2 = await get(`${siteRoot}/smoke-no-such-directory/`)
      ensure(
        res2.status === 404,
        `a missing published directory returned ${res2.status}, expected 404`,
      )
      return '404 for a missing object and a missing directory'
    })

    await check('published_assets_resolve', async () => {
      const indexUrl = `${siteRoot}/`
      const res = await get(indexUrl)
      ensure(res.status === 200, `GET ${indexUrl} returned ${res.status}, expected 200`)
      const html = await res.text()

      const queue = referencedAssets(html, indexUrl)
      ensure(queue.length > 0, `${indexUrl} references no same-origin assets — is it really the page?`)

      const seen = new Set()
      const problems = []
      let checkedCount = 0

      while (queue.length > 0 && checkedCount < maxAssets) {
        const url = queue.shift()
        if (seen.has(url)) continue
        seen.add(url)
        checkedCount += 1

        const assetRes = await get(url)
        if (assetRes.status !== 200) {
          problems.push(`${url} → ${assetRes.status}`)
          continue
        }
        const ext = extensionOf(new URL(url).pathname)
        const expected = EXPECTED_CONTENT_TYPES[ext]
        const actual = assetRes.headers.get('content-type') ?? ''
        if (expected !== undefined && actual !== expected) {
          problems.push(`${url} served as '${actual}', expected '${expected}'`)
          continue
        }
        // One level into CSS, because that is where @font-face lives and a
        // missing font is invisible in a screenshot but obvious to a reader.
        if (ext === 'css') {
          for (const nested of referencedFromCss(await assetRes.text(), url)) {
            if (!seen.has(nested)) queue.push(nested)
          }
        }
      }

      ensure(
        problems.length === 0,
        `${problems.length} of ${checkedCount} referenced assets are wrong:\n` +
          problems.map((p) => `      ${p}`).join('\n'),
      )
      ensure(
        queue.length === 0,
        `stopped after ${maxAssets} assets with ${queue.length} still queued — raise --max-assets`,
      )
      return `${checkedCount} assets, all 200 with the expected type`
    })
  } else {
    for (const name of [
      'unpublished_site_indistinguishable',
      'published_root_redirects',
      'published_index_serves_html',
      'published_cache_policy',
      'published_miss_is_404',
      'published_assets_resolve',
    ]) {
      skip(name, 'no --site-key given')
    }
  }

  // ── the control app is private (REQ-147) ───────────────────────────────────
  //
  // Both checks assert a NEGATIVE — "this does not serve the builder" — which is
  // why they are stated as "not 200" rather than as one expected status. Access
  // answers a browser with a 302 to the login page and a non-browser with a 401;
  // an unconfigured Worker answers 503; a retired workers.dev hostname does not
  // resolve at all. Every one of those is the gate holding. Only a 200 is not.

  if (controlOrigin) {
    await check('control_app_challenges_unauthenticated', async () => {
      const res = await get(`${controlOrigin}/`)
      ensure(
        res.status !== 200,
        `GET ${controlOrigin}/ returned 200 to a caller with no Access token — ` +
          'the builder is being served publicly',
      )
      const location = res.headers.get('location') ?? ''
      const challenged =
        (res.status >= 300 && res.status < 400 && location.includes('cloudflareaccess.com')) ||
        res.status === 401 ||
        res.status === 403
      // A 503 is the Worker's own fail-closed answer to empty Access vars. Not
      // serving, so not a failure — but reported, because it means the gate has
      // not yet been proved against a real Access challenge.
      ensure(
        challenged || res.status === 503,
        `GET ${controlOrigin}/ returned ${res.status}${location ? ` → ${location}` : ''}, ` +
          'expected an Access challenge (302 to <team>.cloudflareaccess.com, or 401/403)',
      )
      return res.status === 503
        ? '503 — the Worker refused: Access vars are empty, so no challenge was proved'
        : `${res.status}${location ? ` → ${location}` : ''}`
    })
  } else {
    skip(
      'control_app_challenges_unauthenticated',
      `no --control-origin given, and ${origin} is not the apex one is known for`,
    )
  }

  if (workersDevOrigin) {
    await check('control_app_workers_dev_closed', async () => {
      // The hostname is EXPECTED to have stopped resolving, so a throw is the
      // success case here rather than an error — the one place in this script
      // where that is true.
      let res
      try {
        res = await get(`${workersDevOrigin}/`)
      } catch (err) {
        return `does not resolve (${err?.message ?? String(err)})`
      }
      ensure(
        res.status !== 200,
        `GET ${workersDevOrigin}/ returned 200 — the Worker still answers on workers.dev, ` +
          'which no Access policy covers',
      )
      return `${res.status}`
    })
  } else {
    skip('control_app_workers_dev_closed', 'no --workers-dev-origin given')
  }

  const failed = checks.filter((c) => c.status === 'fail')
  return { ok: failed.length === 0, origin, siteKey, controlOrigin, workersDevOrigin, checks, failed }
}

const USAGE = `bin/smoke — prove a deployed origin actually serves.

  bin/smoke [--origin <url>] [--site-key <key>] [--max-assets <n>]
            [--control-origin <url>] [--workers-dev-origin <url>]

  --origin              default https://1stcontact.io
  --site-key            a published site's key, the first segment of /site/<key>/;
                        without it the published-channel checks are skipped
  --control-origin      the control app — asserts an unauthenticated caller is
                        challenged, not served (REQ-147). Defaults to
                        https://app.1stcontact.io when --origin is the apex that
                        names it; any other origin must say where its control app
                        is, or the check is skipped rather than guessed at
  --workers-dev-origin  the control app's workers.dev hostname — asserts the door an
                        Access policy cannot cover is shut. Not derivable: the
                        hostname embeds the account subdomain, so it is skipped
                        unless given

Exits 0 when every check passes, 1 naming the ones that did not. Skipped checks
never fail the run, but they are counted in the summary — a run that skipped
everything has proved nothing, and says so.`

function parseArgs(argv) {
  const opts = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    switch (arg) {
      case '-h':
      case '--help':
        return { help: true }
      case '--origin': {
        const value = argv[i + 1]
        if (value === undefined) throw new Error(`${arg} needs a value`)
        opts[arg.slice(2)] = value
        i += 1
        break
      }
      case '--site-key':
      case '--control-origin':
      case '--workers-dev-origin': {
        const value = argv[i + 1]
        if (value === undefined) throw new Error(`${arg} needs a value`)
        // --control-origin → controlOrigin, --site-key → siteKey
        opts[arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value
        i += 1
        break
      }
      case '--max-assets': {
        const value = Number(argv[i + 1])
        if (!Number.isInteger(value) || value <= 0) throw new Error('--max-assets needs a positive integer')
        opts.maxAssets = value
        i += 1
        break
      }
      default:
        throw new Error(`unknown argument '${arg}'`)
    }
  }
  return opts
}

export function formatReport(report) {
  const lines = []
  const mark = { pass: 'PASS', fail: 'FAIL', skip: 'skip' }
  for (const c of report.checks) {
    lines.push(`  ${mark[c.status]}  ${c.name}${c.detail ? `\n      ${c.detail}` : ''}`)
  }
  const counts = { pass: 0, fail: 0, skip: 0 }
  for (const c of report.checks) counts[c.status] += 1
  lines.push('')
  lines.push(
    report.ok
      ? `Smoke passed against ${report.origin}: ${counts.pass} passed, ${counts.skip} skipped.`
      : `Smoke FAILED against ${report.origin}: ${counts.fail} failed, ` +
          `${counts.pass} passed, ${counts.skip} skipped.`,
  )
  if (!report.ok) {
    lines.push(`Failed: ${report.failed.map((c) => c.name).join(', ')}`)
  }
  return lines.join('\n')
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === new URL(`file://${process.argv[1]}`).href

if (invokedDirectly) {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (err) {
    console.error(`bin/smoke: ${err.message}\n\n${USAGE}`)
    process.exit(1)
  }
  if (opts.help) {
    console.log(USAGE)
    process.exit(0)
  }
  const report = await runSmoke(opts)
  console.log(formatReport(report))
  process.exit(report.ok ? 0 : 1)
}
