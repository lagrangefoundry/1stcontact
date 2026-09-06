import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import worker, { type Env } from '../apps/public-site/src/index'
import { parseRoute } from '../apps/public-site/src/routes'
import { hostInCookieDomain, readSessionId } from '../apps/public-site/src/session'
import { validateSite } from '../packages/site-schema/src/index'
import { accountChromePreset } from '../packages/framework/src/l2/account-chrome'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { emptyPublished, publishInto, type PublishedFixture } from './fixtures/published-site'

/**
 * [[REQ-200]] — **`public-site` becomes session-aware, and only that; and
 * `1stcontact.io` becomes a published site.**
 *
 * WHAT THIS FILE IS EVIDENCE FOR. Three claims that all live in the Worker
 * rather than in the module: that reading a session selects a rendered state and
 * gates nothing; that a session issued for one cookie domain does not
 * authenticate a request on another; and that the response carrying a
 * session-dependent body never enters the cache every visitor shares.
 */

const APEX = 'apex_site_key'
const ORIGIN = 'https://1stcontact.io'
const COOKIE_DOMAIN = '1stcontact.io'

const CHROME_CONFIG = {
  signIn: 'https://app.1stcontact.io/sign-in',
  portal: 'https://app.1stcontact.io/account',
  businesses: 'https://app.1stcontact.io/builder',
}

/** A one-page site, with the chrome in a slot when `accounts` is declared. */
function siteWithChrome(accounts: boolean): Record<string, unknown> {
  return {
    id: 'apex',
    config: {
      businessName: '1st Contact',
      ...(accounts ? { capabilities: { accounts: true } } : {}),
    },
    theme: {
      typography: {
        family: { heading: 'system-ui', body: 'system-ui' },
        scale: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem', '5xl': '3rem' },
        weights: { extralight: '200', light: '300', regular: '400', medium: '500', semibold: '600', bold: '700', black: '900' },
        lineHeights: { tight: '1.1', snug: '1.33', normal: '1.5', relaxed: '1.75' },
        tracking: { normal: '0em', tight: '-0.025em', tighter: '-0.05em' },
      },
      spacing: { '0': '0', '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem', '6': '1.5rem', '8': '2rem', '12': '3rem', '16': '4rem', '24': '6rem', '32': '8rem', '48': '12rem', '64': '16rem', '80': '20rem' },
      radius: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
      shadow: { none: 'none', sm: '0 1px 2px rgba(0,0,0,0.05)', md: '0 4px 6px rgba(0,0,0,0.1)', lg: '0 10px 15px rgba(0,0,0,0.1)', xl: '0 20px 25px rgba(0,0,0,0.1)' },
      container: { sm: '24rem', md: '28rem', lg: '32rem', xl: '36rem', '2xl': '42rem', '3xl': '48rem', '4xl': '56rem', '5xl': '64rem', '6xl': '72rem', '7xl': '80rem', bleed: '100%' },
      breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    },
    nav: { pattern: 'top-tabs', entries: [] },
  }
}

function pageWithChrome(): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules: [
      {
        id: 'chrome',
        type: 'account-chrome',
        version: 1,
        slot: 'account-chrome',
        config: CHROME_CONFIG,
        slots: accountChromePreset(),
      },
    ],
    l1: {
      widths: [320, 1280],
      background: '#ffffff',
      textColor: '#111827',
      root: {
        kind: 'container',
        id: 'root',
        layout: 'stack',
        children: [{ kind: 'slot', id: 'account-chrome', name: 'account-chrome' }],
      },
    },
  }
}

/**
 * A D1 handle answering the three queries this Worker makes: which revision is
 * live, whether a session id is live, and whether its subject operates anything.
 *
 * Dispatching on the SQL rather than ignoring it, because the point of the
 * session cases is that the Worker asks the right questions of the right tables.
 */
function fakeDb(fixtureDb: { prepare(q: string): unknown }, sessions: Record<string, { operates: boolean }>) {
  return {
    prepare(query: string) {
      if (query.includes('FROM sessions')) {
        return {
          bind: (...values: unknown[]) => ({
            first: async () => (sessions[String(values[0])] ? { subject_id: String(values[0]) } : null),
          }),
        }
      }
      if (query.includes('FROM memberships')) {
        return {
          bind: (...values: unknown[]) => ({
            first: async () => (sessions[String(values[0])]?.operates ? { held: 1 } : null),
          }),
        }
      }
      return fixtureDb.prepare(query)
    },
  }
}

interface CallOpts {
  cookie?: string
  origin?: string
  method?: string
  env?: Partial<Env>
  cache?: { store: Map<string, Response>; puts: string[] }
}

