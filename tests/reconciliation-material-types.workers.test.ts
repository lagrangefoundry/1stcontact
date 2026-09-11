import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { ATTACHMENT_SCHEMA, ATTACHMENT_TYPE } from '../apps/control-app/src/generated/ticketing'
import { chatSchemas } from '../apps/control-app/src/generated/ai-workers'
import {
  productTypePack,
  ticketStoreFor,
  type TicketStore,
  type TicketStoreEnv,
} from '../apps/control-app/src/tickets'
import { route, type RouterDeps, type RouterEnv } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'

/**
 * story-e07c589b — **the vocabulary of what a site is made from**.
 *
 * WHAT IS BEING PROVED, AND WHERE. Every refusal below is observed by asking an
 * account-scoped store to create a record and watching it fail, inside workerd,
 * against a real D1 database whose tables come from `db/migrations` applied in
 * the deployment's own order. There is no hand-written validator here and no
 * fixture schema: a rule that is not actually wired into the pack the Worker
 * builds cannot make one of these tests pass.
 *
 * WHY EACH TEST TAKES AN ACCOUNT OF ITS OWN. Several criteria claim more than "a
 * create was refused" — they claim NO RECORD CAME INTO EXISTENCE as a result.
 * That is only observable as an absence, and an absence is only evidence in a
 * store nothing else has written to. So each test registers a fresh account and
 * reads the whole of it back; where the assertion is an empty listing, a
 * subsequent accepted create proves the listing reports records at all.
 *
 * THE BORROWED SHAPES ARE READ, NOT SPELLED. The conversation kinds and the
 * attachment record belong to the components that write and read them back, and
 * this suite names them by importing them — `chatSchemas()`, `ATTACHMENT_TYPE`,
 * `ATTACHMENT_SCHEMA`. A test that restated those names as literals would keep
 * passing after the pack stopped carrying the component's own shape, which is
 * the one failure the "merged, not restated" claim exists to exclude.
 */

/** The three answers to *who owns it*. */
const RIGHTS = ['owned', 'licensed', 'third_party']
/** The four answers to *where it came from*. */
const ORIGINS = ['uploaded', 'captured', 'fetched', 'site']
/** The four answers to *what sort of file it is*. */
const FILE_SORTS = ['document', 'image', 'font', 'capture']
/** The two kinds that carry the rights and provenance statement. */
const CARRIERS = ['material', 'reference']
/** The two answers to *what the client said it is for*. */
const ROLES = ['site', 'reference']
/**
 * The closed set of outcomes a description attempt can have.
 *
 * The successful case and every way it can fall short. What each degraded member
 * *means* belongs to the describing story; what this story claims is only that
 * the set is closed and named, which is what makes selecting on it possible.
 */
const DESCRIBE_OUTCOMES = ['ok', 'no_describer', 'no_text', 'unsupported', 'too_large', 'failed']

/** The Worker's own bindings, scoped to one account. */
function ticketEnv(account: string): TicketStoreEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: account,
  }
}

/** An account-scoped store, through the single wiring point the Worker uses. */
function storeFor(account: string): Promise<TicketStore> {
  return ticketStoreFor(ticketEnv(account))
}

/**
 * The Worker's full bindings, for the three criteria whose subject is what the
 * INGESTION boundary writes and what the LISTING answer carries.
 *
 * The other nine criteria are about the vocabulary itself and are proved through
 * the store alone. These three are not: "material created from a file carries
 * the name it arrived under" and "asking the account for its material returns
 * both values on every row" are claims about a pipeline and an answer, and
 * asserting them against a hand-made ticket would prove the schema accepts a
 * field rather than that anything writes or reads it.
 */
function routerEnv(account: string): RouterEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: account,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
  }
}

/**
 * Router deps with the two model seams doubled and nothing else.
 *
 * `describeImage` is a stand-in because miniflare has no local Workers AI and no
 * criterion here is about the quality of a description — only about the fact
 * that its OUTCOME and its AUTHOR are recorded. Where a claim is about material
 * nothing has described, the seam is left absent rather than stubbed, because
 * absent is the state the claim is about.
 */
function deps(over: Partial<RouterDeps> = {}): RouterDeps {
  return {
    index: async () => async () => {},
    describeImage: async () => ({ text: 'A mark\n\nA wordmark on a pale ground.', model: 'stub/vision-1' }),
    ...over,
  }
}

/** Whatever the caller says, as bytes. */
function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

/** An upload through the Worker's own entry point, exactly as a drop arrives. */
async function upload(
  account: string,
  file: { bytes: Uint8Array; name: string; type: string; role?: string },
  d: RouterDeps = deps(),
): Promise<Response> {
  const form = new FormData()
  form.append('file', new File([file.bytes as unknown as BlobPart], file.name, { type: file.type }))
  if (file.role !== undefined) form.append('role', file.role)
  return route(
    new Request('https://app.test/api/material', { method: 'POST', body: form }),
    routerEnv(account),
    d,
  )
}

/** The one answer that lists an account's material — rows, in a single request. */
async function listing(account: string): Promise<Array<Record<string, unknown>>> {
  const response = await route(
    new Request('https://app.test/api/material', { method: 'GET' }),
    routerEnv(account),
    deps(),
  )
  expect(response.status, 'the account can be asked for its material').toBe(200)
  const body = (await response.json()) as { material: Array<Record<string, unknown>> }
  return body.material
}

