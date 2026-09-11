import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  DescriberNotConfiguredError,
  ENUMERATE_BUDGET_CHARS,
  PROJECT_KB,
  TRANSCRIPT_INDEX_CHARS,
  enumeratedLandscape,
  projectKnowledgeFor,
  uninformativeTitle,
} from '../apps/control-app/src/knowledge'
import type {
  Describe,
  LandscapeBuild,
  ProjectKnowledge,
  ProjectKnowledgeEnv,
} from '../apps/control-app/src/knowledge'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import {
  AWARENESS_REPORT_KIND,
  AWARENESS_REPORT_TYPE,
} from '../apps/control-app/src/generated/knowledge'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'

/**
 * Reconciliation UATs for story-ea7b4646 — **the two clocks over the client's
 * knowledge**, and the landscape the assistant is handed.
 *
 * THE COMPANION STORY (story-5281f009) MADE THE CORPUS EXIST. This one is about
 * *when* the index and the map are refreshed and *what shape* the description
 * takes: a conversation is batched into the index and never moves the map; an
 * upload is indexed before the notification returns and hands its rebuild to the
 * caller's deferral point; and below a character budget the landscape is a
 * complete listing rather than an invented topology.
 *
 * WHY workerd. Every claim below runs through `ProjectKnowledge` against a real
 * D1 database and a real R2 bucket inside `@cloudflare/vitest-pool-workers` —
 * the corpus is resolved by the knowledge component's `resolveCorpus`, the index
 * built by its `buildIndex`, the clustering done by its `agglomerativeClusterer`
 * and the map published by its `publishAwarenessReport`. Nothing here
 * reimplements any of that in order to assert it.
 *
 * TWO DOUBLES, AND BOTH ARE MODELS. The embedder, for the reasons
 * `tests/support/stub-embedder.ts` sets out at length; and the `describe` seam,
 * which is injected by design — the whole point of {@link Describe} being a
 * parameter is that a Worker has no describer of its own, so a test supplying
 * one is using the seam rather than bypassing it. The deferral point is not a
 * double either: it is the injected {@link Deferral}, and collecting work rather
 * than running it is exactly what a queue consumer does.
 */

const APPLIED = applySchema()

function knowledgeEnv(accountId: string): ProjectKnowledgeEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: accountId,
  }
}

/** The client's knowledge base for one account, with the model seam counted. */
async function openKb(
  accountId: string,
  opts: { enumerateBudget?: number; defer?: (work: Promise<unknown>) => void } = {},
): Promise<{ kb: ProjectKnowledge; embedder: ReturnType<typeof stubEmbedder> }> {
  const embedder = stubEmbedder()
  const kb = await projectKnowledgeFor(knowledgeEnv(accountId), { embedder, ...opts })
  return { kb, embedder }
}

/** A `material` that satisfies [[DOC-38]] §9 — the happy shape, stated once. */
function material(over: Record<string, unknown> = {}) {
  return {
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    kind: 'document',
    ...over,
  }
}

async function addMaterial(
  store: TicketStore,
  title: string,
  body: string,
  fields: Record<string, unknown> = {},
): Promise<Ticket> {
  const { ticket } = await store.create({
    type: 'material',
    title,
    fields: material(fields),
    body,
  })
  return ticket
}

/** A `chat` record with a real transcript in its body — [[DOC-10]] §8's shape. */
async function addChat(store: TicketStore, sessionId: string, body: string): Promise<Ticket> {
  const { ticket } = await store.create({
    type: 'chat',
    title: `Conversation ${sessionId}`,
    fields: { session_id: sessionId },
    body,
  })
  return ticket
}

/** Every awareness-report record this account holds — the map, counted. */
async function mapRecords(store: TicketStore): Promise<Ticket[]> {
  const { tickets } = await store.query({
    predicate: `type="${AWARENESS_REPORT_TYPE}" AND fields.kind="${AWARENESS_REPORT_KIND}"`,
    limit: 'all',
  })
  return tickets
}

/** A describer that records that it was reached, and what it was asked. */
function countingDescriber(text: string): Describe & { calls: number } {
  const seam = (async () => {
    seam.calls += 1
    return text
  }) as Describe & { calls: number }
  seam.calls = 0
  return seam
}

