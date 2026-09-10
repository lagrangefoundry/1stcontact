/**
 * story-e674c60a AC-1401 — **what a route answers, declared once for both front
 * doors.**
 *
 * THE PROBLEM THIS SOLVES. `1c builder` is a transport over the workspace's one
 * route table, not a second origin. The evidence for that used to be an
 * *absence* — the local door's source intercepts no route the workspace defines
 * — which is real but weak: two doors can share a table and still disagree about
 * what a route returns, because each wraps the table in its own status handling,
 * header defaults and body serialisation. The claim is only observable if both
 * doors are actually driven and their answers compared.
 *
 * WHY A DECLARATION RATHER THAN A SIDE-BY-SIDE LOOP. The two doors cannot run in
 * one file. `vitest.config.mts` routes `*.workers.test.ts` into workerd (its own
 * pool) and everything else into node: a workerd test has no `node:http` and so
 * cannot stand up `startBuilder`, and the node pool has no D1 or R2 binding and
 * so cannot give the deployed Worker a store. So the comparison is made through
 * a single shared statement instead of a single shared process — each door
 * asserts its own answer against the SAME declaration below, which is what makes
 * "the same request produces the same status, content type and shape of answer
 * from both" checkable. Neither file can weaken it alone: the declaration is the
 * only place the expectation exists, and both import it.
 *
 * WHY THE BODIES ARE SUMMARISED RATHER THAN COMPARED. The two doors read
 * different stores — the local one an operator's filesystem, the deployed one D1
 * and R2 — so their bytes differ by construction, and that difference is the
 * ticket's subject rather than a defect. What must not differ is the SHAPE of
 * the answer, so each route reduces its body to a small door-independent
 * descriptor and the descriptor is what is declared.
 */

/** The classes AC-1401 requires the sweep to span. */
export type RouteClass = 'document' | 'read' | 'write' | 'render'

export interface ContractRoute {
  /** Names the route in an assertion message. */
  name: string
  klass: RouteClass
  /** The request, given the slug the door under test was seeded with. */
  path: (slug: string) => string
  init?: (slug: string) => RequestInit
  /** Status and content type both doors must produce, verbatim. */
  status: number
  contentType: string
  /** A body reduced to what does not depend on which store answered. */
  shape: (body: string, slug: string) => Record<string, unknown>
  /** The descriptor both doors must produce. */
  expected: Record<string, unknown>
}

/**
 * The freshness directive the ROUTE TABLE sets (AC-977). Included in the
 * comparison because a door that set it itself would be a door with behaviour of
 * its own — exactly what this criterion denies.
 */
export const FRESHNESS = 'no-store, must-revalidate'

/** The palette entry the write route lands, and the read-back looks for. */
export const WRITTEN_TOKEN = { name: 'accent', value: '#0f172a' } as const

/**
 * A representative route of every class AC-1401 names, in the order they must be
 * driven — the write precedes its read-back, which is what makes the read-back
 * evidence that something was actually stored.
 */
export const TRANSPORT_CONTRACT: ContractRoute[] = [
  {
    name: 'the workspace document',
    klass: 'document',
    path: () => '/',
    status: 200,
    contentType: 'text/html; charset=utf-8',
    shape: (body) => ({
      importmap: body.includes('<script type="importmap">'),
      client: body.includes('/builder/main.js'),
      doctype: /^<!doctype html/i.test(body.trim()),
    }),
    expected: { importmap: true, client: true, doctype: true },
  },
  {
    name: 'a route that READS the store',
    klass: 'read',
    path: () => '/api/sites',
    status: 200,
    contentType: 'application/json; charset=utf-8',
    shape: (body, slug) => {
      const sites = JSON.parse(body) as { slug: string }[]
      return {
        isArray: Array.isArray(sites),
        everyEntryHasASlug: sites.every((s) => typeof s.slug === 'string'),
        holdsTheSeededSite: sites.some((s) => s.slug === slug),
      }
    },
    expected: { isArray: true, everyEntryHasASlug: true, holdsTheSeededSite: true },
  },
  {
    name: 'a route that WRITES the store',
    klass: 'write',
    path: () => '/api/palette',
    init: (slug) => ({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, op: 'add', ...WRITTEN_TOKEN }),
    }),
    status: 200,
    contentType: 'application/json; charset=utf-8',
    shape: (body) => ({ parses: typeof JSON.parse(body) === 'object' }),
    expected: { parses: true },
  },
  {
    name: "the write's read-back",
    klass: 'write',
    path: (slug) => `/api/palette?slug=${slug}`,
    status: 200,
    contentType: 'application/json; charset=utf-8',
    shape: (body) => {
      const palette = JSON.parse(body) as { entries: { name: string; value: string }[] }
      return {
        carriesTheWrittenToken: palette.entries.some(
          (e) => e.name === WRITTEN_TOKEN.name && e.value === WRITTEN_TOKEN.value,
        ),
      }
    },
    expected: { carriesTheWrittenToken: true },
  },
  {
    name: 'a route that RENDERS',
    klass: 'render',
    path: (slug) => `/preview/${slug}/draft/`,
    status: 200,
    contentType: 'text/html; charset=utf-8',
    shape: (body) => ({
      doctype: /^<!doctype html/i.test(body.trim()),
      referencesItsPresentation: body.includes('theme.css'),
      nonEmpty: body.length > 0,
    }),
    expected: { doctype: true, referencesItsPresentation: true, nonEmpty: true },
  },
]

/**
 * One door's answer to one contract route, in the form that gets compared.
 *
 * Returned rather than asserted so the caller owns the failure message and can
 * name which door produced it.
 */
export async function answerOf(
  res: Response,
  route: ContractRoute,
  slug: string,
): Promise<Record<string, unknown>> {
  const body = await res.text()
  let shape: Record<string, unknown> | string
  try {
    shape = route.shape(body, slug)
  } catch (err) {
    // A body that cannot even be reduced is a disagreement worth reading, so it
    // is reported as the shape rather than thrown as a parse error.
    shape = `unreadable: ${err instanceof Error ? err.message : String(err)}`
  }
  return {
    status: res.status,
    contentType: res.headers.get('content-type'),
    freshness: res.headers.get('cache-control'),
    shape,
  }
}

/** The answer the declaration says BOTH doors must produce for this route. */
export function declaredAnswer(route: ContractRoute): Record<string, unknown> {
  return {
    status: route.status,
    contentType: route.contentType,
    freshness: FRESHNESS,
    shape: route.expected,
  }
}