/**
 * The JSON answer, with the status named first.
 *
 * The status check is not decoration. When an ingestion route is absent the
 * request falls through to the SPA asset fallback and comes back as HTML, and
 * `response.json()` then fails with a parse error that says nothing about what
 * actually went wrong. Naming the status makes an absent route legible as an
 * absent route.
 */
async function envelope(response: Response, expected = 200): Promise<Record<string, unknown>> {
  const text = await response.text()
  // NAMED BEFORE PARSED. A route table that does not carry this path answers
  // 200 from the SPA asset fallback, so a bare `.json()` reports a parse error
  // about the letter 'a' — which is a true statement about the bytes and says
  // nothing about the route being absent.
  expect(
    response.headers.get('content-type') ?? '',
    `the ingestion route answered JSON, not ${JSON.stringify(text.slice(0, 40))}`,
  ).toContain('application/json')
  expect(response.status, `the route answered ${text.slice(0, 120)}`).toBe(expected)
  return JSON.parse(text) as Record<string, unknown>
}

/** Every stored blob key for an account, so "no bytes came into existence" is enumerated. */
async function blobKeys(account: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  for (;;) {
    const page = await (env.BLOBS as R2Bucket).list({ prefix: `t/${account}/`, cursor })
    for (const object of page.objects) out.push(object.key)
    if (!page.truncated) break
    cursor = page.cursor
  }
  return out.sort()
}

/**
 * A complete rights and provenance statement — the happy shape, stated once.
 *
 * Deliberately the *minimum* complete one: an upload, which is the origin that
 * has no address. Tests that need an address name one.
 */
function statement(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    kind: 'document',
    ...over,
  }
}

beforeAll(async () => {
  await applySchema()
})

describe('story-e07c589b — the kinds a site is made from', () => {
  it('test_UAT_AC1491_the_vocabulary_names_three_material_kinds_the_conversation_kinds_and_the_attachment_record', async () => {
    const pack = productTypePack()
    const types = pack.types()

    // ── the three material kinds ────────────────────────────────────────────
    for (const kind of ['material', 'reference', 'brief']) {
      expect(types, `the vocabulary names '${kind}'`).toContain(kind)
      expect(pack.has(kind)).toBe(true)
    }

    // ── the conversation kinds, taken from the component that reads them ────
    // Read off `chatSchemas()` rather than spelled, and compared to it: one
    // store holds both halves of the platform's memory only if the shapes in it
    // ARE the component's, not a local approximation free to drift from the
    // code that depends on them.
    const conversationKinds = Object.keys(chatSchemas())
    expect(
      conversationKinds,
      'a session and the comment that carries its transcript',
    ).toEqual(expect.arrayContaining(['chat', 'comment']))
    for (const kind of conversationKinds) {
      expect(types, `the vocabulary names the conversation kind '${kind}'`).toContain(kind)
      expect(pack.schema(kind), `'${kind}' is the component's own schema`).toEqual(
        chatSchemas()[kind],
      )
    }

    // ── the attachment record, under the name its own component gives it ────
    // Identity, not equivalence: `toBe` is what distinguishes the component's
    // object from a hand-written copy that happens to match today.
    expect(types).toContain(ATTACHMENT_TYPE)
    expect(pack.schema(ATTACHMENT_TYPE), 'the attachment record as it ships').toBe(
      ATTACHMENT_SCHEMA,
    )

    // ── and a record of each material kind is created without a status ──────
    // No lifecycle vocabulary on the three, deliberately: a status enum invented
    // here would be a lifecycle nothing implements and every later story would
    // have to honour.
    const store = await storeFor('story-e07c589b-ac1491')
    const withoutStatus: Array<{ type: string; fields: Record<string, unknown>; body?: string }> = [
      { type: 'material', fields: statement() },
      { type: 'reference', fields: statement() },
      { type: 'brief', fields: { site_slug: 'home' }, body: 'Oxblood, not crimson.' },
    ]
    for (const spec of withoutStatus) {
      const { ticket } = await store.create({ title: `A ${spec.type}`, ...spec })
      expect(ticket.uid, `a ${spec.type} is accepted with no status supplied`).toBeTruthy()
      const { ticket: read } = await store.get({ uid: ticket.uid })
      expect(read.type).toBe(spec.type)
      expect(read.status, `a ${spec.type} needs no lifecycle status`).toBeNull()
    }
  })
})