async function call(
  published: PublishedFixture,
  pathAndQuery: string,
  sessions: Record<string, { operates: boolean }> = {},
  opts: CallOpts = {},
): Promise<Response> {
  const waits: Promise<unknown>[] = []
  const globals = globalThis as { caches?: unknown }
  const hadCaches = 'caches' in globals
  const previous = globals.caches
  if (opts.cache) {
    globals.caches = {
      default: {
        match: async (req: Request) => opts.cache!.store.get(req.url),
        put: async (req: Request, res: Response) => {
          opts.cache!.puts.push(req.url)
          opts.cache!.store.set(req.url, res)
        },
      },
    }
  }
  try {
    const headers = new Headers()
    if (opts.cookie) headers.set('cookie', opts.cookie)
    return await worker.fetch(
      new Request(`${opts.origin ?? ORIGIN}${pathAndQuery}`, {
        method: opts.method ?? 'GET',
        headers,
      }),
      {
        SITES: published.bucket as never,
        DB: fakeDb(published.db, sessions) as never,
        APEX_SITE_KEY: APEX,
        SESSION_COOKIE_NAME: 'session',
        SESSION_COOKIE_DOMAIN: COOKIE_DOMAIN,
        ...opts.env,
      } as Env,
      {
        waitUntil: (p: Promise<unknown>) => void waits.push(p),
        passThroughOnException: () => {},
        props: {},
      } as unknown as ExecutionContext,
    ).finally(() => Promise.all(waits))
  } finally {
    if (opts.cache) {
      if (hadCaches) globals.caches = previous
      else delete globals.caches
    }
  }
}

/** Publish a one-page site as the apex, with or without account chrome. */
async function publishApex(accounts: boolean): Promise<PublishedFixture> {
  const published = emptyPublished()
  await publishInto(published, APEX, {
    siteJson: siteWithChrome(accounts),
    pages: {
      'home.json': accounts
        ? pageWithChrome()
        : {
            id: 'home',
            slug: 'home',
            title: 'Home',
            modules: [],
            l1: {
              widths: [320, 1280],
              background: '#ffffff',
              textColor: '#111827',
              root: { kind: 'container', id: 'root', layout: 'stack', children: [] },
            },
          },
    },
    assets: {},
  })
  return published
}

describe('REQ-200 · the apex is a published site', () => {
  it('test_UAT_FC_REQ_200_apex_serves_a_published_site_and_the_literal_is_gone', async () => {
    // "`APEX_BODY = 'Hello from 1stcontact.io'` is replaced by a real published
    // 1c site." The literal is gone from the source, and `/` is that site's index.
    const source = fs.readFileSync(
      path.join(__dirname, '../apps/public-site/src/index.ts'),
      'utf8',
    )
    expect(source).not.toContain('APEX_BODY')
    expect(source).not.toContain('Hello from 1stcontact.io')

    const published = await publishApex(true)
    const res = await call(published, '/')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(await res.text()).toContain('data-account-chrome')
  })

  it('test_UAT_FC_REQ_200_apex_pages_and_assets_resolve_at_the_root', async () => {
    // A real site needs its own paths, not just `/`: its stylesheet is referenced
    // document-relatively, so it is requested at the root of the host.
    const published = await publishApex(true)
    expect(parseRoute('/theme.css')).toMatchObject({ kind: 'apex', path: 'theme.css' })
    expect((await call(published, '/theme.css')).status).toBe(200)
    // And which site the apex is comes from configuration, never from the URL.
    const unconfigured = await call(published, '/', {}, { env: { APEX_SITE_KEY: undefined } })
    expect(unconfigured.status).toBe(404)
  })

  it('test_UAT_FC_REQ_200_the_authored_apex_site_carries_the_module', () => {
    // The dogfooding claim, made concrete: the platform's own front page is a 1c
    // site definition in the repo, declaring accounts and mounting the chrome.
    const root = path.join(__dirname, '../storage/sites/1stcontact/draft')
    const site = JSON.parse(fs.readFileSync(path.join(root, 'site.json'), 'utf8'))
    const home = JSON.parse(fs.readFileSync(path.join(root, 'pages/home.json'), 'utf8'))
    expect(site.config.capabilities).toEqual({ accounts: true })
    expect(validateSite({ ...site, pages: [home] }).ok).toBe(true)

    const instance = home.modules.find((m: { type: string }) => m.type === 'account-chrome')
    expect(instance).toBeDefined()
    // Bound to a slot that exists in the page's own L1 tree.
    const header = home.l1.root.children.find((c: { id: string }) => c.id === 'header')
    expect(header.children.some((c: { name?: string }) => c.name === instance.slot)).toBe(true)
    // Its presentation is the shipped preset, materialised — so the committed
    // page cannot drift from the preset it was instantiated from.
    expect(instance.slots).toEqual(JSON.parse(JSON.stringify(accountChromePreset())))
  })
})

