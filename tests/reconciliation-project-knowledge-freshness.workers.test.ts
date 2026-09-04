import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  DescriberNotConfiguredError,
  ENUMERATE_BUDGET_CHARS,
  PROJECT_KB,
  TRANSCRIPT_CURSORS_FILE,
  TRANSCRIPT_INDEX_CHARS,
  enumeratedLandscape,
  indexPrefix,
  projectKb,
  projectKnowledgeFor,
} from '../apps/control-app/src/knowledge'
import type {
  Describe,
  ProjectKnowledge,
  ProjectKnowledgeEnv,
} from '../apps/control-app/src/knowledge'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'
import { stubEmbedder } from './support/stub-embedder'

/**
 * story-0fb17a68 — **knowledge that keeps up**, in workerd.
 *
 * The sibling story ([[STORY-130]]) establishes *what* the client's corpus is,
 * where its index lives and that keeping it current is incremental. This one is
 * the other half: **what drives the refreshes, and what the assistant is told the
 * corpus looks like at each size**.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion below runs inside workerd, through
 * the same `projectKnowledgeFor` the deployed Worker calls, against a real D1
 * database and the real private R2 bucket. The corpus is resolved by the
 * knowledge component's own `resolveCorpus`, the index built by its `buildIndex`,
 * the landscape published by its `publishAwarenessReport`. Nothing here
 * reimplements any of that in order to assert it.
 *
 * ONE DOUBLE, AND IT IS THE MODEL. `tests/support/stub-embedder.ts` records why
 * at length: the embedder is the component's declared model seam, none of the
 * claims here is about embedding quality, and miniflare has no local Workers AI
 * to reach. The `describe` seam is likewise the host's — a model call by
 * construction — and where a test supplies one it is supplying the seam the
 * production host would, not standing in for something we own.
 *
 * TWO CLOCKS, KEPT APART ON PURPOSE. Findability is cheap and must be near-live;
 * the landscape is expensive and only advisory. Running them off one trigger is
 * the failure this story exists to prevent, so the triggers are asserted from
 * both sides: what each one *does*, and what it must be observed never to touch.
 */

const APPLIED = applySchema()

function knowledgeEnv(tenantId: string): ProjectKnowledgeEnv {
  return {
    DB: env.DB as D1Database,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenantId,
  }
}

/**
 * A project KB for `tenantId`, embedder stubbed and deferred work collected.
 *
 * `defer` collects rather than fires, because what the trigger criteria assert is
 * *that the rebuild was handed to the host's deferred-work channel* — the
 * Worker's `ctx.waitUntil` in production — rather than run in the caller's own
 * chain. The collected promise is also given a no-op catch so a deliberately
 * failing rebuild does not surface as an unhandled rejection; the promise pushed
 * is still the original, so identity against the returned handle holds.
 */
async function openKb(
  tenantId: string,
  opts: { enumerateBudget?: number; transcriptChars?: number } = {},
): Promise<{
  kb: ProjectKnowledge
  embedder: ReturnType<typeof stubEmbedder>
  deferred: Array<Promise<unknown>>
}> {
  const embedder = stubEmbedder()
  const deferred: Array<Promise<unknown>> = []
  const kb = await projectKnowledgeFor(knowledgeEnv(tenantId), {
    embedder,
    defer: (work) => {
      void work.catch(() => {})
      deferred.push(work)
    },
    ...opts,
  })
  return { kb, embedder, deferred }
}