describe('story-e07c589b — rights and provenance, stated rather than inferred', () => {
  it('test_UAT_AC1492_material_and_reference_carry_the_same_six_part_rights_and_provenance_statement', async () => {
    const store = await storeFor('story-e07c589b-ac1492')

    // ONE statement object, offered to BOTH kinds — not two that look alike.
    const complete = statement({
      rights: 'licensed',
      republishable: false,
      exportable: true,
      origin: 'captured',
      kind: 'capture',
      source_url: 'https://competitor.example/brochure',
    })

    for (const carrier of CARRIERS) {
      const { ticket } = await store.create({
        type: carrier,
        title: `A ${carrier} with a complete statement`,
        fields: complete,
      })
      const { ticket: read } = await store.get({ uid: ticket.uid })
      expect(read.type).toBe(carrier)
      // All six parts, returned with the values supplied.
      expect(read.fields.rights, 'who owns it').toBe('licensed')
      expect(read.fields.republishable, 'whether it may be republished').toBe(false)
      expect(read.fields.exportable, 'whether it may be exported').toBe(true)
      expect(read.fields.origin, 'where it came from').toBe('captured')
      expect(read.fields.kind, 'what sort of file it is').toBe('capture')
      expect(read.fields.source_url, 'the address it was taken from').toBe(
        'https://competitor.example/brochure',
      )
    }

    // Same names, same permitted values — the two kinds are validated against
    // one block rather than two that could drift apart a field at a time.
    const pack = productTypePack()
    expect(
      pack.schema('reference').fields,
      'a reference carries the identical statement to a material',
    ).toEqual(pack.schema('material').fields)

    // And every member of each closed set is valid on BOTH kinds, exercised
    // rather than read off the schema: "the same permitted values" is a claim
    // about what the store accepts.
    for (const carrier of CARRIERS) {
      for (const rights of RIGHTS) {
        const { ticket } = await store.create({
          type: carrier,
          title: `${carrier} owned as ${rights}`,
          fields: statement({ rights }),
        })
        expect((await store.get({ uid: ticket.uid })).ticket.fields.rights).toBe(rights)
      }
      for (const sort of FILE_SORTS) {
        const { ticket } = await store.create({
          type: carrier,
          title: `${carrier} as a ${sort}`,
          fields: statement({ kind: sort }),
        })
        expect((await store.get({ uid: ticket.uid })).ticket.fields.kind).toBe(sort)
      }
      for (const origin of ORIGINS) {
        const { ticket } = await store.create({
          type: carrier,
          title: `${carrier} from ${origin}`,
          // An address is supplied throughout, because two of the four require
          // one — AC-1495 is where that rule is the subject.
          fields: statement({ origin, source_url: 'https://example.com/source' }),
        })
        expect((await store.get({ uid: ticket.uid })).ticket.fields.origin).toBe(origin)
      }
    }

    // ── the ONE thing the client may state, carried by the same block ────────
    // The six parts above are read off provenance and never asked. What the
    // client said the file is FOR travels alongside them, on both kinds, with
    // the same two permitted values on each — what it DOES is AC-1736's subject,
    // and all that is claimed here is that the block carries it identically.
    for (const carrier of CARRIERS) {
      for (const role of ROLES) {
        const { ticket } = await store.create({
          type: carrier,
          title: `A ${carrier} the client said is for the ${role}`,
          fields: statement({ role }),
        })
        expect(
          (await store.get({ uid: ticket.uid })).ticket.fields.role,
          `'${role}' is accepted on a ${carrier} and returned as supplied`,
        ).toBe(role)
      }

      // And it is OPTIONAL: where nobody was asked, the record carries no
      // answer — absent, not blank — and the provenance reading is untouched.
      const { ticket: unasked } = await store.create({
        type: carrier,
        title: `A ${carrier} nobody was asked about`,
        fields: statement(),
      })
      const { ticket: read } = await store.get({ uid: unasked.uid })
      expect(read.uid, `a ${carrier} supplying no answer is accepted`).toBeTruthy()
      expect(read.fields.role, 'the record carries no answer').toBeUndefined()
      expect('role' in read.fields, 'absent rather than blank').toBe(false)
      expect(read.fields, 'the reading taken from provenance stands').toMatchObject(statement())
    }
  })

  it('test_UAT_AC1493_an_out_of_set_ownership_or_file_sort_value_is_refused_and_leaves_no_record', async () => {
    const store = await storeFor('story-e07c589b-ac1493')

    // An empty value is a NON-MEMBER, not an unstated one: it is refused like
    // any other value outside the set rather than treated as an omission the
    // platform might fill in.
    const refused = [
      { label: 'an ownership value outside the three', fields: statement({ rights: 'borrowed' }) },
      { label: 'a file sort outside the four', fields: statement({ kind: 'video' }) },
      { label: 'an empty ownership value', fields: statement({ rights: '' }) },
      { label: 'an empty file sort', fields: statement({ kind: '' }) },
    ]
    for (const carrier of CARRIERS) {
      for (const { label, fields } of refused) {
        await expect(
          store.create({ type: carrier, title: `A ${carrier} with ${label}`, fields }),
          `a ${carrier} with ${label} is refused as a validation error`,
        ).rejects.toMatchObject({ code: 'validation' })
      }
    }

    // No record came into existence as a result — the whole account is empty.
    const { tickets: afterRefusals } = await store.list({ limit: 'all' })
    expect(afterRefusals, 'a refused create leaves nothing behind').toEqual([])

    // Non-vacuity: the listing does report records when there are any, so the
    // emptiness above is the refusal and not a listing that never reports.
    const { ticket } = await store.create({
      type: 'material',
      title: 'A value inside every set',
      fields: statement(),
    })
    const { tickets: withOne } = await store.list({ limit: 'all' })
    expect(withOne.map((t) => t.uid)).toEqual([ticket.uid])
  })

  it('test_UAT_AC1494_republishability_and_exportability_are_required_true_or_false_answers', async () => {
    const store = await storeFor('story-e07c589b-ac1494')

    for (const carrier of CARRIERS) {
      // ── omitted is refused, on both kinds ─────────────────────────────────
      // The platform supplies neither a permissive answer nor a fail-closed
      // one. A fail-closed default would produce no refusal anyone sees — it
      // would produce material silently marked unusable, indistinguishable from
      // material genuinely marked so.
      for (const omitted of ['republishable', 'exportable']) {
        const fields = statement()
        delete fields[omitted]
        await expect(
          store.create({ type: carrier, title: `A ${carrier} without ${omitted}`, fields }),
          `omitting ${omitted} on a ${carrier} is refused`,
        ).rejects.toMatchObject({ code: 'validation' })
      }

      // ── text that merely READS as an answer is refused, not interpreted ───
      // 'yes' is the shape a web form submits; so is the string 'false', which
      // would be read as affirmative by anything testing truthiness.
      for (const text of ['yes', 'no', 'true', 'false']) {
        await expect(
          store.create({
            type: carrier,
            title: `A ${carrier} that says republishable=${text}`,
            fields: statement({ republishable: text }),
          }),
          `republishable='${text}' is refused rather than interpreted`,
        ).rejects.toMatchObject({ code: 'validation' })
        await expect(
          store.create({
            type: carrier,
            title: `A ${carrier} that says exportable=${text}`,
            fields: statement({ exportable: text }),
          }),
          `exportable='${text}' is refused rather than interpreted`,
        ).rejects.toMatchObject({ code: 'validation' })
      }
    }

    // Nothing was stored on the creator's behalf.
    expect((await store.list({ limit: 'all' })).tickets, 'no record is stored').toEqual([])

    // Every combination is accepted and returned unchanged — including the two
    // where the answers differ, which is the case that shows neither can be
    // derived from the other: they invert between a client's own site and a
    // third-party reference.
    const combinations: Array<[boolean, boolean]> = [
      [true, false],
      [false, true],
      [true, true],
      [false, false],
    ]
    for (const [republishable, exportable] of combinations) {
      const { ticket } = await store.create({
        type: 'material',
        title: `republish=${republishable}, export=${exportable}`,
        fields: statement({ republishable, exportable }),
      })
      const { ticket: read } = await store.get({ uid: ticket.uid })
      expect(read.fields.republishable).toBe(republishable)
      expect(read.fields.exportable).toBe(exportable)
    }
  })

  it('test_UAT_AC1495_captured_and_fetched_material_must_name_its_address_and_an_upload_is_not_asked_for_one', async () => {
    const store = await storeFor('story-e07c589b-ac1495')

    // Something captured or fetched came FROM somewhere, on both kinds.
    for (const carrier of CARRIERS) {
      for (const origin of ['captured', 'fetched']) {
        await expect(
          store.create({
            type: carrier,
            title: `A ${carrier} ${origin} from nowhere`,
            fields: statement({ origin, kind: 'capture' }),
          }),
          `a ${carrier} whose origin is '${origin}' must name the address it came from`,
        ).rejects.toMatchObject({ code: 'validation' })
      }
    }
    expect((await store.list({ limit: 'all' })).tickets, 'no record is stored').toEqual([])

    // An upload has no such address and is not asked for one — and what it
    // stores is NO address, rather than an empty or placeholder one.
    const { ticket: uploaded } = await store.create({
      type: 'material',
      title: 'Uploaded by the client',
      fields: statement({ origin: 'uploaded' }),
    })
    const { ticket: readUploaded } = await store.get({ uid: uploaded.uid })
    expect(readUploaded.fields.origin).toBe('uploaded')
    expect(readUploaded.fields.source_url, 'no address, not an empty one').toBeUndefined()
    expect('source_url' in readUploaded.fields, 'the address is absent, not blank').toBe(false)

    // Naming both an origin that came from somewhere and its address is
    // accepted, and the address is returned unchanged.
    for (const origin of ['captured', 'fetched']) {
      const address = `https://example.com/${origin}/brochure`
      const { ticket } = await store.create({
        type: 'material',
        title: `Material ${origin} from ${address}`,
        fields: statement({ origin, kind: 'capture', source_url: address }),
      })
      expect((await store.get({ uid: ticket.uid })).ticket.fields.source_url).toBe(address)
    }
  })
})

