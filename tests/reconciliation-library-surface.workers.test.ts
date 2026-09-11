import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { PROJECT_KB, projectKnowledgeFor } from '../apps/control-app/src/knowledge'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { CLIENT_DESCRIBER } from '../apps/control-app/src/material'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'

/**
 * story-1500b111 — **the read/write surface the Library tab is written against**
 * — the origin half.
 *
 * WHAT THIS FILE PROVES. Its sibling (`reconciliation-library-tab.test.ts`) is
 * the browser surface: the tab, the badge, the filters, the read-only rights
 * record. This one is the CONTRACT underneath it — what the list carries and
 * what it deliberately does not, what a material's bytes come back as, what a
 * corrected description does to the record AND to retrieval, and what any of the
 * four operations says to a uid that is not this account's material.
 *
 * EVERY ASSERTION GOES THROUGH `route()` — the Worker's own route table, at its
 * own entry points — against a real D1 database and two real R2 buckets supplied
 * by `@cloudflare/vitest-pool-workers`. The bytes are stored by the ticketing
 * component's own `attach`, the material row is written and validated by its own
 * type pack, the vectors are built by the knowledge component's own index.
 * Nothing here reimplements a step of the pipeline in order to assert it.
 *
 * ONE DOUBLE, AND IT IS THE EMBEDDER — `tests/support/stub-embedder.ts` argues it
 * at length, and the short form is that miniflare has no local Workers AI to
 * reach and no criterion below is about the quality of an embedding. The vision
 * describer is left ABSENT rather than stubbed wherever the claim is about
 * material nothing has described, because absent is the state the claim is about.
 *
 * WHERE THE RECORD IS READ BACK FROM. The criteria that assert a record is
 * unchanged, or that a later pass would not select it, re-open the store with
 * `ticketStoreFor` and read by uid. An envelope that echoed its own input would
 * satisfy a weaker test while proving nothing about what was stored.
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

/** Whatever the caller says, as bytes. */
function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text)
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

async function body(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

/** Read the list route as the Library's list pane does. */
async function listMaterial(tenant: string): Promise<Array<Record<string, unknown>>> {
  const answered = await body(
    await route(new Request('https://app.test/api/material'), routerEnv(tenant), deps()),
  )
  return answered.material as Array<Record<string, unknown>>
}

/** Read one piece of material in full, as selecting a row does. */
async function readItem(tenant: string, uid: string): Promise<Response> {
  return route(
    new Request(`https://app.test/api/material/item?uid=${encodeURIComponent(uid)}`),
    routerEnv(tenant),
    deps(),
  )
}

/** Correct a description, as committing the one editable field does. */
async function correct(
  tenant: string,
  uid: string,
  text: string,
  d: RouterDeps = deps(),
): Promise<Response> {
  return route(
    new Request('https://app.test/api/material/description', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uid, body: text }),
    }),
    routerEnv(tenant),
    d,
  )
}

beforeAll(async () => {
  await APPLIED
})

