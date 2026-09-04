import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import publicSite from '../apps/public-site/src/index'
import type { Env as PublicEnv } from '../apps/public-site/src/index'
import { projectKnowledgeFor, type KnowledgeHit } from '../apps/control-app/src/knowledge'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { CLIENT_DESCRIBER } from '../apps/control-app/src/material'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'
import { bytesOf } from './support/material-fixtures'

/**
 * Reconciliation UATs for story-f775289b — **the Library's ORIGIN half**, the
 * seven criteria whose observable is a response, a stored record or a search
 * result rather than a rendered pane.
 *
 *   AC-1563 — a correction is kept, and a fresh read shows the client's words.
 *   AC-1564 — a correction is what SEARCH answers with afterwards.
 *   AC-1565 — a correction is attributed to the client, and leaves the
 *             degraded-description query a re-describe pass selects on.
 *   AC-1566 — an empty correction is refused with a reason, and what was there
 *             survives.
 *   AC-1568 — the listing carries every row field and NO descriptions; the item
 *             carries the description.
 *   AC-1569 — the bytes come back as themselves, from the private store, and
 *             the public site host cannot reach them at all.
 *   AC-1570 — every identifier-taking route answers *not found* for anything
 *             that is not this account's material, identically.
 *
 * Its sibling `reconciliation-library-material-surface.test.ts` carries the six
 * criteria about the SURFACE (AC-1558…AC-1562, AC-1567), which need a DOM and
 * therefore the node project. The split is the runtime, not a preference: these
 * claims are only real against genuine D1 and R2 bindings, which exist only
 * inside workerd.
 *
 * EVERYTHING GOES THROUGH `route()`. The blob is stored by the ticketing
 * component's own `attach`, the row by its own validator, the vectors by the
 * knowledge component's own index. Nothing here reimplements a step to assert it.
 *
 * ONE DOUBLE, AND IT IS THE EMBEDDER (`tests/support/stub-embedder.ts` argues it
 * at length): miniflare has no local Workers AI, and no claim below is about the
 * quality of an embedding. The describer is left ABSENT rather than stubbed
 * wherever the claim is about a degraded description — absent is the state the
 * claim is about.
 */

const APPLIED = applySchema()

function routerEnv(tenantId: string, over: Partial<RouterEnv> = {}): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...over,
  }
}

/** No describer, and an indexer that only counts — the default for most claims. */
function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return { index: async () => async () => {}, ...over }
}

async function upload(
  tenant: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string; slug?: string },
  d: RouterDeps = deps(),
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  if (file.role !== undefined) form.append('role', file.role)
  if (file.slug) form.append('slug', file.slug)
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(tenant),
    d,
  )
}

/** A GET on the builder origin, as the Library's own transport makes it. */
function get(tenant: string, pathAndQuery: string, d: RouterDeps = deps()): Promise<Response> {
  return route(new Request(`https://app.test${pathAndQuery}`), routerEnv(tenant), d)
}