describe('story-e07c589b — what a brief must state', () => {
  it('test_UAT_AC1496_a_brief_names_its_site_and_carries_a_document_that_is_not_blank', async () => {
    const store = await storeFor('story-e07c589b-ac1496')

    // A site is not an account and an account may own several, so the site
    // cannot be inferred from the account that holds the brief.
    await expect(
      store.create({
        type: 'brief',
        title: 'Decisions belonging to no site',
        body: 'Oxblood, not crimson.',
      }),
      'a brief that names no site is refused',
    ).rejects.toMatchObject({ code: 'validation' })

    // An empty brief is indistinguishable from an absent one to everything that
    // reads it — and unlike a material, no later extraction fills it in.
    for (const body of ['', ' ', '   \n\t  ']) {
      await expect(
        store.create({
          type: 'brief',
          title: 'A brief that says nothing',
          fields: { site_slug: 'home' },
          body,
        }),
        `a brief whose document is ${JSON.stringify(body)} is refused`,
      ).rejects.toMatchObject({ code: 'validation' })
    }
    await expect(
      store.create({ type: 'brief', title: 'No document at all', fields: { site_slug: 'home' } }),
      'a brief with no document at all is refused',
    ).rejects.toMatchObject({ code: 'validation' })

    expect((await store.list({ limit: 'all' })).tickets, 'no record is stored').toEqual([])

    // Naming a site and carrying real text is accepted, and both come back.
    const document = 'Oxblood, not crimson. The hero carries one sentence and no image.'
    const { ticket } = await store.create({
      type: 'brief',
      title: 'Decisions for home',
      fields: { site_slug: 'home' },
      body: document,
    })
    const { ticket: read } = await store.get({ uid: ticket.uid })
    expect(read.fields.site_slug, 'the site it named').toBe('home')
    expect(read.body, 'the document it carried').toBe(document)

    // "One per site" is not "one per account": a second site in the same
    // account gets a brief of its own, told apart by the site it names.
    const { ticket: second } = await store.create({
      type: 'brief',
      title: 'Decisions for shop',
      fields: { site_slug: 'shop' },
      body: 'Ship the catalogue before the blog.',
    })
    const { tickets } = await store.query({
      predicate: 'type=brief AND fields.site_slug=shop',
      limit: 'all',
    })
    expect(tickets.map((t) => t.uid)).toEqual([second.uid])
  })
})

