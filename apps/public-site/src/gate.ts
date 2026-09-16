import { DOWNLOAD_PATH } from '../../../packages/framework/src/modules/contact-form/fields'
import {
  downloadsPage,
  GATE_CACHE,
  GATE_HEADERS,
  parseDownloadPath,
} from '../../../packages/framework/src/modules/contact-form/gate'
import { contentTypeOf } from '../../../tools/generate/src/store/content-type'
import { parseRoute, siteOfRoute, SITE_SEGMENT, isValidSiteKey, type RootSite } from './routes'
import type { SiteStore } from './site-store'

/**
 * `GET /api/download/<token>` — the gated page, and the artifacts it lists
 * ([[REQ-244]]).
 *
 * THIS WORKER STILL RECEIVES ONE THING. `index.ts` says it serves pages and
 * receives nothing, and [[REQ-223]] amended that for exactly one path and one
 * method. **This file amends nothing further**: a gated page is a `GET`, and so
 * is a download. The `405` branch is untouched and its UAT still holds.
 *
 * `HEAD` IS DELIBERATELY NOT MATCHED. Arriving is a recorded fact, and a `HEAD`
 * records an arrival for a request that displays nothing — which prefetchers,
 * link unfurlers and scanners all send. One falls through to the ordinary serving
 * path and meets the ordinary 404, which is what a path naming no object gets.
 *
 * WHAT IS HERE AND WHAT IS OVER THERE. This file owns the grammar, the refusals,
 * the page, and the bytes — the things a Worker serving the public internet owns.
 * It owns NO knowledge of contacts: which contact a token names, whether it is
 * live, what its form promised and the recording of what they did are all
 * `control-app`'s, over the same kind of service binding lead capture uses, for
 * the same reason. `recordEvent` is the one definition of how a fact enters a
 * contact's history, and a second one here would be two answers free to drift.
 *
 * EVERY REFUSAL IS THE ORDINARY 404. Unknown, malformed and revoked are one
 * answer — §6 requires that much — and {@link notFound} goes further by being the
 * SAME response any unknown path gets, so a caller cannot even learn that a gate
 * path is a gate path. That is why the function lives here and `index.ts` imports
 * it rather than the other way round: this is the file with the requirement, and
 * one spelling is what makes the property structural instead of coincidental.
 */

/** Re-exported, not declared, for the reason `lead.ts` re-exports `LEAD_PATH`. */
export { DOWNLOAD_PATH }

/**
 * A 404 — the one this Worker gives for anything it will not serve.
 *
 * IT LIVES IN THE GATE'S FILE BECAUSE THE GATE IS WHAT REQUIRES IT TO BE ONE
 * THING. Everywhere else a 404 is just a 404; here it is a control, and a second
 * spelling anywhere would make the gate's refusal distinguishable from an
 * ordinary miss by a header or a byte.
 */