/** The rights and provenance record [[DOC-38]] §9 requires, stated once. */
function material(over: Record<string, unknown> = {}): Record<string, unknown> {
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

/** The entry lines of a rendered listing — the `- …` bullets and nothing else. */
function entryLines(body: string): string[] {
  return body.split('\n').filter((line) => line.startsWith('- '))
}

beforeAll(async () => {
  await APPLIED
})

// ── AC-1527: a document is findable in the same moment it is recorded ────────

describe('story-0fb17a68 — an upload is findable at once', () => {
  it('test_UAT_AC1527_a_recorded_document_is_findable_the_moment_the_recording_reports_back', async () => {
    const { kb } = await openKb('story-0fb17a68-findable')
    const store = kb.store

    // A record is not indexed is *invisible*, so "recorded" and "searchable" are
    // the same event from the client's side. Asserted for each of the three kinds
    // the material trigger covers — a piece of material, a captured reference,
    // and the brief — because each arrives through a different route upstream.
    const uploaded = await addMaterial(
      store,
      'Positioning note',
      'We are the only postpartum meal service in Kirkcudbrightshire.',
    )
    const first = await kb.onMaterialWritten()
    // THE REPORT STATES HOW MUCH IS NOW COVERED, so a caller can tell the corpus
    // grew without searching for the document to find out.
    expect(first.index.documents).toBe(1)
    // AS THE VERY NEXT ACTION — no refresh, no rebuild, no wait in between.
    const afterUpload = await kb.search('postpartum meal service Kirkcudbrightshire')
    expect(afterUpload.map((hit) => hit.uid)).toContain(uploaded.uid)

    const { ticket: captured } = await store.create({
      type: 'reference',
      title: 'A competitor’s menu page',
      fields: material({
        origin: 'captured',
        kind: 'capture',
        source_url: 'https://example.invalid/menu',
        rights: 'third_party',
        republishable: false,
      }),
      body: 'Their menu leads with price, never with provenance or seasonality.',
    })
    const second = await kb.onMaterialWritten()
    expect(second.index.documents).toBe(2)
    const afterCapture = await kb.search('menu leads with price never provenance seasonality')
    expect(afterCapture.map((hit) => hit.uid)).toContain(captured.uid)

    const { ticket: brief } = await store.create({
      type: 'brief',
      title: 'What we decided',
      fields: { site_slug: 'site-a' },
      body: 'Warm, calm, and never clinical. Bookings above the fold on every page.',
    })
    const third = await kb.onMaterialWritten()
    expect(third.index.documents).toBe(3)
    const afterBrief = await kb.search('warm calm never clinical bookings above the fold')
    expect(afterBrief.map((hit) => hit.uid)).toContain(brief.uid)

    // AND THERE IS NO SEPARATE REFRESH A CALLER COULD FORGET: everything above
    // was found off the recording alone. An explicit pass afterwards is therefore
    // a no-op — nothing was left un-embedded for it to catch up on.
    const catchUp = await kb.refreshIndex()
    expect(catchUp.documents).toBe(3)
    expect(catchUp.embedded).toBe(0)
    expect(catchUp.kept).toBe(3)
  })
})

// ── AC-1528: the rebuild runs behind the recording, never inside it ──────────

describe('story-0fb17a68 — the expensive clock runs behind the cheap one', () => {
  it('test_UAT_AC1528_the_landscape_rebuild_runs_behind_the_recording_and_a_failed_rebuild_still_records', async () => {
    const TENANT = 'story-0fb17a68-deferred'

    // A landscape published BEFORE the recording, so "the map that stands while
    // the rebuild is in flight is the previous one" is a comparison against a
    // real body rather than against absence. Published through an ordinary
    // handle: a small corpus enumerates and costs no model call.
    const cheap = await openKb(TENANT)
    await addMaterial(cheap.kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(cheap.kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')
    const previous = await cheap.kb.rebuildMap()
    expect(previous.mode).toBe('enumerated')
    const previousBody = (await cheap.kb.publishedMap())!.body

    // Budget 0 forces the clustered path for the recording under test, so the
    // rebuild genuinely costs a describe call per territory — which is what makes
    // "deferred" an ordering fact rather than a hope about timing.
    const { kb, deferred } = await openKb(TENANT, { enumerateBudget: 0 })
    const arrived = await addMaterial(
      kb.store,
      'Positioning note',
      'Only postpartum meal service in Kirkcudbrightshire, delivered weekly.',
    )

    let release = (): void => {}
    const barrier = new Promise<void>((resolve) => {
      release = resolve
    })
    let described = 0
    const describe: Describe = async () => {
      described += 1
      await barrier
      return 'Positioning and brand\n\nWhat this client sells, and how they say it.'
    }

    const { index, rebuild } = await kb.onMaterialWritten({ describe })

    // THE RECORDING HAS ALREADY REPORTED BACK while the rebuild is still running,
    // and the document is searchable right now. That decomposition is the whole
    // design: search needs only the index, which was refreshed inline.
    expect(index.documents).toBe(3)
    const hits = await kb.search('postpartum meal service Kirkcudbrightshire weekly')
    expect(hits.map((hit) => hit.uid)).toContain(arrived.uid)

    // THE HANDLE WENT TO THE HOST'S DEFERRED-WORK CHANNEL, and the same handle
    // came back to the caller — so a consumer that genuinely wants to wait can.
    expect(deferred).toHaveLength(1)
    expect(deferred[0]).toBe(rebuild)

    // AND IT IS OBSERVABLY IN FLIGHT: the describe step has been entered and has
    // not returned. Without this, everything above would also hold for a rebuild
    // that never started — a different bug wearing the same shape.
    for (let i = 0; described === 0 && i < 200; i++) await Promise.resolve()
    expect(described).toBeGreaterThan(0)

    // THE LANDSCAPE PUBLISHED AT THIS MOMENT IS STILL THE PREVIOUS ONE, so the
    // recording plainly did not wait for it.
    expect((await kb.publishedMap())!.body).toBe(previousBody)

    release()
    const built = await rebuild
    expect(built.mode).toBe('clustered')

    // ONCE THE DEFERRED REBUILD FINISHES, the published landscape is the new one —
    // recycled into the same record, so anything holding a reference still points
    // at the current map.
    const now = await kb.publishedMap()
    expect(now!.uid).toBe(built.uid)
    expect(now!.body).toBe(built.body)
    expect(now!.body).not.toBe(previousBody)

    // ── A FAILED REBUILD NEVER FAILS THE RECORDING ──────────────────────────
    // An upload reported as failed because an advisory summary could not be
    // regenerated would invert the whole point of separating the two clocks.
    const FAILING = 'story-0fb17a68-rebuild-fails'
    const seed = await openKb(FAILING)
    await addMaterial(seed.kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(seed.kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')
    await seed.kb.rebuildMap()
    const standing = (await seed.kb.publishedMap())!.body

    const broken = await openKb(FAILING, { enumerateBudget: 0 })
    const survivor = await addMaterial(
      broken.kb.store,
      'Postpartum menu',
      'Ten freezer meals, delivered weekly across the county.',
    )
    const exploding: Describe = () => {
      throw new Error('the description model is unreachable')
    }
    const failed = await broken.kb.onMaterialWritten({ describe: exploding })
    // The recording succeeded and reported the grown corpus…
    expect(failed.index.documents).toBe(3)
    // …the rebuild it handed off is the thing that failed…
    await expect(failed.rebuild).rejects.toThrow(/unreachable/)
    // …the document stays recorded and searchable…
    expect((await broken.kb.corpus()).map((t) => t.uid)).toContain(survivor.uid)
    const stillFound = await broken.kb.search('ten freezer meals delivered weekly county')
    expect(stillFound.map((hit) => hit.uid)).toContain(survivor.uid)
    // …and the previously published landscape is left exactly where it was.
    expect((await broken.kb.publishedMap())!.body).toBe(standing)

    // The next document recorded tries again, and succeeds when the seam does.
    await addMaterial(broken.kb.store, 'Delivery radius', 'Twelve miles from the kitchen door.')
    const retry = await broken.kb.onMaterialWritten({
      describe: () => 'Operations\n\nHow the food actually reaches people.',
    })
    const repaired = await retry.rebuild
    expect(repaired.mode).toBe('clustered')
    expect((await broken.kb.publishedMap())!.body).not.toBe(standing)
  })
})

// ── AC-1529: conversations are re-indexed in batches, from a durable mark ────

describe('story-0fb17a68 — a conversation is re-indexed in batches', () => {
  it('test_UAT_AC1529_a_conversation_is_reindexed_in_batches_from_a_durable_mark_kept_off_the_conversation', async () => {
    const TENANT = 'story-0fb17a68-batching'
    const { kb } = await openKb(TENANT)
    const { ticket: chat } = await kb.store.create({
      type: 'chat',
      title: 'Kitchen fit-out conversation',
      fields: { session_id: 'sess-0fb17a68-1' },
      body: 'We agreed the hero should lead with the postpartum service, not catering.',
    })
    const asRecorded = await kb.store.get({ uid: chat.uid })

    // BELOW THE THRESHOLD, NOTHING IS INDEXED — and the growth is reported back,
    // so a caller can see how close it is rather than guessing.
    const under = await kb.onTranscriptGrew(chat.uid, TRANSCRIPT_INDEX_CHARS - 1)
    expect(under.indexed).toBe(false)
    expect(under.grown).toBe(TRANSCRIPT_INDEX_CHARS - 1)
    expect(under.index).toBeNull()

    // AT OR PAST IT, THE CONVERSATION IS INDEXED — and is thereafter returned by
    // a search on words that appear only in it. Search over transcripts answers
    // what the live context cannot: earlier turns, and other sessions.
    const over = await kb.onTranscriptGrew(chat.uid, TRANSCRIPT_INDEX_CHARS + 500)
    expect(over.indexed).toBe(true)
    expect(over.grown).toBe(TRANSCRIPT_INDEX_CHARS + 500)
    expect(over.index).not.toBeNull()
    const hits = await kb.search('hero should lead with the postpartum service not catering')
    expect(hits.map((hit) => hit.uid)).toContain(chat.uid)

    // THE MARK ADVANCED TO THE LENGTH JUST INDEXED, so the same growth is never
    // counted twice: a further small increase indexes nothing, even though the
    // conversation is now far longer than the threshold in absolute terms.
    const again = await kb.onTranscriptGrew(chat.uid, TRANSCRIPT_INDEX_CHARS + 600)
    expect(again.indexed).toBe(false)
    expect(again.grown).toBe(100)
    expect((await kb.transcriptCursors())[chat.uid]).toBe(TRANSCRIPT_INDEX_CHARS + 500)

    // THE MARK IS HELD WITH THE CLIENT'S KNOWLEDGE, NOT ON THE CONVERSATION. It
    // is derived bookkeeping, and putting it in `fields` would make a counter part
    // of a ticket type the knowledge component owns.
    const afterIndexing = await kb.store.get({ uid: chat.uid })
    expect(afterIndexing.ticket.version).toBe(asRecorded.ticket.version)
    expect(afterIndexing.ticket.updated_at).toBe(asRecorded.ticket.updated_at)
    expect(afterIndexing.ticket.fields).toEqual(asRecorded.ticket.fields)
    expect(afterIndexing.ticket.body).toBe(asRecorded.ticket.body)
    // It is beside the index instead, in this client's own private index space.
    const markKey = `${indexPrefix(TENANT)}${TRANSCRIPT_CURSORS_FILE}`
    expect(await (env.BLOBS as R2Bucket).get(markKey)).not.toBeNull()

    // AND IT IS DURABLE: a freshly opened handle to the same client's knowledge
    // still has the mark in force, so re-opening does not re-index the same span.
    const reopened = await openKb(TENANT)
    expect((await reopened.kb.transcriptCursors())[chat.uid]).toBe(TRANSCRIPT_INDEX_CHARS + 500)
    const onFreshHandle = await reopened.kb.onTranscriptGrew(chat.uid, TRANSCRIPT_INDEX_CHARS + 600)
    expect(onFreshHandle.indexed).toBe(false)

    // A MARK THAT CANNOT BE READ BACK IS "NOT YET INDEXED", NOT A FAILURE. One
    // extra pass is wasteful and never wrong; failing the turn over a corrupt
    // counter would be the more expensive answer.
    await (env.BLOBS as R2Bucket).put(markKey, '{not json at all')
    const afterCorruption = await openKb(TENANT)
    expect(await afterCorruption.kb.transcriptCursors()).toEqual({})
    const recovered = await afterCorruption.kb.onTranscriptGrew(
      chat.uid,
      TRANSCRIPT_INDEX_CHARS + 600,
    )
    expect(recovered.indexed).toBe(true)
    expect(recovered.grown).toBe(TRANSCRIPT_INDEX_CHARS + 600)
  })
})

// ── AC-1530: conversation growth moves the index only ────────────────────────

describe('story-0fb17a68 — talking never rebuilds the landscape', () => {
  it('test_UAT_AC1530_conversation_growth_moves_the_index_only_and_leaves_the_published_landscape_untouched', async () => {
    // Every handle that grows a conversation below is opened with `enumerateBudget: 0`
    // and is never given a describe seam. That is deliberate: on such a host ANY
    // attempt to build a landscape would refuse by name. So "the landscape was not
    // rebuilt" is proved by the indexing succeeding at all, not only by inspecting
    // the map afterwards — indexing a conversation must not be able to fail, or
    // become expensive, because of the landscape.

    // ── A client whose only activity is talking publishes no landscape ───────
    const TALKER = 'story-0fb17a68-talker'
    const { kb } = await openKb(TALKER, { enumerateBudget: 0 })
    const { ticket: chat } = await kb.store.create({
      type: 'chat',
      title: 'Kitchen fit-out conversation',
      fields: { session_id: 'sess-0fb17a68-talker' },
      body: 'We agreed the hero should lead with the postpartum service, not catering.',
    })
    expect(await kb.publishedMap()).toBeNull()

    for (let round = 1; round <= 3; round++) {
      const grew = await kb.onTranscriptGrew(chat.uid, TRANSCRIPT_INDEX_CHARS * round)
      expect(grew.indexed).toBe(true)
      const found = await kb.search('hero should lead with the postpartum service not catering')
      expect(found.map((hit) => hit.uid)).toContain(chat.uid)
      // However far it grows and however often that causes an index pass, no
      // landscape is created by the talking.
      expect(await kb.publishedMap()).toBeNull()
    }

    // ── A client who already had one still has exactly that one ──────────────
    const HELD = 'story-0fb17a68-landscape-held'
    const seeded = await openKb(HELD)
    await addMaterial(seeded.kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(seeded.kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')
    await seeded.kb.rebuildMap()
    const before = (await seeded.kb.publishedMap())!
    const beforeBody = before.body

    const talking = await openKb(HELD, { enumerateBudget: 0 })
    const { ticket: held } = await talking.kb.store.create({
      type: 'chat',
      title: 'Second conversation',
      fields: { session_id: 'sess-0fb17a68-held' },
      body: 'The delivery radius question came back; twelve miles was the answer.',
    })
    for (let round = 1; round <= 3; round++) {
      const grew = await talking.kb.onTranscriptGrew(held.uid, TRANSCRIPT_INDEX_CHARS * round)
      expect(grew.indexed).toBe(true)
      const found = await talking.kb.search('delivery radius question twelve miles answer')
      expect(found.map((hit) => hit.uid)).toContain(held.uid)
    }

    const after = (await talking.kb.publishedMap())!
    expect(after.uid).toBe(before.uid)
    // Byte-for-byte what it was: not merely still present, and not regenerated to
    // an identical-looking body.
    expect(after.body).toBe(beforeBody)
    expect(after.version).toBe(before.version)
  })
})

// ── AC-1531: a small corpus is listed in full and says it is complete ────────

describe('story-0fb17a68 — the enumeration floor is the better case', () => {
  it('test_UAT_AC1531_a_small_corpus_is_listed_in_full_says_it_is_complete_and_emphasises_nothing', async () => {
    const { kb } = await openKb('story-0fb17a68-enumerated')
    const documents = [
      await addMaterial(kb.store, 'Brand guidelines', 'The palette is oxblood and bone.'),
      await addMaterial(kb.store, 'Postpartum menu', 'Ten freezer meals, delivered weekly.'),
      await addMaterial(kb.store, 'Opening hours', 'Closed Mondays, open otherwise.'),
    ]

    // NO DESCRIPTION CAPABILITY SUPPLIED AT ALL, so the ordinary case for a new
    // client costs no model call — and the build reports the listing form.
    const built = await kb.landscape()
    expect(built.mode).toBe('enumerated')
    expect(built.documents).toBe(documents.length)

    // EVERY DOCUMENT IS NAMED, and each is identified well enough to ask for: its
    // own identifier, and what kind of record it is. That is what "complete"
    // means, and it is exactly the property a summary would lose.
    for (const document of documents) {
      expect(built.body).toContain(document.title)
      expect(built.body).toContain(document.uid)
    }
    expect(built.body).toContain('material/document')
    expect(entryLines(built.body)).toHaveLength(documents.length)

    // AND IT SAYS SO IN WORDS, with the count. A short list read as "knowledge
    // here is thin" produces very different behaviour in front of a new client
    // than the same list read as "you know everything there is".
    expect(built.body).toMatch(/complete listing of 3 document/i)
    expect(built.body).toMatch(/everything there is/i)
    expect(built.body).toMatch(/not a summary/i)
    expect(built.body).toMatch(/not a sample/i)

    // NOTHING IS MARKED FOR EMPHASIS. The knowledge component reads an emphasised
    // term in a landscape as a *validated* search access point — one demonstrably
    // shown to retrieve the territory it names — and a complete listing has no
    // territories and validated nothing, so emphasis here would be an unearned
    // promise in the component's own vocabulary. No bold marker occurs anywhere,
    // and no entry carries a marker of any kind.
    expect(built.body).not.toContain('**')
    expect(built.body).not.toContain('__')
    for (const line of entryLines(built.body)) {
      expect(line).not.toMatch(/[*_`]/)
    }

    // The same holds of the landscape actually published, not just of the build.
    const published = await kb.rebuildMap()
    expect(published.mode).toBe('enumerated')
    expect((await kb.publishedMap())!.body).toBe(built.body)
  })
})

// ── AC-1532: the line is a character budget, not a document count ────────────

describe('story-0fb17a68 — the line is a budget over the entries', () => {
  it('test_UAT_AC1532_the_line_between_listing_and_clustering_is_a_character_budget_not_a_document_count', async () => {
    // FEW DOCUMENTS, LONG ENTRIES: over the line, and clustered — the case a
    // count-based floor gets exactly backwards.
    const wide = await openKb('story-0fb17a68-budget-wide')
    for (let i = 0; i < 4; i++) {
      await addMaterial(
        wide.kb.store,
        `A deliberately long document title number ${i} `.repeat(6).trim(),
        'Body text, which the listing does not carry for a title like this one.',
      )
    }
    const overBudget = await wide.kb.corpus()
    expect(overBudget).toHaveLength(4)
    expect(enumeratedLandscape(overBudget, projectKb()).entryChars).toBeGreaterThan(
      ENUMERATE_BUDGET_CHARS,
    )
    await wide.kb.refreshIndex()
    const clustered = await wide.kb.landscape({
      describe: () => 'Long-titled material\n\nThe documents this client has handed over.',
    })
    expect(clustered.mode).toBe('clustered')
    expect(clustered.documents).toBe(4)

    // MORE DOCUMENTS, SHORT ENTRIES: under the line, and listed in full.
    const many = await openKb('story-0fb17a68-budget-many')
    for (let i = 0; i < 8; i++) {
      await addMaterial(many.kb.store, `Doc ${i}`, 'Short.')
    }
    const underBudget = await many.kb.corpus()
    expect(underBudget.length).toBeGreaterThan(overBudget.length)
    expect(enumeratedLandscape(underBudget, projectKb()).entryChars).toBeLessThanOrEqual(
      ENUMERATE_BUDGET_CHARS,
    )
    const listed = await many.kb.landscape()
    expect(listed.mode).toBe('enumerated')
    expect(listed.documents).toBe(8)

    // THE MEASURE IS THE ENTRIES ALONE. Lengthening only the surrounding,
    // non-entry prose grows the rendered landscape enormously and does not move
    // the measurement by a single character — so unrelated prose cannot drag a
    // corpus across the line.
    const plain = enumeratedLandscape(underBudget, { name: PROJECT_KB })
    const verbose = enumeratedLandscape(underBudget, {
      name: PROJECT_KB,
      description: 'An extremely long description of this knowledge base. '.repeat(80),
    })
    expect(verbose.body.length).toBeGreaterThan(plain.body.length + 4000)
    expect(verbose.entryChars).toBe(plain.entryChars)
    expect(verbose.entryChars).toBeLessThanOrEqual(ENUMERATE_BUDGET_CHARS)
  })
})

// ── AC-1533: titles carry the listing; only a title that cannot stand alone ──
//            is rescued with an excerpt

describe('story-0fb17a68 — what one listed entry says', () => {
  it('test_UAT_AC1533_the_listing_carries_titles_and_rescues_only_the_entry_whose_title_cannot_stand_alone', async () => {
    const { kb } = await openKb('story-0fb17a68-entries')

    // A bare filename cannot say what the document is, so this entry is rescued
    // with a short excerpt of its own content.
    const bareFilename = await addMaterial(
      kb.store,
      'IMG_4821.jpg',
      'The kitchen at dusk, copper pans on the wall.',
      { kind: 'image' },
    )
    // A real title stands alone, so nothing of this document's content appears —
    // conveying content is not the listing's job, and padding every entry with an
    // excerpt would make it one.
    const described = await addMaterial(
      kb.store,
      'Brand guidelines 2024',
      'The palette is oxblood and bone.',
    )
    // Neither a usable title nor any content: still listed, marked as untitled,
    // rather than dropped from a listing that claims to be complete. The title is
    // whitespace rather than the empty string because the ticket store refuses a
    // literally empty one — so this is the emptiest title a record in this corpus
    // can actually have, reached through the ordinary create path.
    const anonymous = await addMaterial(kb.store, '   ', '')

    const built = await kb.landscape()
    expect(built.mode).toBe('enumerated')
    expect(built.documents).toBe(3)

    expect(built.body).toContain(bareFilename.title)
    expect(built.body).toContain('The kitchen at dusk, copper pans on the wall.')

    expect(built.body).toContain('Brand guidelines 2024')
    expect(built.body).not.toContain('oxblood')
    expect(built.body).not.toContain('bone')

    expect(built.body).toContain('(untitled)')
    expect(built.body).toContain(anonymous.uid)
    expect(entryLines(built.body)).toHaveLength(3)
  })
})

// ── AC-1534: above the budget with no describer, the build refuses by name ───

describe('story-0fb17a68 — a refusal that leaves everything as it was', () => {
  it('test_UAT_AC1534_above_the_budget_with_no_describer_the_build_refuses_by_name_and_the_previous_landscape_stands', async () => {
    // The corpus is over the SHIPPED budget rather than a host-configured zero, so
    // the size and the budget the refusal reports are both the real ones.
    const NONE = 'story-0fb17a68-refusal-none'
    const fresh = await openKb(NONE)
    for (let i = 0; i < 4; i++) {
      await addMaterial(
        fresh.kb.store,
        `A deliberately long document title number ${i} `.repeat(6).trim(),
        'Body text.',
      )
    }
    expect(enumeratedLandscape(await fresh.kb.corpus(), projectKb()).entryChars).toBeGreaterThan(
      ENUMERATE_BUDGET_CHARS,
    )

    // IT REFUSES, AND REFUSES INFORMATIVELY: it names the missing description
    // capability, says where a caller must supply it, and reports how large the
    // corpus has grown and what budget it passed.
    await expect(fresh.kb.rebuildMap()).rejects.toBeInstanceOf(DescriberNotConfiguredError)
    const refusal = await fresh.kb.rebuildMap().catch((error: Error) => error)
    expect(refusal.message).toContain('describe')
    expect(refusal.message).toMatch(/no .?describe.? seam was supplied/i)
    expect(refusal.message).toContain('@lagrangefoundry/ai-knowledge/describe')
    expect(refusal.message).toMatch(/a Worker has to hand one in/i)
    expect(refusal.message).toContain('4 documents')
    expect(refusal.message).toContain(`${ENUMERATE_BUDGET_CHARS}-character listing budget`)
    // And it says what it did instead of doing it: the previous map stands.
    expect(refusal.message).toMatch(/the map is not rebuilt and the previous one stands/i)

    // WHERE NONE HAD BEEN PUBLISHED, NONE IS CREATED. The corpus is never given a
    // mechanically generated stand-in that only restates what is already rendered
    // beside it.
    expect(await fresh.kb.publishedMap()).toBeNull()

    // ── AND AN EXISTING LANDSCAPE IS NEVER REPLACED BY A WORSE ONE ───────────
    const HELD = 'story-0fb17a68-refusal-held'
    const held = await openKb(HELD)
    await addMaterial(held.kb.store, 'Brand guidelines', 'The palette is oxblood and bone.')
    await addMaterial(held.kb.store, 'Opening hours', 'Closed Mondays, open otherwise.')
    const published = await held.kb.rebuildMap()
    expect(published.mode).toBe('enumerated')
    const standing = (await held.kb.publishedMap())!

    // The corpus grows past the budget…
    for (let i = 0; i < 4; i++) {
      await addMaterial(
        held.kb.store,
        `Another deliberately long document title number ${i} `.repeat(6).trim(),
        'Body text.',
      )
    }
    // …and with no way to describe territories, the rebuild refuses.
    await expect(held.kb.rebuildMap()).rejects.toBeInstanceOf(DescriberNotConfiguredError)

    const after = (await held.kb.publishedMap())!
    expect(after.uid).toBe(standing.uid)
    expect(after.body).toBe(standing.body)
    expect(after.version).toBe(standing.version)
  })
})

// ── AC-1535: a client who has given us nothing yet is told so in words ───────

describe('story-0fb17a68 — the first state of every account', () => {
  it('test_UAT_AC1535_a_client_who_has_given_nothing_yet_is_told_so_in_words', async () => {
    const { kb } = await openKb('story-0fb17a68-empty')
    expect(await kb.corpus()).toEqual([])

    // It SUCCEEDS — an empty or absent landscape at this moment would read to the
    // assistant as a failure to load rather than as an accurate statement about a
    // new client. And it needs no description capability to say so.
    const built = await kb.landscape()
    expect(built.mode).toBe('enumerated')
    expect(built.documents).toBe(0)

    // IT SAYS SO IN WORDS: nothing has been uploaded, captured or decided; there
    // is therefore nothing here to search; ask for what you need instead.
    expect(built.body).toMatch(/nothing has been uploaded, captured or decided/i)
    expect(built.body).toMatch(/nothing here to search/i)
    expect(built.body).toMatch(/ask for what you need/i)

    // Not an empty document, and not a listing with phantom entries in it.
    expect(built.body.trim().length).toBeGreaterThan(0)
    expect(entryLines(built.body)).toEqual([])
    expect(built.body).not.toMatch(/complete listing of/i)

    // And it publishes like any other landscape, so a new client's assistant has
    // one to read from the very first turn.
    const publishedBuild = await kb.rebuildMap()
    expect(publishedBuild.mode).toBe('enumerated')
    expect((await kb.publishedMap())!.body).toBe(built.body)
  })
})