describe('story-e07c589b — what a material need not state yet, and what it may', () => {
  it('test_UAT_AC1497_a_material_is_a_valid_record_before_any_text_has_been_extracted_from_it', async () => {
    const store = await storeFor('story-e07c589b-ac1497')

    // The record is created when the file arrives; the readable shadow of what
    // the file SAYS is written afterwards. A material whose extraction has not
    // run yet is an ordinary state, not an invalid record.
    for (const carrier of CARRIERS) {
      const { ticket } = await store.create({
        type: carrier,
        title: `A ${carrier} whose extraction has not run`,
        fields: statement(),
      })
      const { ticket: read } = await store.get({ uid: ticket.uid })
      expect(read.type).toBe(carrier)
      expect(read.body, 'the text shadow is written after the record exists').toBe('')
      // And the rights statement is complete all the same — unextracted is not
      // half-written.
      expect(read.fields).toMatchObject(statement())
    }

    // Supplying the shadow at creation is equally accepted, and returned
    // unchanged.
    const shadow = 'The palette is oxblood and bone; the wordmark is set in Sohne.'
    const { ticket } = await store.create({
      type: 'material',
      title: 'Already extracted',
      fields: statement(),
      body: shadow,
    })
    expect((await store.get({ uid: ticket.uid })).ticket.body).toBe(shadow)

    // The opposite rule holds for a brief, which has no later extraction — the
    // contrast is why a material's optional body is a decision and not an
    // oversight.
    await expect(
      store.create({ type: 'brief', title: 'A brief with no document', fields: { site_slug: 'home' } }),
      'a brief must carry its document from the start',
    ).rejects.toMatchObject({ code: 'validation' })
  })

  it('test_UAT_AC1498_material_may_name_the_site_it_was_gathered_for_or_belong_to_the_account_at_large', async () => {
    const store = await storeFor('story-e07c589b-ac1498')

    for (const carrier of CARRIERS) {
      const { ticket: named } = await store.create({
        type: carrier,
        title: `A ${carrier} gathered for home`,
        fields: statement({ site_slug: 'home' }),
      })
      const { ticket: readNamed } = await store.get({ uid: named.uid })
      expect(readNamed.fields.site_slug, 'the site is returned as supplied').toBe('home')

      const { ticket: unnamed } = await store.create({
        type: carrier,
        title: `A ${carrier} for the account at large`,
        fields: statement(),
      })
      const { ticket: readUnnamed } = await store.get({ uid: unnamed.uid })
      expect(readUnnamed.uid, `a ${carrier} naming no site is accepted`).toBeTruthy()
      expect(readUnnamed.fields.site_slug, 'no site is present on the record').toBeUndefined()
      // A positive statement that it is tied to no site, rather than a value
      // left blank: the key is absent, not empty.
      expect('site_slug' in readUnnamed.fields).toBe(false)
    }

    // And the difference is legible to a reader: material gathered for one site
    // is not returned as material for another.
    const { ticket: shop } = await store.create({
      type: 'material',
      title: 'Gathered for shop',
      fields: statement({ site_slug: 'shop' }),
    })
    const { tickets } = await store.query({ predicate: 'fields.site_slug=shop', limit: 'all' })
    expect(tickets.map((t) => t.uid)).toEqual([shop.uid])
  })
})