export function notFound(): Response {
  return new Response('Not Found', {
    status: 404,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}

/** The seam to `control-app`, as narrowly as this Worker types it. */
export interface AssetGateBinding {
  openGate(siteKey: string, token: string): Promise<{ assets: Array<{ key: string; name: string }> } | null>
  takeAsset(
    siteKey: string,
    token: string,
    assetKey: string,
  ): Promise<{ name: string; url: string } | null>
}

/** The configuration this endpoint reads, as the env it is read from. */
export interface GateEnv {
  /**
   * The RPC entrypoint on `control-app` that owns the record ([[REQ-223]] §3.2).
   *
   * ABSENT IS A REFUSAL. A deployment with no binding cannot record an arrival,
   * and serving the paper anyway would be the tracking silently switching itself
   * off — which is the whole capability, gone, with nothing saying so.
   */
  ASSET_GATE?: AssetGateBinding
}

/** Which page or artifact this GET names, or `null` when it names neither. */
export interface GateTarget {
  siteKey: string
  token: string
  /** The artifact they are taking, or `null` for the page that lists them. */
  assetKey: string | null
}

/**
 * The gate this `GET` names, or `null` when the path is not the endpoint.
 *
 * IT REUSES `parseRoute` RATHER THAN MATCHING A STRING, exactly as `leadTarget`
 * does. The grammar already decides what `/api/download/…` and
 * `/site/<siteKey>/api/download/…` mean — including the traversal and
 * percent-encoding cases, which are the parts that actually bite — so asking it
 * is the only way this cannot come to disagree with the server that resolves
 * every other byte, and the site key stays something the SERVER resolved rather
 * than something the caller named.
 *
 * AN APEX DOWNLOAD NEEDS AN APEX SITE, on `leadTarget`'s reasoning: a deployment
 * with no front page has no forms on it either.
 *
 * THE ROOT SITE IS A FACT ABOUT THE HOST NOW AND NOT A CONSTANT ([[REQ-258]]).
 * It used to be `APEX_SITE_KEY`, which is deployment configuration and is the
 * right answer on this product's own front door; on a customer's domain the root
 * site is whatever `site_domains` says that host reaches. Resolving it through
 * {@link siteOfRoute} is also what applies the cross-tenant guard here — a
 * download link on Alice's domain naming Bob's key is refused by the same rule
 * that refuses one of his pages, rather than by a second check somebody would
 * have had to remember to write.
 */
export function gateTarget(pathname: string, root: RootSite): GateTarget | null {
  const parsed = parseRoute(pathname)
  const siteKey = siteOfRoute(parsed, root)
  if (siteKey === null) return null
  const path = parsed.kind === 'apex' || parsed.kind === 'asset' ? parsed.path : ''

  // THE TAIL'S GRAMMAR IS THE `contact-form` MODULE'S ([[BUG-97]]). It was
  // spelled here, which was correct while this was the only server answering the
  // endpoint; `control-app`'s preview answers it too now, and a second spelling
  // of *what a download path means* is the failure `fields.ts`'s whole header is
  // about. What stays here is the half that is this server's: which SITE the
  // request resolved to.
  const target = parseDownloadPath(path)
  return target === null ? null : { siteKey, ...target }
}

/** Everything the gate needs resolved for it, gathered once per request. */
export interface GateServing {
  env: GateEnv
  store: SiteStore
  bucket: R2Bucket
}

/*
 * `GATE_CACHE` AND `GATE_HEADERS` ARE THE MODULE'S AND NO LONGER THIS FILE'S
 * ([[BUG-97]]). Two servers answer a gated response now, and a cache directive
 * one of them had to remember to set is one of them eventually not setting it.
 * `index.ts` stores only 200s and only for requests carrying no session, so
 * `private` here is belt as well as braces — and the braces are that the gate is
 * matched BEFORE the cache is consulted at all.
 */

/** Answer one gate request — the page, or one artifact. */
export async function handleGate(
  request: Request,
  target: GateTarget,
  serving: GateServing,
): Promise<Response> {
  const gate = serving.env.ASSET_GATE
  if (!gate) return notFound()

  if (target.assetKey === null) {
    const page = await gate.openGate(target.siteKey, target.token)
    if (!page) return notFound()
    const listing = downloadsPage(new URL(request.url).pathname, page.assets)
    return new Response(listing.body, { status: 200, headers: listing.headers })
  }

  const artifact = await gate.takeAsset(target.siteKey, target.token, target.assetKey)
  if (!artifact) return notFound()
  return await deliver(artifact.url, target.siteKey, serving)
}

/**
 * Serve one artifact's bytes.
 *
 * A SITE-RELATIVE URL IS A SITE ASSET, WHICH IS WHAT [[REQ-244]] §5 SAYS THE
 * BYTES ARE. It is resolved THROUGH `parseRoute`, against this site's own channel
 * root — so the traversal and encoding refusals that protect every other
 * published byte protect this one, by the same code rather than by a second
 * opinion about what `..` means in an R2 key.
 *
 * AN ABSOLUTE URL IS A REDIRECT AND NOT A REFUSAL. `assets[].url` is still a free
 * `url` an author types and every one in the stores today points off-site;
 * refusing them would break every gated download that exists for no visitor's
 * benefit. It is not an open redirect: the value is authored by the site's own
 * operator and reachable only through a valid token, and nothing a caller sends
 * reaches it.
 *
 * THE RECORD IS ALREADY WRITTEN BY THE TIME THIS RUNS, whichever way it goes. A
 * byte that was served is a byte that was recorded; the reverse order would lose
 * exactly the download that mattered — the one where the object was missing.
 *
 * IT DOES NOT REUSE `index.ts`'s `serve`, deliberately. That path stamps a
 * Turnstile sitekey and an account-chrome state into HTML and marks it
 * shared-cacheable for a minute; a gated artifact must do neither, and threading
 * two modes through one function to express that would make the one that matters
 * a flag somebody can get wrong.
 */
async function deliver(url: string, siteKey: string, serving: GateServing): Promise<Response> {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) {
    return new Response(null, {
      status: 302,
      headers: { location: url, 'cache-control': GATE_CACHE },
    })
  }

  if (!isValidSiteKey(siteKey)) return notFound()
  // The query and fragment are the author's business and not a key's: an R2
  // object is named by a path, and `?v=2` would name one nobody uploaded.
  const rel = url.split('#')[0].split('?')[0].replace(/^\/+/, '')
  const parsed = parseRoute(`/${SITE_SEGMENT}/${siteKey}/${rel}`)
  if (parsed.kind !== 'asset' || parsed.siteKey !== siteKey) return notFound()

  const prefix = await serving.store.resolve(siteKey)
  if (prefix === null) return notFound()
  const object = await serving.bucket.get(`${prefix}/${parsed.path}`)
  if (object === null) return notFound()

  return new Response(object.body, {
    status: 200,
    headers: {
      'content-type': contentTypeOf(parsed.path),
      ...GATE_HEADERS,
    },
  })
}