describe('AC-1722 — the list is rows without descriptions; the item adds one; neither leaves the account', () => {
  it('test_UAT_AC1722_list_returns_bodiless_rows_newest_first_and_the_item_adds_the_description', async () => {
    const tenant = 'story1500b111-list'
    const site = 'story1500b111a'

    // ONE BOUND TO NO SITE AND ONE BOUND TO A SITE, uploaded in that order, so
    // "newest first" is a claim with something to be wrong about.
    const unbound = await body(
      await upload(tenant, {
        bytes: bytesOf('positioning: the only late-night bakery in the town'),
        name: 'positioning.txt',
        type: 'text/plain',
        role: 'reference',
      }),
    )
    const bound = await body(
      await upload(tenant, {
        bytes: bytesOf('the wordmark'),
        name: 'wordmark.svg',
        type: 'image/svg+xml',
        role: 'site',
        slug: site,
      }),
    )

    const rows = await listMaterial(tenant)
    expect(rows).toHaveLength(2)

    // NEWEST FIRST.
    expect(rows.map((row) => row.uid)).toEqual([bound.uid, unbound.uid])

    // ENOUGH TO DRAW AND FILTER A LIST: identity, title, filename, kind, what it
    // is for, its rights record, whether it may appear on the site, which site it
    // is bound to (or nothing), how its description came to be, and when it last
    // changed.
    const wordmark = rows.find((row) => row.uid === bound.uid)!
    const positioning = rows.find((row) => row.uid === unbound.uid)!
    expect(wordmark.filename).toBe('wordmark.svg')
    expect(wordmark.kind).toBe('image')
    expect(wordmark.role).toBe('site')
    expect(wordmark.rights).toBe('owned')
    expect(wordmark.republishable).toBe(true)
    expect(wordmark.exportable).toBe(false)
    expect(wordmark.origin).toBe('uploaded')
    expect(wordmark.site_slug).toBe(site)
    expect(typeof wordmark.title).toBe('string')
    expect(typeof wordmark.updated_at).toBe('string')
    expect(Object.keys(wordmark)).toContain('description_status')
    expect(Object.keys(wordmark)).toContain('description_model')
    // Bound to NO site, and the row says so rather than omitting the axis.
    expect(positioning.site_slug).toBeNull()
    expect(positioning.role).toBe('reference')

    // AND CARRYING NO DESCRIPTIONS. A description is a document's extracted text,
    // so a list that carried them would ship the client's whole corpus to draw a
    // column of filenames.
    for (const row of rows) expect(row.body).toBeUndefined()

    // ASKING FOR ONE RETURNS THE SAME ROW PLUS ITS DESCRIPTION.
    const item = await body(await readItem(tenant, String(positioning.uid)))
    expect(item.uid).toBe(positioning.uid)
    expect(item.filename).toBe('positioning.txt')
    expect(item.site_slug).toBeNull()
    expect(String(item.body)).toContain('late-night bakery')

    // BOTH ANSWERS ARE CONFINED TO THE ACCOUNT ASKING. This is the first surface
    // that shows a client their own files, and therefore the one that would leak
    // another client's if the binding were not real.
    expect(await listMaterial('story1500b111-other')).toHaveLength(0)
    const acrossAccounts = await readItem('story1500b111-other', String(bound.uid))
    expect(acrossAccounts.status).not.toBe(200)
  })
})

describe('AC-1723 — a material’s file comes back as itself', () => {
  it('test_UAT_AC1723_the_file_route_returns_the_stored_bytes_inline_under_their_own_name', async () => {
    const tenant = 'story1500b111-file'
    const contents = '<svg xmlns="http://www.w3.org/2000/svg"/>'
    const created = await body(
      await upload(tenant, {
        bytes: bytesOf(contents),
        name: 'mark.svg',
        type: 'image/svg+xml',
        role: 'site',
      }),
    )

    const file = await route(
      new Request(`https://app.test/api/material/file?uid=${created.uid}`),
      routerEnv(tenant),
      deps(),
    )
    expect(file.status).toBe(200)
    // THE STORED BYTES, UNCHANGED.
    expect(await file.text()).toBe(contents)
    // DECLARED WITH THE TYPE THEY WERE STORED UNDER.
    expect(file.headers.get('content-type')).toBe('image/svg+xml')
    // MARKED FOR DISPLAY IN PLACE, carrying the original name — a bare
    // `attachment` would turn the detail pane's preview into a download prompt.
    const disposition = file.headers.get('content-disposition') ?? ''
    expect(disposition).toContain('inline')
    expect(disposition).toContain('mark.svg')

    // MATERIAL CARRYING NO ATTACHED FILE IS ANSWERED WITH A STATEMENT THAT IT HAS
    // NONE, NAMING IT — never with empty bytes, which the pane would render as a
    // broken preview and the client would read as a lost file.
    const store = await ticketStoreFor(routerEnv(tenant))
    const { ticket } = await store.create({
      type: 'material',
      title: 'A record with nothing attached',
      body: 'Described, but the bytes never arrived.',
      fields: {
        kind: 'document',
        rights: 'owned',
        republishable: false,
        exportable: false,
        origin: 'uploaded',
      },
    })
    const empty = await route(
      new Request(`https://app.test/api/material/file?uid=${ticket.uid}`),
      routerEnv(tenant),
      deps(),
    )
    expect(empty.status).toBe(400)
    const refusal = String((await body(empty)).error)
    expect(refusal).toMatch(/no file attached/i)
    expect(refusal).toContain(ticket.uid)
  })
})