describe('story-e07c589b — one store holds both halves of the memory', () => {
  it('test_UAT_AC1499_a_conversation_persists_as_a_record_found_by_its_session_identifier', async () => {
    const store = await storeFor('story-e07c589b-ac1499')
    const sessionId = 'sess-story-e07c589b'

    // The session is a record of the conversation kind carrying its identifier,
    // accepted in the open state that kind's OWN lifecycle gives it — no state
    // is supplied here.
    const { ticket } = await store.create({
      type: 'chat',
      title: 'Building the landing page',
      fields: { session_id: sessionId, backend: 'claude' },
    })
    expect(ticket.status, 'the conversation kind brings its own open state').toBe('open')

    // The transcript is kept as a comment on that record, marked as a
    // transcript, and listed back under it.
    const transcript = '# xgd-chat\n\nuser: make the hero taller\nassistant: raised it to 72vh.'
    await store.comment({ uid: ticket.uid, kind: 'chat_transcript', body: transcript })

    const { comments } = await store.comments({ uid: ticket.uid })
    expect(comments).toHaveLength(1)
    expect(comments[0].fields.kind, 'marked as a transcript').toBe('chat_transcript')
    expect(comments[0].fields.subject_uid, 'listed back under the session').toBe(ticket.uid)
    expect(comments[0].body, 'carrying the text supplied').toBe(transcript)

    // A SECOND session in the same account, so "exactly that record and no
    // other" is a claim about selection rather than about an account that
    // happens to hold one thing.
    const { ticket: other } = await store.create({
      type: 'chat',
      title: 'A different conversation',
      fields: { session_id: 'sess-story-e07c589b-other', backend: 'claude' },
    })
    const { tickets } = await store.query({
      predicate: `type=chat AND fields.session_id=${sessionId}`,
      limit: 'all',
    })
    expect(tickets.map((t) => t.uid)).toEqual([ticket.uid])
    expect(tickets.map((t) => t.uid)).not.toContain(other.uid)

    // The record's own body is not the transcript's home — it is left free for
    // a maintained summary, and adding the transcript did not fill it in.
    const { ticket: read } = await store.get({ uid: ticket.uid })
    expect(read.body, 'the body is the summary home, not the transcript one').toBe('')
  })
})

describe('story-e07c589b — the one thing the client may say about a file', () => {
  it('test_UAT_AC1736_what_the_client_said_a_file_is_for_narrows_the_inferred_rights_and_a_malformed_answer_is_refused', async () => {
    const account = 'story-e07c589b-ac1736'

    // ── IT NARROWS ──────────────────────────────────────────────────────────
    // IDENTICAL BYTES, IDENTICAL NAME, IDENTICAL TYPE — the photograph and the
    // competitor's screenshot of the story's own argument, distinguishable by
    // nothing except what the client said they were for. Sent twice through the
    // Worker's own ingestion entry point, so the comparison is between two
    // records the pipeline actually wrote.
    const bytes = bytesOf('the same picture, twice')
    const forSite = await envelope(
      await upload(account, { bytes, name: 'shopfront.jpg', type: 'image/jpeg', role: 'site' }),
    )
    const forReading = await envelope(
      await upload(account, { bytes, name: 'shopfront.jpg', type: 'image/jpeg', role: 'reference' }),
    )

    // Read back through a SECOND, independently constructed handle: an envelope
    // that echoed its own input would satisfy a weaker test while proving
    // nothing about what was stored.
    const store = await storeFor(account)
    const site = (await store.get({ uid: String(forSite.uid) })).ticket
    const reading = (await store.get({ uid: String(forReading.uid) })).ticket

    // The two records differ in EXACTLY TWO PLACES, computed rather than
    // enumerated — a third difference appearing later is the failure this shape
    // exists to catch, and a hand-listed comparison would not see it.
    const differing = [...new Set([...Object.keys(site.fields), ...Object.keys(reading.fields)])]
      .filter((key) => JSON.stringify(site.fields[key]) !== JSON.stringify(reading.fields[key]))
      .sort()
    expect(differing, 'the answer, and whether it may be republished — nothing else').toEqual([
      'republishable',
      'role',
    ])
    expect(site.fields.role).toBe('site')
    expect(reading.fields.role).toBe('reference')
    // It NARROWS: the one marked for the site may be republished; the one marked
    // for the client to read may not.
    expect(site.fields.republishable, 'for the site — republishable').toBe(true)
    expect(reading.fields.republishable, 'for them to read — not republishable').toBe(false)
    // And everything the PROVENANCE reading produced is identical across the
    // two: both the client's own, neither exportable. No ownership question was
    // put to anyone, and supplying the answer added none.
    for (const ticket of [site, reading]) {
      expect(ticket.fields.rights, 'recorded as the client’s own, unasked').toBe('owned')
      expect(ticket.fields.exportable, 'neither may be exported').toBe(false)
      expect(ticket.fields.origin).toBe('uploaded')
    }

    // ── ITS ABSENCE CHANGES NOTHING ─────────────────────────────────────────
    // A caller that predates the question sends no answer at all. The material
    // is accepted and the provenance reading is exactly what it was before the
    // question existed — an uploaded file remains republishable and not
    // exportable. This is what keeps the role a narrowing rather than a new gate.
    const unasked = (await store.get({
      uid: String(
        (await envelope(await upload(account, { bytes, name: 'shopfront.jpg', type: 'image/jpeg' })))
          .uid,
      ),
    })).ticket
    expect(unasked.fields.rights, 'unchanged').toBe('owned')
    expect(unasked.fields.republishable, 'unchanged').toBe(true)
    expect(unasked.fields.exportable, 'unchanged').toBe(false)
    // And the record itself carries no answer where nobody was asked — the
    // vocabulary's own rule, observed where this story owns it: through the
    // store, which is what "defines only what a valid record looks like" means.
    const { ticket: handMade } = await store.create({
      type: 'material',
      title: 'Created before anyone was asked',
      fields: statement(),
    })
    const readHandMade = (await store.get({ uid: handMade.uid })).ticket
    expect(readHandMade.fields.role, 'no answer, rather than a guessed one').toBeUndefined()
    expect('role' in readHandMade.fields).toBe(false)

    // ── A MALFORMED ANSWER IS REFUSED, NEVER COERCED ────────────────────────
    // Both silent readings are wrong in a way nobody would notice: one publishes
    // material the client marked private, the other withholds a photograph they
    // meant to publish. Capitalisation alone is enough to make an answer
    // malformed — 'Site' is not 'site'.
    const before = { rows: (await listing(account)).length, blobs: await blobKeys(account) }
    for (const malformed of ['Site', 'SITE', 'Reference', 'sight', 'both', '']) {
      const response = await upload(account, {
        bytes,
        name: 'shopfront.jpg',
        type: 'image/jpeg',
        role: malformed,
      })
      const error = String((await envelope(response, 400)).error)
      // The refusal NAMES the permitted answers, so the caller can correct it.
      expect(error, 'the message names what the two permitted answers are').toContain('site')
      expect(error).toContain('reference')
    }
    // No material record and no stored bytes came into existence as a result.
    const after = { rows: (await listing(account)).length, blobs: await blobKeys(account) }
    expect(after.rows, 'a refused request creates no material').toBe(before.rows)
    expect(after.blobs, 'a refused request stores no bytes').toEqual(before.blobs)

    // ── NOBODY IS ASKED ABOUT MATERIAL WE FETCHED ───────────────────────────
    // Something pulled on the client's behalf is background to read rather than
    // something they handed over to publish — so it is recorded as being for the
    // client to read whatever the caller supplied.
    const fetched = await route(
      new Request('https://app.test/api/material/fetch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: 'https://competitor.example/positioning', role: 'site' }),
      }),
      routerEnv(account),
      deps({
        fetch: (async () =>
          new Response('<html><body><p>Their positioning, at length.</p></body></html>', {
            status: 200,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          })) as unknown as typeof fetch,
      }),
    )
    const pulled = (await store.get({ uid: String((await envelope(fetched)).uid) })).ticket
    expect(pulled.fields.role, 'fetched material is for the client to read').toBe('reference')
    expect(pulled.fields.republishable, 'and is never republishable').toBe(false)
  })
})

