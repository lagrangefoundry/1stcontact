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
 * WHAT RUNS WITH NO ARGUMENTS ([[BUG-136]]). Every check that CAN run against a
 * deployment does, because the moment this script exists for — straight after a
 * deploy, possibly in CI — is the moment nobody is in a position to remember a
 * flag. Four of the published-channel checks need only a published ROOT and the
 * apex is one whenever `APEX_SITE_KEY` names a site, so they address `/` unless
 * `--site-key` names somewhere else; `apps/public-site/src/index.ts` routes the
 * apex and `/site/<key>/` through one `serve()`, which is what makes those two
 * targets the same assertion rather than two similar ones.
 *
 * AND WHAT DOES NOT RUN SAYS WHY, IN ONE OF TWO WORDS. `skip` is *nobody gave me
 * an argument* and names the argument. `n/a` is *this deployment has nothing for
 * me to assert against* — no argument fixes it, and it is what a check reports
 * instead of a pass when it compared nothing. Both are counted apart in the
 * summary: giving them one word is how seven unrun checks read as one uniform
 * kind of debt for as long as they did.
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
 * THE ONE EXTENSION-TO-TYPE TABLE, IMPORTED RATHER THAN RESTATED ([[REQ-246]]).
 *
 * This file held a copy, on the reasoning that it runs outside the Worker bundle
 * and cannot load TypeScript — which was true, and was the ONLY one of the five
 * copies for which it was true. The table beside it in `public-site` carried the
 * same "pinned by a UAT rather than by hope" justification and drifted anyway,
 * because a pinning test only ever compares the rows both sides happen to have:
 * five formats existed in one and not the other, and `pdf` in neither.
 *
 * So the module is plain JavaScript now, for exactly this consumer's sake. It
 * takes no transform, no bundler and no dependency, which is what the header
 * above requires of everything in here.
 */
import { readFileSync } from 'node:fs'

import { contentTypeOf, extensionOf } from '../src/store/content-type.js'

/**
 * Published URLs are not revision-scoped, so they are cached briefly rather than
 * immutably. Restated from `PUBLISHED_CACHE` in `apps/public-site/src/index.ts`
 * — a single constant rather than a table, and the Worker is the only other
 * place it appears, so a UAT pins the pair.
 */
const PUBLISHED_CACHE = 'public, max-age=60'

/**
 * The OTHER policy a published page can carry, and it is not an exception.
 *
 * `serve()` rewrites a page that holds account chrome per visitor, so it marks
 * that response `private, no-store` and varies on the cookie. Which of the two
 * applies is a property of the PAGE rather than of the channel, so it is the
 * same question at `/` and at `/site/<key>/` — but the apex is this product's
 * own front door and therefore the page most likely to carry chrome, so a check
 * that knew only `PUBLISHED_CACHE` would report a failing cache policy for a
 * correctly-served apex. Restated from `SESSION_CACHE` in
 * `apps/public-site/src/index.ts`, and pinned against it by a UAT alongside its
 * neighbour above.
 */
const SESSION_CACHE = 'private, no-store'

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

/**
 * THE OUTCOME FOR A CHECK THAT HAS NOTHING TO ASSERT AGAINST.
 *
 * Distinct from a failure, obviously — but distinct from a PASS too, which is
 * the point. `unpublished_site_indistinguishable` used to report a pass when the
 * site it was given had a live revision, having compared nothing; a check that
 * passes without asserting is indistinguishable from one that holds, and is
 * exactly how coverage that does not exist goes on looking like coverage.
 *
 * And distinct from a SKIP, which is the other half of the same honesty: a skip
 * is *nobody supplied an argument* and names the one that would run it. This is
 * *this deployment has nothing for the check to assert*, which no argument fixes.
 */
class NotApplicable extends Error {}

/** Assert, with the message that will be reported when it does not hold. */
function ensure(condition, message) {
  if (!condition) throw new Failed(message)
}

/** End this check as `n/a`, saying what this deployment did not have. */
function inapplicable(message) {
  throw new NotApplicable(message)
}

/**
 * Why the default apex publishes nothing, read from the file that decides it.
 *
 * `APEX_SITE_KEY` names the site served at the root of the host, so an empty one
 * is the whole explanation for a 404 at `/` — and an explanation is what turns a
 * skip into an instruction.
 *
 * READING A FILE IN THE REPOSITORY THIS SCRIPT SHIPS IN IS NOT THE DEPENDENCY
 * THE HEADER ARGUES AGAINST. `node:fs` is built in, the match is a line match
 * rather than a TOML parse, and every failure of it is swallowed: this is extra
 * words on a check that has already decided its outcome, never the thing that
 * decides it. Asking D1 for a key would be the dependency; reading the config
 * beside the Worker is not.
 */