describe('REQ-200 · the Worker reads a session only to select a state', () => {
  it('test_UAT_FC_REQ_200_signed_out_by_default_and_signed_in_with_a_session', async () => {
    const published = await publishApex(true)

    const anonymous = await (await call(published, '/')).text()
    expect(anonymous).toContain('data-account-chrome="signed-out"')

    const signedIn = await (
      await call(published, '/', { s1: { operates: false } }, { cookie: 'session=s1' })
    ).text()
    expect(signedIn).toContain('data-account-chrome="signed-in"')
    expect(signedIn).not.toContain('data-account-chrome-businesses ')

    const operator = await (
      await call(published, '/', { s1: { operates: true } }, { cookie: 'session=s1' })
    ).text()
    expect(operator).toContain('data-account-chrome-businesses')
  })

  it('test_UAT_FC_REQ_200_no_published_content_becomes_gated', async () => {
    // The amendment is narrow: nothing is refused for want of a session, and a
    // page with no chrome is served byte-for-byte as it was published.
    const published = await publishApex(false)
    const anonymous = await call(published, '/')
    const withSession = await call(published, '/', { s1: { operates: true } }, { cookie: 'session=s1' })
    expect(anonymous.status).toBe(200)
    expect(withSession.status).toBe(200)
    expect(await anonymous.text()).toBe(await withSession.text())
    // Still an ordinary shared-cacheable page, and still carrying R2's etag.
    expect(anonymous.headers.get('cache-control')).toBe('public, max-age=60')
    expect(anonymous.headers.get('etag')).toBeTruthy()
  })

  it('test_UAT_FC_REQ_200_a_session_dependent_response_is_not_shared_cached', async () => {
    const published = await publishApex(true)
    const cache = { store: new Map<string, Response>(), puts: [] as string[] }

    const res = await call(published, '/', {}, { cache })
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.get('vary')).toBe('cookie')
    // The entity served is not the entity R2 stored, so R2's etag is withheld.
    expect(res.headers.get('etag')).toBeNull()
    expect(cache.puts).toEqual([])

    // And a page with no chrome still is cached, so the refusal is about session
    // dependence and not about turning the cache off.
    const plain = await publishApex(false)
    const plainCache = { store: new Map<string, Response>(), puts: [] as string[] }
    await call(plain, '/', {}, { cache: plainCache })
    expect(plainCache.puts).toEqual([`${ORIGIN}/`])
  })

  it('test_UAT_FC_REQ_200_a_request_with_a_session_never_reads_the_shared_cache', async () => {
    // What is stored there is the anonymous rendering; serving it to somebody
    // signed in is exactly the failure the refusal above exists to prevent.
    const published = await publishApex(true)
    const cache = {
      store: new Map<string, Response>([[`${ORIGIN}/`, new Response('STALE-ANONYMOUS')]]),
      puts: [] as string[],
    }
    const res = await call(published, '/', { s1: { operates: false } }, { cookie: 'session=s1', cache })
    expect(await res.text()).not.toContain('STALE-ANONYMOUS')
  })
})

describe('REQ-200 · a session does not cross a cookie domain', () => {
  it('test_UAT_FC_REQ_200_host_must_be_within_the_issuing_domain', () => {
    // The rule a browser uses, and the falsifier the ticket wrote down: a session
    // read that does not name the domain it was issued for.
    expect(hostInCookieDomain('1stcontact.io', '1stcontact.io')).toBe(true)
    expect(hostInCookieDomain('app.1stcontact.io', '.1stcontact.io')).toBe(true)
    // A customer's own domain cannot read the platform's session, ever.
    expect(hostInCookieDomain('alicesplumbing.com', '1stcontact.io')).toBe(false)
    // And a suffix is not a domain: the dot is what makes the match safe.
    expect(hostInCookieDomain('not1stcontact.io', '1stcontact.io')).toBe(false)
    expect(hostInCookieDomain('1stcontact.io.evil.test', '1stcontact.io')).toBe(false)
    // A deployment that issues no domain issues host-only cookies this Worker
    // is not the issuer of.
    expect(hostInCookieDomain('1stcontact.io', undefined)).toBe(false)
  })

  it('test_UAT_FC_REQ_200_a_cookie_from_another_domain_authenticates_nothing', async () => {
    const config = { name: 'session', domain: COOKIE_DOMAIN }
    const headers = { cookie: 'session=s1' }
    expect(readSessionId(new Request(`${ORIGIN}/`, { headers }), config)).toBe('s1')
    expect(
      readSessionId(new Request('https://alicesplumbing.com/', { headers }), config),
    ).toBeNull()
    // Nor does a deployment that issues no sessions read one.
    expect(readSessionId(new Request(`${ORIGIN}/`, { headers }), { domain: COOKIE_DOMAIN })).toBeNull()

    // End to end: the same cookie on the customer's own host renders signed out.
    const published = await publishApex(true)
    const elsewhere = await call(
      published,
      '/',
      { s1: { operates: true } },
      { cookie: 'session=s1', origin: 'https://alicesplumbing.com' },
    )
    expect(await elsewhere.text()).toContain('data-account-chrome="signed-out"')
  })
})