describe('story-e07c589b — how a description came to be is part of the record', () => {
  it('test_UAT_AC1737_the_outcome_of_describing_a_material_and_what_produced_it_are_declared_and_selectable', async () => {
    const pack = productTypePack()

    // ── DECLARED, on both kinds, and neither required ───────────────────────
    // The engine tolerates an undeclared field, so the pair would WORK
    // undeclared. Declaring it is the criterion: a later re-describe pass is a
    // query over a stated field rather than a predicate over a convention.
    for (const carrier of CARRIERS) {
      const fields = pack.schema(carrier).fields as Record<string, Record<string, unknown>>
      expect(Object.keys(fields), `${carrier} names the outcome`).toContain('description_status')
      expect(Object.keys(fields), `${carrier} names what produced it`).toContain(
        'description_model',
      )
      // The OUTCOME is the closed set, because being able to select on it is its
      // entire purpose.
      expect(fields.description_status.type, 'the outcome is a closed named set').toBe('enum')
      expect(
        fields.description_status.enum,
        'the successful case and every way describing can fall short',
      ).toEqual(DESCRIBE_OUTCOMES)
      // What PRODUCED it is free text, because it carries a model identifier as
      // the provider returned it — a closed set would need widening for every
      // model release.
      expect(fields.description_model.type, 'a model id as the provider returned it').toBe('string')
      expect(fields.description_model.enum, 'not a closed set').toBeUndefined()
      // Neither is required: a reference created by a capture carries neither
      // when its bundle lands. The same rule as the body's.
      expect(fields.description_status.required, 'the outcome is optional').toBeFalsy()
      expect(fields.description_model.required, 'the describer is optional').toBeFalsy()
    }

    // A record supplying neither is accepted, not refused.
    const account = 'story-e07c589b-ac1737'
    const store = await storeFor(account)
    for (const carrier of CARRIERS) {
      const { ticket } = await store.create({
        type: carrier,
        title: `A ${carrier} nothing has described`,
        fields: statement(),
      })
      expect((await store.get({ uid: ticket.uid })).ticket.uid).toBeTruthy()
    }

    // ── EVERY MATERIAL THE PLATFORM CREATES CARRIES THE OUTCOME ─────────────
    // One file a describer read, and one it could not — the seam is left ABSENT
    // for the second, because "nothing described it" is the state that claim is
    // about rather than something a stub can imitate.
    const described = await envelope(
      await upload(account, {
        bytes: bytesOf('The kitchen opens at six and the bread is baked overnight.'),
        name: 'kitchen-notes.txt',
        type: 'text/plain',
      }),
    )
    const undescribed = await envelope(
      await upload(
        account,
        { bytes: bytesOf('jpeg-ish bytes'), name: 'shopfront.jpg', type: 'image/jpeg' },
        deps({ describeImage: undefined }),
      ),
    )

    // ── THE LISTING CARRIES BOTH VALUES ON EVERY ROW ────────────────────────
    // One request, and the answer is enough to tell which material needs
    // describing again. That is what makes the later pass a query.
    const rows = await listing(account)
    const rowFor = (uid: unknown): Record<string, unknown> => {
      const row = rows.find((r) => r.uid === uid)
      expect(row, `the listing carries ${String(uid)}`).toBeDefined()
      return row!
    }
    for (const row of rows) {
      expect(Object.keys(row), 'every row states the outcome').toContain('description_status')
      expect(Object.keys(row), 'every row states what produced it').toContain('description_model')
    }
    const okRow = rowFor(described.uid)
    expect(okRow.description_status, 'a description was produced').toBe('ok')
    // It states what produced it — an extractor's own name where code did.
    expect(typeof okRow.description_model).toBe('string')
    expect(String(okRow.description_model)).not.toBe('')

    const shortRow = rowFor(undescribed.uid)
    expect(shortRow.description_status, 'and every way it can fall short').toBe('no_describer')
    // …or states EXPLICITLY that nothing produced it, so a reader never has to
    // treat absence as a third answer.
    expect(shortRow.description_model, 'nothing produced it, said explicitly').toBeNull()

    // ── AND SELECTING ON THE OUTCOME RETURNS EXACTLY THE SHORTFALL ──────────
    // A stated field, so the re-describe pass is a predicate and not a migration.
    const { tickets: needsDescribing } = await store.query({
      predicate: 'type=material AND fields.description_status=no_describer',
      limit: 'all',
    })
    expect(needsDescribing.map((t) => t.uid)).toEqual([String(undescribed.uid)])
    expect(needsDescribing.map((t) => t.uid)).not.toContain(String(described.uid))
  })
})