describe('AC-1724 — a uid that is not this account’s material is answered not-found, and a write so answered changes nothing', () => {
  it('test_UAT_AC1724_every_library_operation_answers_not_found_and_leaves_the_named_record_alone', async () => {
    const tenant = 'story1500b111-scope'
    const store = await ticketStoreFor(routerEnv(tenant))

    // A RECORD OF ANOTHER KIND IN THE SAME ACCOUNT. The account barrier is not
    // what is under test here — this is the other half: a uid off the wire must
    // not reach a different KIND of thing through a surface built for material.
    const { ticket } = await store.create({
      type: 'brief',
      title: 'The brief',
      body: 'Decisions taken so far.',
      fields: { site_slug: 'somewhere' },
    })

    // READING ONE PIECE OF MATERIAL, AND SERVING ITS FILE.
    const item = await readItem(tenant, ticket.uid)
    expect(item.status).toBe(404)
    const file = await route(
      new Request(`https://app.test/api/material/file?uid=${ticket.uid}`),
      routerEnv(tenant),
      deps(),
    )
    expect(file.status).toBe(404)

    // AND WRITING A CORRECTED DESCRIPTION — the operation where the refusal also
    // protects a record of another kind from being rewritten through a surface
    // built for material.
    const written = await correct(tenant, ticket.uid, 'rewritten from outside')
    expect(written.status).toBe(404)

    // 404 AND NOT 403 on every one of them: a refusal that distinguished "exists
    // but is not yours to read here" from "does not exist" would make these
    // operations an oracle for which records the account holds.
    expect([item.status, file.status, written.status]).toEqual([404, 404, 404])

    // THE RECORD NAMED KEEPS THE CONTENT IT HAD.
    expect((await store.get({ uid: ticket.uid })).ticket.body).toBe('Decisions taken so far.')

    // AND A UID THAT NAMES NOTHING AT ALL IS ANSWERED IDENTICALLY.
    const absent = 'material-000000000000000000000000'
    expect((await readItem(tenant, absent)).status).toBe(404)
    expect(
      (
        await route(
          new Request(`https://app.test/api/material/file?uid=${absent}`),
          routerEnv(tenant),
          deps(),
        )
      ).status,
    ).toBe(404)
    expect((await correct(tenant, absent, 'a description for nothing')).status).toBe(404)
  })
})

describe('AC-1721 — an empty description is refused, and the stored one is untouched', () => {
  it('test_UAT_AC1721_empty_and_whitespace_only_corrections_are_refused_with_their_reason', async () => {
    const tenant = 'story1500b111-empty'
    const created = await body(
      await upload(tenant, {
        bytes: bytesOf('Positioning, tone of voice, and the colour system.'),
        name: 'guidelines.txt',
        type: 'text/plain',
        role: 'reference',
      }),
    )
    const store = await ticketStoreFor(routerEnv(tenant))
    const stored = (await store.get({ uid: String(created.uid) })).ticket.body
    expect(stored).toBeTruthy()

    // BOTH SHAPES OF EMPTY — a bare empty string, and text that is only
    // whitespace. The second is the one a client actually produces, by selecting
    // the description and pressing space before leaving the field.
    for (const attempt of ['', '   \n\t  \n']) {
      const response = await correct(tenant, String(created.uid), attempt)
      expect(response.status, JSON.stringify(attempt)).toBe(400)
      // Refused with its REASON — that a description cannot be empty because it
      // is what makes the file findable — not with a bare status.
      expect(String((await body(response)).error)).toMatch(/findable/i)
    }

    // AND THE STORED DESCRIPTION IS LEFT EXACTLY AS IT WAS after both attempts.
    // No path through the Library may leave a piece of material with a
    // description it did not have before, or with none where it had one.
    expect((await store.get({ uid: String(created.uid) })).ticket.body).toBe(stored)
  })
})