/** Yield to the runtime until `ready()` holds, or give up. Never a fixed sleep. */
async function until(ready: () => boolean, attempts = 200): Promise<boolean> {
  let left = attempts
  while (left > 0 && !ready()) {
    await new Promise((resolve) => setTimeout(resolve, 5))
    left -= 1
  }
  return ready()
}

beforeAll(async () => {
  await APPLIED
})

describe('story-ea7b4646 — the landscape below the floor', () => {
  it('test_UAT_AC1671_below_the_listing_budget_the_landscape_names_every_document_and_says_it_is_complete', async () => {
    const { kb } = await openKb('ac1671-account')
    await addMaterial(kb.store, 'Positioning note', 'The only postpartum meal service in the county.')
    await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')

    // NO DESCRIBER SUPPLIED, and this must not raise. The floor's whole claim is
    // that a small corpus costs no model call at all — a listing that quietly
    // needed one would make every new client's first landscape an LLM round trip.
    const built = await kb.landscape()

    expect(built.mode).toBe('enumerated')
    expect(built.documents).toBe(2)
    expect(built.body).toContain('Positioning note')
    expect(built.body).toContain('Opening hours')

    // STATED IN WORDS, not merely true. A short list read as "knowledge here is
    // thin" produces very different behaviour in front of a new client than the
    // same list read as "you know everything there is"; the sentence is what
    // carries the second reading, so its absence is a real defect.
    expect(built.body).toContain('Complete listing of 2 document(s)')
    expect(built.body).toContain('everything there is')

    // AND THE SAME ANSWER THROUGH THE FULL REBUILD-AND-PUBLISH PATH, which is
    // what an upload actually drives — the floor is a decision inside the build,
    // not something the caller has to know to ask for.
    const published = await kb.rebuildMap()
    expect(published.mode).toBe('enumerated')
    expect(published.documents).toBe(2)
  }, 120_000)

  it('test_UAT_AC1675_a_client_who_has_given_us_nothing_yet_is_told_so_in_words', async () => {
    const { kb } = await openKb('ac1675-account')

    // No material, no reference, no brief, no conversation — the state every
    // account is in for its very first turn.
    expect(await kb.corpus()).toEqual([])

    const built = await kb.landscape()

    expect(built.mode).toBe('enumerated')
    expect(built.documents).toBe(0)

    // A BARE HEADING WITH AN EMPTY LIST UNDER IT READS AS A KNOWLEDGE BASE THAT
    // FAILED. The sentence is what makes it read as one that is legitimately new,
    // and it has to say all three things: nothing given, nothing to search, ask.
    expect(built.body).toContain('Nothing has been uploaded, captured or decided')
    expect(built.body).toContain('nothing here to search')
    expect(built.body).toContain('ask for what you need')

    // NO ENTRIES AT ALL — not one, and not a placeholder pretending to be one.
    const entries = built.body.split('\n').filter((line) => line.startsWith('- '))
    expect(entries).toEqual([])
  }, 120_000)

  it('test_UAT_AC1674_a_title_that_cannot_stand_alone_gets_an_excerpt_and_a_real_title_stands_alone', async () => {
    const { kb } = await openKb('ac1674-account')
    await addMaterial(kb.store, 'IMG_4821.jpg', 'Oxblood and bone, photographed on the counter at dawn.')
    await addMaterial(
      kb.store,
      'Postpartum freezer menu',
      'Ten meals, delivered weekly by refrigerated courier.',
    )

    const built = await kb.landscape()
    expect(built.mode).toBe('enumerated')

    // BOTH ARE PRESENT AS ENTRIES. The rescue is a rescue, not a filter: a
    // document whose title says nothing is still a document the client gave us.
    expect(built.body).toContain('IMG_4821.jpg')
    expect(built.body).toContain('Postpartum freezer menu')

    // THE BARE FILENAME EARNS ITS BODY; THE REAL TITLE DOES NOT GET ONE.
    // Conveying content is not the listing's job ([[DOC-39]] §6.1) — the excerpt
    // exists only so an entry that would otherwise say nothing still says what
    // the document is. Applied to every entry it would be the ~200-characters-
    // per-document listing §7 explicitly settled against.
    expect(built.body).toContain('Oxblood and bone')
    expect(built.body).not.toContain('refrigerated courier')

    // THE RULE ITSELF, asserted directly rather than inferred from one listing:
    // mechanically detected, so it is a per-entry property and not a judgement.
    expect(uninformativeTitle('IMG_4821.jpg')).toBe(true)
    expect(uninformativeTitle('')).toBe(true)
    expect(uninformativeTitle('   ')).toBe(true)
    expect(uninformativeTitle('Postpartum freezer menu')).toBe(false)

    // AND AN UNTITLED DOCUMENT IS NAMED RATHER THAN DROPPED. Dropping it would
    // make the listing's completeness claim false in exactly the case the claim
    // is load-bearing.
    const corpus = await kb.corpus()
    const untitled = { ...corpus[0], title: '' }
    const listing = enumeratedLandscape([untitled], kb.kb as { name: string; description?: string })
    expect(listing.body).toContain('(untitled)')
  }, 120_000)

  it('test_UAT_AC1672_the_complete_listing_emphasises_nothing_because_it_validated_no_way_in', async () => {
    const { kb } = await openKb('ac1672-account')
    // Titles and bodies carrying no emphasis of their own, so anything found
    // below was put there by the listing rather than copied out of the corpus.
    await addMaterial(kb.store, 'Positioning note', 'The only postpartum meal service in the county.')
    await addMaterial(kb.store, 'IMG_4821.jpg', 'Oxblood and bone, photographed at dawn.')

    const description = (kb.kb as { description?: string }).description ?? ''

    /**
     * Every line that carries emphasis, EXCEPT the knowledge base's own
     * description byline.
     *
     * The byline (`*<kb description>*`) is the component's own landscape
     * furniture — the clustered renderer emits the identical line — and it is
     * not a *term*: it names no route and promises no retrieval. What this
     * criterion is about is emphasised TERMS, which in the component's
     * vocabulary are validated search access points, each one demonstrably
     * shown to retrieve the territory it appears in. The clustered path earns
     * that claim by running the reader's own search per candidate; a listing
     * has no territories and no routing problem, so it earns nothing and must
     * promise nothing.
     */
    const emphasised = (body: string): string[] =>
      body
        .split('\n')
        .filter((line) => line.trim() !== `*${description}*`)
        .filter((line) => line.includes('*') || /__/.test(line))

    const listing = await kb.landscape()
    expect(listing.mode).toBe('enumerated')
    // The access-point marker itself, asserted over the WHOLE document with no
    // exclusion at all: a bolded term anywhere in a listing is an unearned
    // promise, byline or not.
    expect(listing.body).not.toContain('**')
    expect(emphasised(listing.body)).toEqual([])
    // And no access-point preamble is claimed either — the clustered map's
    // "Bolded terms are validated search access points" sentence would be a lie
    // over a listing that bolded nothing.
    expect(listing.body).not.toContain('validated search access points')

    // THE SAME FOR THE EMPTY LISTING, which is the first landscape every account
    // ever gets, and for a listing containing an excerpt fallback — the entry
    // that carries the most text is the one most likely to grow decoration.
    const empty = await openKb('ac1672-empty')
    const emptyListing = await empty.kb.landscape()
    expect(emptyListing.documents).toBe(0)
    expect(emptyListing.body).not.toContain('**')
    expect(emphasised(emptyListing.body)).toEqual([])

    const withExcerpt = listing.body.split('\n').filter((line) => line.includes('IMG_4821.jpg'))
    expect(withExcerpt, 'the premise: the excerpt fallback fired').toHaveLength(1)
    expect(withExcerpt[0]).toContain('Oxblood and bone')
    expect(emphasised(withExcerpt.join('\n'))).toEqual([])
  }, 120_000)

  it('test_UAT_AC1673_the_enumerate_cluster_switch_is_a_character_budget_not_a_document_count', async () => {
    // FOUR DOCUMENTS — far below any plausible count-based threshold — whose
    // titles are long enough that the listing itself does not fit.
    const long = await openKb('ac1673-long-titles')
    const verbose =
      'Positioning, tone of voice and competitive differentiation for the postpartum ' +
      'freezer-meal delivery service across the county, including the weekday courier ' +
      'windows, the refrigerated handover protocol and the oxblood-and-bone palette'
    await addMaterial(long.kb.store, `${verbose} — part one`, 'Body one.')
    await addMaterial(long.kb.store, `${verbose} — part two`, 'Body two.')
    await addMaterial(long.kb.store, `${verbose} — part three`, 'Body three.')
    await addMaterial(long.kb.store, `${verbose} — part four`, 'Body four.')

    const corpus = await long.kb.corpus()
    expect(corpus.length, 'well below any plausible count-based threshold').toBeLessThan(12)

    // MEASURED, not assumed: the budget is charged against the ENTRIES, so this
    // is the same number the switch below actually compares.
    const measured = enumeratedLandscape(
      corpus,
      long.kb.kb as { name: string; description?: string },
    )
    expect(measured.entryChars).toBeGreaterThan(ENUMERATE_BUDGET_CHARS)

    await long.kb.refreshIndex()
    const clustered = await long.kb.landscape({ describe: countingDescriber('A territory.') })
    expect(clustered.mode).toBe('clustered')
    expect(clustered.documents).toBe(corpus.length)

    // AND THE CONVERSE: more documents, short entries, still a complete listing.
    // A count-based switch would have clustered this one and enumerated the
    // other, which is exactly backwards.
    const many = await openKb('ac1673-short-titles')
    await addMaterial(many.kb.store, 'Hours', 'Closed Mondays.')
    await addMaterial(many.kb.store, 'Palette', 'Oxblood and bone.')
    await addMaterial(many.kb.store, 'Menu', 'Ten freezer meals.')
    await addMaterial(many.kb.store, 'Courier', 'Weekday windows.')
    await addMaterial(many.kb.store, 'Rights', 'Owned outright.')
    await addMaterial(many.kb.store, 'Voice', 'Plain and warm.')
    await addMaterial(many.kb.store, 'Logo', 'Bone on oxblood.')
    await addMaterial(many.kb.store, 'Area', 'The county only.')

    const manyCorpus = await many.kb.corpus()
    expect(manyCorpus.length).toBeGreaterThan(corpus.length)
    const manyMeasured = enumeratedLandscape(
      manyCorpus,
      many.kb.kb as { name: string; description?: string },
    )
    expect(manyMeasured.entryChars).toBeLessThanOrEqual(ENUMERATE_BUDGET_CHARS)

    const listed = await many.kb.landscape()
    expect(listed.mode).toBe('enumerated')
    expect(listed.documents).toBe(manyCorpus.length)
  }, 120_000)
})