describe('story-e07c589b — the name a file arrived under', () => {
  it('test_UAT_AC1738_the_filename_is_carried_on_the_material_record_and_on_every_listed_row', async () => {
    const pack = productTypePack()

    // ── DECLARED on both kinds, required on neither ─────────────────────────
    for (const carrier of CARRIERS) {
      const fields = pack.schema(carrier).fields as Record<string, Record<string, unknown>>
      expect(Object.keys(fields), `${carrier} names the filename`).toContain('filename')
      expect(fields.filename.type).toBe('string')
      expect(fields.filename.required, 'the same rule as the other later fields').toBeFalsy()
    }

    const account = 'story-e07c589b-ac1738'
    const store = await storeFor(account)

    // A record created without one is accepted.
    const { ticket: nameless } = await store.create({
      type: 'reference',
      title: 'A bundle that arrived under no single name',
      fields: statement({ origin: 'captured', kind: 'capture', source_url: 'https://example.com/' }),
    })
    expect((await store.get({ uid: nameless.uid })).ticket.fields.filename).toBeUndefined()

    // ── MATERIAL CREATED FROM A FILE CARRIES THE NAME IT ARRIVED UNDER ──────
    // Through the Worker's own entry point, read back through a second handle —
    // and unchanged, not normalised: the client recognises their own file by the
    // name they gave it, which is the whole reason the field is here.
    const names = ['Brand Guide (2026) v3.pdf', 'DSC_4821.jpg', 'kitchen-notes.txt']
    const created: Array<{ uid: string; name: string }> = []
    for (const name of names) {
      const sent = await envelope(
        await upload(account, { bytes: bytesOf(`bytes of ${name}`), name, type: 'text/plain' }),
      )
      const { ticket } = await store.get({ uid: String(sent.uid) })
      expect(ticket.fields.filename, 'the name is returned as supplied').toBe(name)
      created.push({ uid: String(sent.uid), name })
    }

    // ── ONE ANSWER CARRIES EVERY NAME ───────────────────────────────────────
    // A SINGLE listing request, and every name is in it. No second request per
    // row is needed to learn what a file was called.
    const rows = await listing(account)
    for (const { uid, name } of created) {
      expect(rows.find((r) => r.uid === uid)?.filename, `${name} is named in the listing`).toBe(name)
    }

    // WHY THAT IS A CLAIM ABOUT THE RECORD AND NOT ABOUT AN ATTACHMENT LOOKUP.
    // This record has a filename and NO attachment at all. A listing that
    // learned names by reading each row's attachments could not name it — so
    // the name appearing here is the material's own field being read, which is
    // exactly the per-row cost the duplication exists to remove.
    const { ticket: unattached } = await store.create({
      type: 'material',
      title: 'A record with no bytes behind it',
      fields: statement({ filename: 'orphaned-brief.pdf' }),
    })
    const unattachedRow = (await listing(account)).find((r) => r.uid === unattached.uid)
    expect(unattachedRow?.filename, 'read off the record, not off an attachment').toBe(
      'orphaned-brief.pdf',
    )

    // ── AND A RECORD WITH NO NAME OF ITS OWN STILL LISTS UNDER ONE ──────────
    // Rather than a blank: the capture bundle created above carries no filename,
    // and a column of empty cells is not a list a client can read.
    const namelessRow = (await listing(account)).find((r) => r.uid === nameless.uid)
    expect(namelessRow, 'the nameless record is listed').toBeDefined()
    expect(String(namelessRow!.filename), 'a name rather than a blank').not.toBe('')
    expect(namelessRow!.filename).toBe(nameless.title)
  })
})