describe('AC-1720 — a description the client wrote is recorded as theirs', () => {
  it('test_UAT_AC1720_a_corrected_description_is_credited_to_the_client_and_leaves_the_redescribe_backlog', async () => {
    const tenant = 'story1500b111-credit'
    // NO DESCRIBER, which is the state the correction exists for: an image
    // nothing has looked at is stored, honest about it, and unfindable by what is
    // in it.
    const noDescriber = deps({ describeImage: undefined } as Partial<RouterDeps>)
    const corrected = await body(
      await upload(
        tenant,
        { bytes: bytesOf('png-ish bytes'), name: 'shopfront.jpg', type: 'image/jpeg', role: 'site' },
        noDescriber,
      ),
    )
    const untouched = await body(
      await upload(
        tenant,
        { bytes: bytesOf('other png-ish bytes'), name: 'yard.jpg', type: 'image/jpeg', role: 'site' },
        noDescriber,
      ),
    )
    expect(corrected.description_status).toBe('no_describer')

    const store = await ticketStoreFor(routerEnv(tenant))
    /** The selection a re-description pass uses: anything not successfully described. */
    const backlog = async () =>
      (await store.list({ type: 'material', limit: 'all' })).tickets
        .filter((t) => t.fields.description_status !== 'ok')
        .map((t) => t.uid)

    expect(await backlog()).toContain(String(corrected.uid))

    const response = await correct(
      tenant,
      String(corrected.uid),
      'The old shopfront, before the repaint.',
    )
    expect(response.status).toBe(200)

    // THE RECORD NOW STATES A SUCCESSFUL DESCRIPTION AND NAMES THE CLIENT AS ITS
    // AUTHOR. That pair is not bookkeeping: the status is what a later pass
    // queries on, and the author is what makes the correction survive it.
    const { ticket } = await store.get({ uid: String(corrected.uid) })
    expect(ticket.fields.description_status).toBe('ok')
    expect(ticket.fields.description_model).toBe(CLIENT_DESCRIBER)
    expect(ticket.body).toBe('The old shopfront, before the repaint.')

    // SO THE PASS DOES NOT SELECT IT — while material still genuinely undescribed
    // remains in the same selection, which is what makes this a claim about the
    // QUERY rather than about the backlog having emptied.
    const remaining = await backlog()
    expect(remaining).not.toContain(String(corrected.uid))
    expect(remaining).toContain(String(untouched.uid))
  })
})

describe('AC-1719 — the corrected description is what retrieval answers with afterwards', () => {
  it('test_UAT_AC1719_search_finds_the_material_by_the_new_words_and_not_by_the_superseded_ones', async () => {
    const tenant = 'story1500b111-retrieval'
    const embedder = stubEmbedder()
    const kb = await projectKnowledgeFor(routerEnv(tenant), { embedder, defer: () => {} })
    const index = async () => async () => void (await kb.onMaterialWritten())

    // A DISTRACTOR FIRST, so the claims below are about RANKING and not merely
    // about a store with one row in it. A knowledge base holding a single
    // document returns that document for any query at all.
    await upload(
      tenant,
      {
        bytes: bytesOf('Suppliers deliver flour on Tuesdays and the mill invoices monthly.'),
        name: 'suppliers.txt',
        type: 'text/plain',
        role: 'reference',
      },
      deps({ index }),
    )

    // A PIECE OF MATERIAL WITH A DISTINCTIVE TERM IN ITS DESCRIPTION, indexed.
    const created = await body(
      await upload(
        tenant,
        { bytes: bytesOf('picture bytes'), name: 'DSC_4821.jpg', type: 'image/jpeg', role: 'site' },
        deps({ index }),
      ),
    )
    const uid = String(created.uid)
    const SUPERSEDED = 'the mahogany counter under the skylight'
    const REPLACEMENT = 'the courtyard at dusk with the tables laid for service'
    expect((await correct(tenant, uid, `A photograph of ${SUPERSEDED}.`, deps({ index }))).status).toBe(200)

    const scoreOf = (hits: Array<{ uid: string; semantic: number }>) =>
      hits.find((hit) => hit.uid === uid)?.semantic ?? 0

    // What the material is findable by BEFORE the correction, on both terms.
    const supersededBefore = scoreOf(await kb.search(SUPERSEDED))
    const replacementBefore = scoreOf(await kb.search(REPLACEMENT))
    expect((await kb.search(SUPERSEDED))[0].uid).toBe(uid)

    // THE CLIENT REWRITES IT so it carries a different distinctive term and no
    // longer carries the first.
    const rewritten = await body(
      await correct(tenant, uid, `A photograph of ${REPLACEMENT}.`, deps({ index })),
    )
    expect(String(rewritten.body)).toContain('courtyard')
    expect(String(rewritten.body)).not.toContain('mahogany')

    // A SEARCH WHOSE TERMS APPEAR ONLY IN THE NEW DESCRIPTION FINDS IT — and
    // finds it best, ahead of a document about something else entirely. That is
    // what makes this a retrieval claim rather than a "the store has rows" claim.
    const onReplacement = await kb.search(REPLACEMENT)
    expect(scoreOf(onReplacement)).toBeGreaterThan(replacementBefore)
    expect(onReplacement[0].uid).toBe(uid)
    expect(onReplacement[0].kbs).toContain(PROJECT_KB)

    // AND A SEARCH ON THE SUPERSEDED TERMS NO LONGER RETURNS IT ON THEIR
    // STRENGTH. The correction is not complete when the screen shows the new
    // words; it is complete when the material is findable by them and not by the
    // ones it replaced.
    expect(scoreOf(await kb.search(SUPERSEDED))).toBeLessThan(supersededBefore)
  })
})