/** A correction, exactly as `saveMaterialDescription` in `api.js` sends one. */
function correct(
  tenant: string,
  payload: Record<string, unknown>,
  d: RouterDeps = deps(),
): Promise<Response> {
  return route(
    new Request('https://app.test/api/material/description', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    routerEnv(tenant),
    d,
  )
}

async function body(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

beforeAll(async () => {
  await APPLIED
})

describe('story-f775289b — the listing draws the list; the item carries the words', () => {
  it('test_UAT_AC1568_the_listing_carries_every_row_field_and_no_descriptions', async () => {
    const tenant = 'story-f775289b-ac1568'
    // A DISTINCTIVE PHRASE, so "the description is not in the listing" is a
    // claim about the payload rather than about a listing that happens to be
    // short. The body of a text material IS the extracted text.
    //
    // DELIBERATELY BELOW THE FIRST LINE. A text material's title is derived
    // from its opening line, and the title is a row field the list legitimately
    // carries — so a phrase planted in the first line would be found in the
    // listing for a reason that has nothing to do with descriptions.
    const PHRASE = 'the only late-night bakery on Fettes Row'
    const created = await body(
      await upload(tenant, {
        bytes: bytesOf(
          `Positioning paper\n\nWho we are for: people walking home.\nWhat we claim: we are ${PHRASE}, and we say so first.\n`,
        ),
        name: 'positioning.txt',
        type: 'text/plain',
        role: 'reference',
      }),
    )

    const listed = await get(tenant, '/api/material')
    const listedText = await listed.clone().text()
    const rows = (await body(listed)).material as Array<Record<string, unknown>>
    expect(rows).toHaveLength(1)
    const row = rows[0]

    // EVERYTHING NEEDED TO DRAW AND NARROW THE LIST, present as a key — asserted
    // by presence rather than by value, because `role`, `site_slug` and
    // `source_url` are legitimately null and an absent key and a null one are
    // different things to a browser that filters on them.
    for (const field of [
      'uid',
      'filename',
      'title',
      'kind',
      'role',
      'rights',
      'republishable',
      'origin',
      'source_url',
      'site_slug',
      'description_status',
      'updated_at',
    ]) {
      expect(row, field).toHaveProperty(field)
    }
    expect(row.uid).toBe(created.uid)
    expect(row.filename).toBe('positioning.txt')
    expect(row.kind).toBe('document')
    expect(row.role).toBe('reference')
    expect(row.rights).toBe('owned')
    expect(row.republishable).toBe(false)
    expect(row.origin).toBe('uploaded')
    expect(row.description_status).toBe('ok')

    // AND NO DESCRIPTIONS, ANYWHERE IN THE RESPONSE. A brand book runs to tens
    // of kilobytes of extracted text, so a listing that carried bodies would
    // ship the account's whole corpus to draw a column of names.
    expect(row.body).toBeUndefined()
    expect(listedText).not.toContain(PHRASE)

    // The item route is where the description lives — the same row, plus it.
    const item = await body(await get(tenant, `/api/material/item?uid=${created.uid}`))
    for (const field of ['uid', 'filename', 'title', 'kind', 'role', 'rights', 'republishable']) {
      expect(item[field], field).toEqual(row[field])
    }
    expect(String(item.body)).toContain(PHRASE)
  })
})

describe('story-f775289b — the bytes come back as themselves', () => {
  it('test_UAT_AC1569_the_file_is_served_inline_from_the_private_store_and_not_the_public_host', async () => {
    const tenant = 'story-f775289b-ac1569'
    const BYTES = bytesOf('<svg xmlns="http://www.w3.org/2000/svg"><title>wordmark</title></svg>')
    const created = await body(
      await upload(tenant, {
        bytes: BYTES,
        name: 'wordmark.svg',
        type: 'image/svg+xml',
        role: 'site',
      }),
    )

    const file = await get(tenant, `/api/material/file?uid=${created.uid}`)
    expect(file.status).toBe(200)
    // AS ITSELF: the recorded content type, not a guess and not a download.
    expect(file.headers.get('content-type')).toBe('image/svg+xml')
    const disposition = file.headers.get('content-disposition') ?? ''
    expect(disposition).toContain('inline')
    expect(disposition).not.toContain('attachment')
    // Carrying the name it arrived under, so a save from the pane keeps it.
    expect(disposition).toContain('filename="wordmark.svg"')
    expect(new Uint8Array(await file.arrayBuffer())).toEqual(BYTES)

    // NOT ON THE PUBLIC HOST. `public-site`'s own `Env` has SITES and DB and no
    // BLOBS binding at all ([[DOC-38]] §7.1) — giving it one to save a hop is
    // exactly the disclosure that boundary exists to prevent. Driven through
    // that Worker's real entry point with its real bindings.
    const waits: Promise<unknown>[] = []
    const ctx = {
      waitUntil: (p: Promise<unknown>) => void waits.push(p),
      passThroughOnException: () => {},
      props: {},
    }
    const fromPublic = await publicSite.fetch(
      new Request(`https://sites.example/api/material/file?uid=${created.uid}`),
      { SITES: env.SITES, DB: env.DB } as PublicEnv,
      ctx as unknown as ExecutionContext,
    )
    await Promise.all(waits)
    expect(fromPublic.status).not.toBe(200)
    expect(await fromPublic.text()).not.toContain('wordmark')

    // AND NOT ACROSS ACCOUNTS. The barrier is the store handle's own tenant
    // binding, and this is the surface that would leak it if it were not.
    const fromOther = await get('story-f775289b-ac1569-other', `/api/material/file?uid=${created.uid}`)
    expect(fromOther.status).not.toBe(200)
  })
})

describe('story-f775289b — the read routes are not an oracle', () => {
  it('test_UAT_AC1570_a_uid_that_is_not_this_accounts_material_is_not_found_on_every_route', async () => {
    const tenant = 'story-f775289b-ac1570'
    const store = await ticketStoreFor(routerEnv(tenant))
    // A RECORD OF ANOTHER KIND, held by the SAME account — the conversation the
    // criterion names. It exists, so "not found" here is genuinely a statement
    // about this surface's reach rather than about the account being empty.
    const CONVERSATION_BODY = 'Decisions taken so far in this conversation.'
    const { ticket: conversation } = await store.create({
      type: 'chat',
      title: 'Building the landing page',
      body: CONVERSATION_BODY,
      fields: { session_id: 'sess-story-f775289b', backend: 'claude' },
    })
    const ABSENT = 'ticket-0000000000000000000000000000'

    /** One route, asked for a uid, reduced to what a caller can observe. */
    async function ask(kind: 'item' | 'file' | 'description', uid: string) {
      const response =
        kind === 'description'
          ? await correct(tenant, { uid, body: 'rewritten from outside' })
          : await get(tenant, `/api/material/${kind}?uid=${uid}`)
      const text = await response.text()
      return {
        status: response.status,
        // The uid is the ONE thing the two answers may legitimately differ by —
        // it is the caller's own input echoed back. Normalising it is what turns
        // "the messages look similar" into "the messages are the same message".
        shape: text.split(uid).join('<uid>'),
      }
    }

    for (const kind of ['item', 'file', 'description'] as const) {
      const other = await ask(kind, conversation.uid)
      const nothing = await ask(kind, ABSENT)

      // NOT FOUND, AND NOT FORBIDDEN. Answering 403 for the record that exists
      // and 404 for the one that does not would make the surface an enumerator
      // for which identifiers the account holds.
      expect(other.status, `${kind}: a record of another kind`).toBe(404)
      expect(nothing.status, `${kind}: a uid naming nothing`).toBe(404)
      expect(other.status, `${kind}: never forbidden`).not.toBe(403)
      expect(nothing.status, `${kind}: never forbidden`).not.toBe(403)
      // …and nothing else in the response separates the two cases either.
      expect(nothing.shape, `${kind}: the two answers are indistinguishable`).toBe(other.shape)
    }

    // The refused correction did not touch the conversation it named.
    expect((await store.get({ uid: conversation.uid })).ticket.body).toBe(CONVERSATION_BODY)

    // A MISSING IDENTIFIER IS A DIFFERENT REFUSAL, and says which one is missing
    // — conflating it with "not found" would tell a caller their uid was wrong
    // when they never sent one.
    for (const request of [
      get(tenant, '/api/material/item'),
      get(tenant, '/api/material/file'),
      correct(tenant, { body: 'no uid at all' }),
    ]) {
      const response = await request
      expect(response.status).toBe(400)
      expect(response.status).not.toBe(404)
      expect(String((await body(response)).error)).toMatch(/uid is required/)
    }
  })
})

describe('story-f775289b — the client corrects what we said their material is', () => {
  it('test_UAT_AC1563_a_correction_is_kept_and_is_what_a_fresh_read_shows', async () => {
    const tenant = 'story-f775289b-ac1563'
    const created = await body(
      await upload(tenant, {
        bytes: bytesOf('Our tone is warm, direct, and never salesy.'),
        name: 'tone.txt',
        type: 'text/plain',
        role: 'reference',
      }),
    )
    expect(String(created.description_status)).toBe('ok')

    const CLIENT_TEXT = 'How we talk to people: warm, plain, and short. No exclamation marks.'
    // ONE CALL AND NO CONFIRMATION STEP — the pane commits on blur, so a second
    // "are you sure" round trip would be a step the surface does not offer.
    const saved = await correct(tenant, { uid: created.uid, body: CLIENT_TEXT })
    expect(saved.status).toBe(200)
    expect((await body(saved)).body).toBe(CLIENT_TEXT)

    // A FRESH READ OF THE ACCOUNT. `ticketStoreFor` builds a new handle per
    // request, so this GET reaches D1 again rather than a cached row — which is
    // what "come back to it later" actually means.
    const reopened = await body(await get(tenant, `/api/material/item?uid=${created.uid}`))
    expect(reopened.body).toBe(CLIENT_TEXT)
    expect(String(reopened.body)).not.toContain('never salesy')

    // …and it is the stored record that changed, not just the response.
    const store = await ticketStoreFor(routerEnv(tenant))
    expect((await store.get({ uid: String(created.uid) })).ticket.body).toBe(CLIENT_TEXT)
  })

  it('test_UAT_AC1565_a_correction_is_attributed_to_the_client_and_leaves_the_degraded_query', async () => {
    const tenant = 'story-f775289b-ac1565'
    // NO DESCRIBER, which is the state the correction exists for: an image
    // nothing has looked at, stored, honest about it, unfindable by contents.
    const created = await body(
      await upload(
        tenant,
        { bytes: bytesOf('jpeg-ish bytes'), name: 'DSC_4821.jpg', type: 'image/jpeg', role: 'site' },
        deps({ describeImage: undefined }),
      ),
    )
    expect(created.description_status).toBe('no_describer')

    const store = await ticketStoreFor(routerEnv(tenant))
    /**
     * The query a re-describe pass is a SELECTION by rather than a migration —
     * [[REQ-163]] declared `description_status` precisely so it could be one.
     */
    const degraded = async () =>
      (await store.list({ type: 'material', limit: 'all' })).tickets
        .filter((t) => t.fields.description_status !== 'ok')
        .map((t) => t.uid)

    expect(await degraded()).toContain(String(created.uid))

    const corrected = await body(
      await correct(tenant, {
        uid: created.uid,
        body: 'The courtyard at dusk, with the tables laid for service.',
      }),
    )

    // THE DESCRIPTION IS NOW A REAL ONE, AND IT IS THEIRS. `description_model`
    // naming the client rather than a model is what makes the correction
    // survive: a pass that re-describes degraded material must not overwrite a
    // description the client wrote themselves.
    expect(corrected.description_status).toBe('ok')
    expect(corrected.description_model).toBe(CLIENT_DESCRIBER)
    expect(String(corrected.description_model)).not.toMatch(/claude|gpt|stub|vision|unpdf/i)
    expect(await degraded()).not.toContain(String(created.uid))
  })

  it('test_UAT_AC1566_an_empty_correction_is_refused_and_the_description_that_was_there_survives', async () => {
    const tenant = 'story-f775289b-ac1566'
    const embedder = stubEmbedder()
    const kb = await projectKnowledgeFor(routerEnv(tenant), { embedder, defer: () => {} })
    const index = async () => async () => void (await kb.onMaterialWritten())

    const PHRASE = 'sourdough proved for thirty-six hours in the cellar'
    const created = await body(
      await upload(
        tenant,
        {
          bytes: bytesOf(`Our method: ${PHRASE}, then baked at dawn.`),
          name: 'method.txt',
          type: 'text/plain',
          role: 'reference',
        },
        { index },
      ),
    )
    const store = await ticketStoreFor(routerEnv(tenant))
    const stored = (await store.get({ uid: String(created.uid) })).ticket.body

    // BOTH SHAPES OF NOTHING. An empty string and a run of whitespace are the
    // same submission to a client, and a surface that accepted the second would
    // let them silently delete their own file from search while it sat in the
    // Library looking present.
    for (const nothing of ['', '   \n\t  \n']) {
      const response = await correct(tenant, { uid: created.uid, body: nothing }, { index })
      expect(response.status, JSON.stringify(nothing)).toBe(400)
      // The reason, in the client's own terms: the description is the only
      // thing that makes the file findable.
      expect(String((await body(response)).error)).toMatch(/only thing that makes this file findable/)
      // Byte-identical, not merely non-empty.
      expect((await store.get({ uid: String(created.uid) })).ticket.body).toBe(stored)
    }

    // AND IT IS STILL FINDABLE BY WHAT IT SAID BEFORE — the claim the refusal
    // exists to protect. Asserted through retrieval rather than through the
    // stored row, because [[DOC-39]] §4 is explicit that the index and not the
    // body is what search sees.
    const hits = await kb.search(PHRASE)
    expect(hits.map((hit) => hit.uid)).toContain(String(created.uid))
  })

  it('test_UAT_AC1564_a_corrected_description_is_what_search_answers_with_afterwards', async () => {
    const tenant = 'story-f775289b-ac1564'
    const embedder = stubEmbedder()
    const kb = await projectKnowledgeFor(routerEnv(tenant), { embedder, defer: () => {} })
    const index = async () => async () => void (await kb.onMaterialWritten())

    // A DISTRACTOR FIRST, so the claims below are about RANKING and not about a
    // store with one row in it: a knowledge base holding a single document
    // returns that document for any query at all.
    await upload(
      tenant,
      {
        bytes: bytesOf('Suppliers deliver flour on Tuesdays and the mill invoices monthly.'),
        name: 'suppliers.txt',
        type: 'text/plain',
        role: 'reference',
      },
      { index },
    )

    const OURS = 'a gold wordmark on a cream field, photographed flat'
    const THEIRS = 'the courtyard at dusk with the tables laid for service'
    const created = await body(
      await upload(
        tenant,
        { bytes: bytesOf(`Description: ${OURS}.`), name: 'shot.txt', type: 'text/plain', role: 'site' },
        { index },
      ),
    )

    const uid = String(created.uid)
    /**
     * One ranked search, and how strongly this material matched it.
     *
     * THE RAW COSINE, not the ranked `score`. The ranked one folds in a recency
     * boost, and a correction moves the material's `updated_at` — so it would
     * rise against BOTH phrasings for a reason that has nothing to do with what
     * the client wrote. `semantic` is the part that can only move if the words
     * in the index changed. Upstream returns it on every row; this repository's
     * `KnowledgeHit` does not declare it, hence the widening.
     */
    type RankedHit = KnowledgeHit & { semantic: number }
    const searchFor = async (query: string) => (await kb.search(query)) as RankedHit[]
    const rankOf = (hits: RankedHit[]) => hits.findIndex((hit) => hit.uid === uid)
    /**
     * THE CLAIM IS MOVEMENT, not membership. Every indexed document is scored
     * against every query, so "it comes back" is true of a corpus of two before
     * anyone has written anything. What cannot be true unless the correction
     * reached the INDEX is that the same material's match against the two
     * phrasings SWAPS.
     */
    const scoreOf = (hits: RankedHit[]) => hits.find((hit) => hit.uid === uid)?.semantic ?? 0

    // WHAT WE SAID IS WHAT SEARCH ANSWERS WITH, BEFORE.
    const oursBefore = scoreOf(await searchFor(OURS))
    const theirsBefore = scoreOf(await searchFor(THEIRS))
    expect(rankOf(await searchFor(OURS)), 'our words find it before').toBe(0)
    expect(oursBefore).toBeGreaterThan(0)

    const corrected = await correct(tenant, { uid, body: `Description: ${THEIRS}.` }, { index })
    expect(corrected.status).toBe(200)

    // THE SEARCH THAT FOLLOWS IT, with no pass to wait for: the index refresh is
    // awaited inside the write, which is the only thing that can make this true.
    // The distractor is what makes the ranking claim about ranking rather than
    // about a store with one row in it.
    expect(scoreOf(await searchFor(THEIRS)), 'the client’s words match it more').toBeGreaterThan(
      theirsBefore,
    )
    expect(rankOf(await searchFor(THEIRS)), 'and are the best answer to them').toBe(0)

    // …and the words we wrote no longer carry it. Their match collapsed with the
    // description they belonged to, which is the half that would still pass if
    // the correction had reached the body and not the index.
    expect(scoreOf(await searchFor(OURS)), 'our replaced words no longer match it').toBeLessThan(
      oursBefore,
    )
  })
})