function apexConfigHint() {
  try {
    const toml = readFileSync(
      new URL('../../../apps/public-site/wrangler.toml', import.meta.url),
      'utf8',
    )
    const declared = [...toml.matchAll(/^\s*APEX_SITE_KEY\s*=\s*"([^"]*)"/gm)].map((m) => m[1])
    if (declared.length === 0 || declared.some((value) => value !== '')) return ''
    return (
      ' — APEX_SITE_KEY is empty in apps/public-site/wrangler.toml, so this deployment ' +
      'publishes no apex at all'
    )
  } catch {
    return ''
  }
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
      if (err instanceof NotApplicable) {
        checks.push({ name, status: 'na', detail: err.message })
        return
      }
      checks.push({
        name,
        status: 'fail',
        detail: err instanceof Failed ? err.message : `threw: ${err?.message ?? String(err)}`,
      })
    }
  }

  /** Nobody supplied an argument. `why` must name the one that would run it. */
  function skip(name, why) {
    checks.push({ name, status: 'skip', detail: why })
  }

  /**
   * What the apex answered, kept for the checks below rather than asked twice.
   *
   * Headers and status only, never the body: a `Response` body reads once, and
   * `published_index_serves_html` and `published_assets_resolve` fetch `/` for
   * themselves.
   */
  let apexIndex

  await check('apex_resolves', async () => {
    const res = await get(`${origin}/`)
    apexIndex = { status: res.status, contentType: res.headers.get('content-type') ?? '' }
    ensure(res.status === 200, `GET ${origin}/ returned ${res.status}, expected 200`)
    return `200 ${apexIndex.contentType}`
  })

  await check('unknown_site_not_found', async () => {
    const res = await get(`${origin}/site/${ABSENT_SITE_KEY}/`)
    ensure(res.status === 404, `an unknown site key returned ${res.status}, expected 404`)
    return '404'
  })

  // ── the published channel (REQ-111) ───────────────────────────────────────
  //
  // THE APEX IS THE PUBLISHED CHANNEL WHEN IT SERVES ONE ([[BUG-136]]).
  //
  // All six of these used to wait for `--site-key`, on the reasoning that a key
  // is 128 random bits and this script takes no dependency that could ask D1 for
  // one. That reasoning is still true and still the rule — but it was answering
  // the wrong question for four of them. `APEX_SITE_KEY` names a site served at
  // the ROOT of the host, and `apps/public-site/src/index.ts` routes `apex` and
  // `asset` through one branch into one `serve()`, so `/` on a deployment that
  // has published its apex IS a published site root, with the same headers, the
  // same 404-on-miss and the same assets to crawl. Four assertions therefore had
  // a target all along and were skipping beside it.
  //
  // A check that only runs when an operator remembers a flag is a check that
  // will not run, and this is the assertion surface for "did the deploy serve
  // anything" — the one moment it exists for is the moment nobody is in a
  // position to supply an argument. So the four run with no flag whenever there
  // is a published root to run them against, and the two that genuinely need a
  // key say so in those words rather than sharing a skip with checks that could
  // have run and did not.
  //
  // THE SEGMENT IS A KEY, NOT A SLUG ([[REQ-190]]). It used to carry a name the
  // operator chose, which is why the flag and two of the check names said "slug".
  // Renamed rather than aliased: an unknown argument is already an error here, so
  // `--slug` fails loudly instead of quietly smoking the wrong thing.

  /**
   * Whether `/` is a published site root — a 200 whose body is a page.
   *
   * THE CONTENT TYPE IS PART OF THE QUESTION rather than pedantry. An origin can
   * answer 200 at `/` with something that is not a site (a health endpoint, a
   * placeholder, a staging origin's plain-text greeting), and pointing the
   * published-channel assertions at it would report four failures about a
   * deployment that never claimed to publish an apex. That is a false alarm, and
   * the script's own rule for `--control-origin` is that a false alarm is worse
   * than a skip.
   */
  const apexServesSite =
    apexIndex !== undefined && apexIndex.status === 200 && apexIndex.contentType.startsWith('text/html')

  /**
   * What the four channel checks address, without its trailing slash.
   *
   * `--site-key` WINS when it is given: the operator named the site they want
   * smoked, and a run that quietly asserted against the apex instead would be
   * answering a question nobody asked. With no key the apex stands in, which is
   * the no-flag path this ticket exists for.
   */
  const channelBase = siteKey ? `${origin}/site/${siteKey}` : apexServesSite ? origin : undefined

  const siteRoot = siteKey ? `${origin}/site/${siteKey}` : undefined

  // ── the two that genuinely need a key ────────────────────────────────────

  if (siteKey) {
    await check('unpublished_site_indistinguishable', async () => {
      const absent = await get(`${origin}/site/${ABSENT_SITE_KEY}/`)
      const known = await get(`${siteRoot}/`)
      // Either the site has a live revision (200) or it has not (404). Only the
      // second is comparable — and it is the case that leaks, so it is the one
      // worth asserting on.
      //
      // N/A AND NOT PASS ([[BUG-136]]). This branch compares nothing, and it used
      // to say so in a detail line while reporting a pass, so the one check that
      // guards a cross-tenant leak could report green having asserted nothing at
      // all. It is not a skip either: no argument to THIS run fixes it — the key
      // it was given is published, and the check needs one that is not.
      if (known.status === 200) {
        inapplicable(
          `'${siteKey}' has a live revision, so there is no 404 to compare — this check ` +
            'needs a key that EXISTS and has published nothing, and asserted nothing here',
        )
      }
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
  } else {
    // Stated in the words that distinguish them from the four below: these are
    // not assertions that could have run against this deployment and did not.
    skip(
      'unpublished_site_indistinguishable',
      'no --site-key given — this check needs a key that EXISTS and has published nothing, ' +
        'and the apex cannot stand in for one: it is published by definition',
    )
    skip(
      'published_root_redirects',
      'no --site-key given — this check asserts the /site/<key> → /site/<key>/ grammar, ' +
        'which only a key has an instance of',
    )
  }

  // ── the four that need only a published root ──────────────────────────────

  if (channelBase) {
    /** Which root the four below are reporting on, so a pass names what it proved. */
    const channelLabel = siteKey ? `/site/${siteKey}/` : 'the apex /'

    await check('published_index_serves_html', async () => {
      const res = await get(`${channelBase}/`)
      ensure(res.status === 200, `GET ${channelBase}/ returned ${res.status}, expected 200`)
      const type = res.headers.get('content-type') ?? ''
      const expected = contentTypeOf('index.html')
      ensure(type === expected, `content-type was '${type}', expected '${expected}'`)
      return `${channelLabel}: 200 ${type}`
    })

    await check('published_cache_policy', async () => {
      const res = await get(`${channelBase}/`)
      const cache = res.headers.get('cache-control') ?? ''
      // TWO POLICIES, AND THE RESPONSE SAYS WHICH ONE IT IS UNDER. A published
      // page carrying account chrome is rewritten per visitor, so `serve()`
      // marks it `private, no-store` and varies on the cookie; every other page
      // keeps the brief shared policy. Asserting only the shared one would
      // report a FAILING cache policy for a correctly-served front door — which
      // is the page most likely to carry chrome and, now that the apex is where
      // these checks run by default, the page this check most often sees.
      //
      // `vary: cookie` is asserted rather than merely consulted: it is what makes
      // every cache downstream agree, and session bytes in a shared cache
      // WITHOUT it is the leak the private policy exists to prevent.
      const varies = (res.headers.get('vary') ?? '').toLowerCase().includes('cookie')
      const expected = varies ? SESSION_CACHE : PUBLISHED_CACHE
      ensure(
        cache === expected,
        `cache-control was '${cache}', expected '${expected}'` +
          (varies ? " — the response varies on cookie, so it is session-dependent" : ''),
      )
      return varies ? `${channelLabel}: ${cache} (vary: cookie)` : `${channelLabel}: ${cache}`
    })

    await check('published_miss_is_404', async () => {
      // Named so it cannot collide with a real page: the assertion is about the
      // bucket's answer to a key nobody uploaded, and a site that happened to
      // publish this file would turn a pass into a false one.
      const res = await get(`${channelBase}/smoke-no-such-asset.css`)
      ensure(res.status === 404, `a missing published asset returned ${res.status}, expected 404`)
      // A 404 and never a listing — the bucket's key space is not a browsable
      // filesystem and must not become one by accident (public-site/index.ts).
      const res2 = await get(`${channelBase}/smoke-no-such-directory/`)
      ensure(
        res2.status === 404,
        `a missing published directory returned ${res2.status}, expected 404`,
      )
      return `${channelLabel}: 404 for a missing object and a missing directory`
    })

    await check('published_assets_resolve', async () => {
      const indexUrl = `${channelBase}/`
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
        // THE ORIGIN'S OWN ANSWER, ASKED OF THE ORIGIN'S OWN TABLE. This used to
        // skip any extension the local copy did not hold, which is precisely the
        // case a drifted copy produces — so the check fell silent exactly where
        // it was needed. There is one table now, so every served asset is
        // compared rather than only the ones a second list remembered.
        const expected = contentTypeOf(new URL(url).pathname)
        const actual = assetRes.headers.get('content-type') ?? ''
        if (actual !== expected) {
          problems.push(`${url} served as '${actual}', expected '${expected}'`)
          continue
        }
        // One level into CSS, because that is where @font-face lives and a
        // missing font is invisible in a screenshot but obvious to a reader.
        if (ext === '.css') {
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
      return `${channelLabel}: ${checkedCount} assets, all 200 with the expected type`
    })
  } else {
    // NO KEY AND NO PUBLISHED APEX, and the reason names both halves — an
    // operator reading this needs to know that `--site-key` would run it AND
    // that publishing the apex would run it without one.
    const answered = apexIndex
      ? `${apexIndex.status}${apexIndex.contentType ? ` ${apexIndex.contentType}` : ''}`
      : 'it did not answer'
    const why =
      `no --site-key given, and ${origin}/ is not a published site index (${answered})` +
      (origin === DEFAULT_ORIGIN ? apexConfigHint() : '')
    for (const name of [
      'published_index_serves_html',
      'published_cache_policy',
      'published_miss_is_404',
      'published_assets_resolve',
    ]) {
      skip(name, why)
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
    // NOT DERIVABLE, AND SAYING SO IS THE POINT ([[BUG-136]]). `--control-origin`
    // is derived for the known apex because control-app declares exactly one
    // route; this hostname is `<script>.<subdomain>.workers.dev` and the
    // account's subdomain appears nowhere in this repository, so deriving it
    // would mean guessing — and a guess here asserts against a hostname that
    // may belong to somebody else. A silent skip and an underivable input are
    // different reports, so this one says which it is.
    skip(
      'control_app_workers_dev_closed',
      'no --workers-dev-origin given, and it cannot be derived: the hostname embeds this ' +
        "account's workers.dev subdomain, which is nowhere in this repository. " +
        'apps/control-app/wrangler.toml declares workers_dev = false and a static check pins ' +
        'that declaration, but only a request proves the door is shut',
    )
  }

  const failed = checks.filter((c) => c.status === 'fail')
  return { ok: failed.length === 0, origin, siteKey, controlOrigin, workersDevOrigin, checks, failed }
}

const USAGE = `bin/smoke — prove a deployed origin actually serves.

  bin/smoke [--origin <url>] [--site-key <key>] [--max-assets <n>]
            [--control-origin <url>] [--workers-dev-origin <url>]

  --origin              default https://1stcontact.io
  --site-key            a published site's key, the first segment of /site/<key>/.
                        Without it the four checks that need only a published ROOT
                        run against the apex, whenever the apex serves one; the two
                        that assert the /site/<key>/ grammar itself skip
  --control-origin      the control app — asserts an unauthenticated caller is
                        challenged, not served (REQ-147). Defaults to
                        https://app.1stcontact.io when --origin is the apex that
                        names it; any other origin must say where its control app
                        is, or the check is skipped rather than guessed at
  --workers-dev-origin  the control app's workers.dev hostname — asserts the door an
                        Access policy cannot cover is shut. Not derivable: the
                        hostname embeds the account subdomain, so it is skipped
                        unless given

Exits 0 when every check passes, 1 naming the ones that did not.

Neither a skip nor an n/a fails the run, and they are counted apart in the
summary because they are answered differently: a skip means nobody supplied an
argument and names the one that would run it; an n/a means this deployment had
nothing for the check to assert against. A run that asserted nothing has proved
nothing, and says so in as many words.`

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
  // Four marks, all four columns wide, because the summary's whole job is to
  // make the difference between them visible at a glance.
  const mark = { pass: 'PASS', fail: 'FAIL', skip: 'skip', na: ' n/a' }
  for (const c of report.checks) {
    lines.push(`  ${mark[c.status]}  ${c.name}${c.detail ? `\n      ${c.detail}` : ''}`)
  }
  const counts = { pass: 0, fail: 0, skip: 0, na: 0 }
  for (const c of report.checks) counts[c.status] += 1
  lines.push('')
  // A SKIP AND AN N/A ARE COUNTED APART ([[BUG-136]]). One says nobody supplied
  // an argument and is answered by supplying it; the other says this deployment
  // had nothing for the check to assert and is answered by deploying something.
  // Giving both the same word in the summary is what let seven unrun checks read
  // as one uniform kind of debt.
  const notApplicable = counts.na > 0 ? `, ${counts.na} not applicable to this deployment` : ''
  lines.push(
    report.ok
      ? `Smoke passed against ${report.origin}: ${counts.pass} passed, ${counts.skip} skipped${notApplicable}.`
      : `Smoke FAILED against ${report.origin}: ${counts.fail} failed, ` +
          `${counts.pass} passed, ${counts.skip} skipped${notApplicable}.`,
  )
  if (!report.ok) {
    lines.push(`Failed: ${report.failed.map((c) => c.name).join(', ')}`)
  }
  // A run that asserted nothing is a run that proved nothing, and exiting zero
  // on it would be the quietest way for this script to lie.
  if (counts.pass === 0 && counts.fail === 0) {
    lines.push('Nothing was proved: no check ran. Every line above says what would make one.')
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