describe('story-ea7b4646 — the landscape above the floor', () => {
  it('test_UAT_AC1677_above_the_floor_with_a_describer_the_landscape_is_a_clustered_map_of_described_territories', async () => {
    // A LISTING BUDGET OF ZERO, so any corpus at all is above the floor. The
    // budget is the switch, so setting it is how a test names which side of the
    // switch it is on without having to manufacture a kilobyte of titles.
    const { kb } = await openKb('ac1677-account', { enumerateBudget: 0 })
    await addMaterial(kb.store, 'Positioning note', 'The only postpartum meal service in the county.')
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')
    await addMaterial(kb.store, 'Courier windows', 'Weekday handovers, refrigerated.')
    await kb.refreshIndex()

    const describer = countingDescriber('What this client has told us about how they sell.')
    const built = await kb.rebuildMap({ describe: describer })

    expect(built.mode).toBe('clustered')
    expect(built.documents).toBe(4)

    // THE PUBLISHED MAP, READ BACK — not the return value alone. What primes a
    // session is the record, so that is what has to carry the description.
    const published = await kb.publishedMap()
    expect(published).not.toBeNull()
    expect(published!.body).toContain('What this client has told us about how they sell.')
    expect(published!.body).toContain(`# Awareness map: ${PROJECT_KB}`)

    // A GROUPING, NOT A PER-DOCUMENT LIST. Fewer territories than documents is
    // the property that distinguishes a map from the listing it replaced; a
    // "clustered" build that emitted one territory per document would satisfy
    // the mode flag and none of the intent.
    const territories = published!.body.match(/^## /gm) ?? []
    expect(territories.length).toBeGreaterThan(0)
    expect(territories.length).toBeLessThan(built.documents)
    expect(describer.calls).toBe(territories.length)
  }, 120_000)

  it('test_UAT_AC1676_above_the_floor_with_no_describer_the_rebuild_refuses_by_name_and_the_previous_map_stands', async () => {
    const { kb } = await openKb('ac1676-account', { enumerateBudget: 0 })
    await addMaterial(kb.store, 'Positioning note', 'The only postpartum meal service in the county.')
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await kb.refreshIndex()

    const refusal = await kb.landscape().then(
      (built: LandscapeBuild) => built,
      (error: Error) => error,
    )
    expect(refusal, 'no silently-degraded map is returned').toBeInstanceOf(
      DescriberNotConfiguredError,
    )

    // THE REFUSAL NAMES WHAT IS MISSING AND WHERE IT COMES FROM. A bare "cannot
    // build map" leaves an operator with a landscape that stopped updating and
    // nothing to act on; this one says the corpus outgrew the listing, that the
    // consequence is clustering, that no describer was supplied, and where a
    // Worker has to get one.
    const message = (refusal as Error).message
    expect(message).toContain(String(ENUMERATE_BUDGET_CHARS))
    expect(message).toContain('listing budget')
    expect(message).toContain('clustered and described')
    expect(message).toContain('describe')
    expect(message).toContain('ai-knowledge')

    // A REFUSAL PUBLISHES NOTHING. Where none had been published, none appears.
    expect(await kb.publishedMap()).toBeNull()
    expect(await mapRecords(kb.store)).toHaveLength(0)

    // AND WHERE ONE HAD BEEN, IT STANDS. This is the whole argument for refusing
    // rather than falling back to a mechanical paragraph: the previous map is
    // better than a generated apology, so the failure must not replace it.
    const standing = await openKb('ac1676-standing', { enumerateBudget: 0 })
    await addMaterial(
      standing.kb.store,
      'Positioning note',
      'The only postpartum meal service in the county.',
    )
    await addMaterial(standing.kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await standing.kb.refreshIndex()
    await standing.kb.rebuildMap({ describe: countingDescriber('The established territory.') })

    const before = await standing.kb.publishedMap()
    expect(before).not.toBeNull()

    await expect(standing.kb.rebuildMap()).rejects.toBeInstanceOf(DescriberNotConfiguredError)

    const after = await standing.kb.publishedMap()
    expect(after).not.toBeNull()
    expect(after!.uid).toBe(before!.uid)
    expect(after!.body).toBe(before!.body)
  }, 120_000)

  it('test_UAT_AC1670_one_map_per_client_knowledge_base_recycled_in_place_by_every_rebuild', async () => {
    const { kb } = await openKb('ac1670-account')
    await addMaterial(kb.store, 'Positioning note', 'The only postpartum meal service in the county.')

    const first = await kb.rebuildMap()
    const published = await kb.publishedMap()
    expect(published).not.toBeNull()
    expect(published!.uid).toBe(first.uid)

    // MACHINE-OWNED, AND IT SAYS SO. The map is regenerated rather than patched,
    // so an operator who hand-edits it loses the edit on the next upload without
    // warning — the sentence is the only notice they ever get.
    expect(published!.body).toContain('Machine-generated')
    expect(published!.body).toContain('do not hand-edit')

    await addMaterial(kb.store, 'Courier windows', 'Weekday handovers, refrigerated.')
    const second = await kb.rebuildMap()

    // THE IDENTITY IS UNCHANGED, which is what lets anything holding a reference
    // keep pointing at the current map. A rebuild that minted a new record would
    // leave priming reading a map that stopped being refreshed.
    expect(second.uid).toBe(first.uid)

    const republished = await kb.publishedMap()
    expect(republished!.uid).toBe(first.uid)
    expect(republished!.body).toContain('Courier windows')
    expect(republished!.body).toContain('Complete listing of 2 document(s)')

    // EXACTLY ONE, asserted against the store rather than against the return
    // value: two reports for one KB is the failure that a stable uid exists to
    // prevent, and it is invisible from the rebuild's own answer.
    const records = await mapRecords(kb.store)
    expect(records.map((ticket) => ticket.uid)).toEqual([first.uid])
  }, 120_000)
})

describe('story-ea7b4646 — the material clock: indexed now, described behind', () => {
  it('test_UAT_AC1668_material_written_is_searchable_by_the_time_the_write_notification_returns', async () => {
    const { kb } = await openKb('ac1668-account')
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')
    await kb.refreshIndex()

    await addMaterial(
      kb.store,
      'Courier windows',
      'Refrigerated handovers on weekday afternoons, booked the evening before.',
    )
    const written = await kb.onMaterialWritten()

    // SEARCHABLE THE INSTANT THE NOTIFICATION RETURNS — before the rebuild it
    // also started has been released or awaited. That decomposition is the whole
    // design: search needs the index and only the index, so the client is never
    // blocked on a description and never blind to their own upload.
    const hits = await kb.search('refrigerated handovers weekday afternoons')
    expect(hits.map((hit) => hit.title)).toContain('Courier windows')

    // AND THE PASS REPORTS WHAT IT DID. One new document costs one embedding,
    // which is what makes indexing-on-every-write affordable rather than a
    // scheduled job in disguise.
    expect(written.index.documents).toBe(3)
    expect(written.index.embedded).toBe(1)

    // Drained so the deferred rebuild cannot outlive the case.
    await written.rebuild
  }, 120_000)

  it('test_UAT_AC1669_the_map_rebuild_a_material_write_triggers_is_deferred_not_awaited_in_the_turn', async () => {
    // A DEFERRAL POINT THAT COLLECTS RATHER THAN RUNS — what a queue consumer
    // is, and what `ctx.waitUntil` is in production. The seam is injected
    // precisely because this story ships a driven operation and not a scheduler.
    const deferred: Promise<unknown>[] = []
    const { kb } = await openKb('ac1669-account', {
      enumerateBudget: 0,
      defer: (work: Promise<unknown>) => {
        deferred.push(work)
        void work.catch(() => {})
      },
    })

    await addMaterial(kb.store, 'Positioning note', 'The only postpartum meal service in the county.')
    await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')
    await kb.refreshIndex()

    // A describer that records being reached and then blocks on a barrier this
    // test controls, so "the rebuild is still in flight" is a fact rather than a
    // race won by being fast.
    let reached = false
    let release: (() => void) | null = null
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    const describeSeam: Describe = async () => {
      reached = true
      await barrier
      return 'What this client has told us about how they sell.'
    }

    await addMaterial(kb.store, 'Courier windows', 'Weekday handovers, refrigerated.')
    const written = await kb.onMaterialWritten({ describe: describeSeam })

    // IT RETURNED, and nothing has been described yet — the conversation is not
    // paying for a model call per territory at the moment the client wants to
    // talk about the document they just handed over.
    expect(await kb.publishedMap()).toBeNull()

    // THE WORK IS AT THE DEFERRAL POINT, and it is the SAME in-flight work the
    // notification handed back. Handing back a different promise would make a
    // caller that does want to wait wait on the wrong thing.
    expect(deferred).toHaveLength(1)
    expect(deferred[0]).toBe(written.rebuild)

    // GENUINELY RUNNING, not merely not-yet-started: the description step has
    // been reached. A rebuild that had not begun would satisfy every assertion
    // above and none of the intent.
    expect(await until(() => reached)).toBe(true)
    expect(await kb.publishedMap()).toBeNull()

    release!()
    const built = await written.rebuild
    expect(built.mode).toBe('clustered')

    const published = await kb.publishedMap()
    expect(published).not.toBeNull()
    expect(published!.body).toContain('What this client has told us about how they sell.')
  }, 120_000)
})

describe('story-ea7b4646 — the conversation clock: batched, and never the map', () => {
  it('test_UAT_AC1666_a_grown_conversation_is_indexed_in_character_batches_and_the_batch_point_advances', async () => {
    const { kb, embedder } = await openKb('ac1666-account')
    const line =
      'The client asked about weekday courier windows for frozen postpartum deliveries. '
    const transcript = line.repeat(60)
    expect(transcript.length).toBeGreaterThan(TRANSCRIPT_INDEX_CHARS)

    const chat = await addChat(kb.store, 'session-ac1666', transcript)
    const embeddedAtStart = embedder.calls

    // ONE CHARACTER BELOW THE THRESHOLD — indexes nothing, and says how much
    // growth it saw. Per-turn indexing would re-embed a whole conversation on
    // every exchange for a document whose meaning has barely moved.
    const below = await kb.onTranscriptGrew(chat.uid, TRANSCRIPT_INDEX_CHARS - 1)
    expect(below.indexed).toBe(false)
    expect(below.grown).toBe(TRANSCRIPT_INDEX_CHARS - 1)
    expect(below.index).toBeNull()
    expect(embedder.calls, 'no index pass ran at all').toBe(embeddedAtStart)

    // PAST THE THRESHOLD — indexed, and the conversation is retrievable. Search
    // over transcripts is what answers what the live context cannot: earlier
    // turns, and other sessions for the same client.
    const above = await kb.onTranscriptGrew(chat.uid, transcript.length)
    expect(above.indexed).toBe(true)
    expect(above.index).not.toBeNull()
    const hits = await kb.search('weekday courier windows frozen postpartum deliveries')
    expect(hits.map((hit) => hit.uid)).toContain(chat.uid)

    // THE BATCH POINT ADVANCED, so the same growth is never charged twice. A
    // batching rule with no durable, advancing point degrades silently into
    // "index every turn" — which is the precise failure this design prevents,
    // and which no single call can reveal.
    const again = await kb.onTranscriptGrew(chat.uid, transcript.length + 300)
    expect(again.indexed).toBe(false)
    expect(again.grown).toBe(300)
    expect((await kb.transcriptCursors())[chat.uid]).toBe(transcript.length)

    // AND THE CONVERSATION RECORD IS UNTOUCHED. Indexing bookkeeping is derived
    // data belonging to the knowledge base; a counter or cursor on the chat
    // ticket would make it part of a contract the AI component owns.
    const { ticket: after } = await kb.store.get({ uid: chat.uid })
    expect(after.fields).toEqual(chat.fields)
    expect(after.version).toBe(chat.version)
    expect(after.body).toBe(chat.body)
    expect(after.updated_at).toBe(chat.updated_at)
  }, 120_000)

  it('test_UAT_AC1667_indexing_a_conversation_leaves_the_clients_map_exactly_as_it_was', async () => {
    // NO MAP HAS EVER BEEN PUBLISHED. Growth must not conjure one: the territory
    // "conversations with this client" is stable from the first turn, and the
    // assistant is sitting in one.
    const fresh = await openKb('ac1667-no-map')
    const transcript = 'Discussing the refrigerated handover protocol in detail. '.repeat(90)
    const freshChat = await addChat(fresh.kb.store, 'session-ac1667-a', transcript)

    const grew = await fresh.kb.onTranscriptGrew(freshChat.uid, transcript.length)
    expect(grew.indexed, 'the premise: it really was indexed').toBe(true)
    expect(await fresh.kb.publishedMap()).toBeNull()

    // AND WHERE A MAP EXISTS, ITS CONTENT IS BYTE-IDENTICAL AFTERWARDS. The
    // budget is zero so a rebuild would genuinely cost a description — which is
    // what makes the describer's own call count a meaningful witness that no
    // rebuild happened rather than a vacuous one.
    const held = await openKb('ac1667-with-map', { enumerateBudget: 0 })
    await addMaterial(held.kb.store, 'Positioning note', 'The only postpartum meal service here.')
    await addMaterial(held.kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await held.kb.refreshIndex()

    const describer = countingDescriber('The established territory.')
    await held.kb.rebuildMap({ describe: describer })
    const before = await held.kb.publishedMap()
    expect(before).not.toBeNull()
    const describedAtStart = describer.calls
    expect(describedAtStart).toBeGreaterThan(0)

    const heldChat = await addChat(held.kb.store, 'session-ac1667-b', transcript)
    const heldGrew = await held.kb.onTranscriptGrew(heldChat.uid, transcript.length)
    expect(heldGrew.indexed).toBe(true)

    const after = await held.kb.publishedMap()
    expect(after).not.toBeNull()
    expect(after!.uid).toBe(before!.uid)
    expect(after!.body).toBe(before!.body)

    // NOT ONE FURTHER DESCRIPTION STEP. Driving the expensive clock off the fast
    // one is the failure the two-clock split exists to prevent, and a model call
    // per conversational turn is what it would cost.
    expect(describer.calls).toBe(describedAtStart)
  }, 120_000)
})
