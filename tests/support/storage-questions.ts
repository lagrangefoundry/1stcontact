import type { SiteStore } from '../../tools/generate/src/store/site-store'

/**
 * THE STORAGE QUESTIONS — one body of assertions, asked of every live store.
 *
 * WHY THIS IS A MODULE AND NOT A TEST FILE. The three stores do not share a
 * runtime: the operator's filesystem tree and the filesystem-free store can only
 * be reached where `node:fs` exists, and the cloud store can only be reached
 * inside workerd, where it answers real D1 and R2 bindings. A single
 * `describe.each` cannot express "one contract, three adapters" across two
 * Vitest projects.
 *
 * What the two projects CAN share is the question set itself. {@link
 * askStorageQuestions} asks every question the editing surface asks and returns
 * the answers as one comparable value, so "these stores agree" is asserted with
 * `toEqual` on a single vector rather than by two suites that happen to contain
 * similar-looking assertions today. A question added here is asked of all three
 * at once; a store that answers differently fails on the same text rather than
 * quietly being absent from a second copy of the suite.
 *
 * NOTHING HERE IS ADAPTER-AWARE. The function takes a {@link SiteStore} and a
 * slug and nothing else — no account, no path, no runtime flag — so it cannot
 * accidentally encode a filesystem assumption. Answers that are legitimately
 * per-store (a version's numeric value, a draft's opaque stamp) are recorded as
 * the property the port promises (its type, whether it moved) rather than as the
 * literal, because pinning the literal would be pinning the adapter.
 */

/**
 * Every question the editing surface asks of storage, in the order asked.
 *
 * Named so a test can assert the set is complete against the criterion rather
 * than trusting that whoever wrote {@link askStorageQuestions} covered it.
 */
export const STORAGE_QUESTIONS = [
  'hasDraft',
  'readSiteJson',
  'readPages',
  'write',
  'listAssets',
  'readAsset',
  'counter',
  'appendChange',
  'changesSince',
  'version',
  'loadDraft',
] as const

/**
 * The declared exception: the two questions that RENDER the draft.
 *
 * They are answered by the filesystem-hosted stores only, because the render at
 * this point still runs through a build transform the Workers runtime has none
 * of. Declared here, in the shared module, rather than left as a gap someone
 * would have to notice — an absent question and an excluded one look identical
 * from inside a suite that never asks it.
 */
export const RENDER_QUESTIONS = ['renderDraftPage', 'renderDraftAsset'] as const

/** A fixed timestamp, so two stores' journals are comparable value-for-value. */
const FIXED_TS = '2026-08-31T00:00:00.000Z'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"></svg>'

const utf8 = (text: string): Uint8Array => new TextEncoder().encode(text)

/** Bytes as a plain array, so two adapters' `Uint8Array`s compare structurally. */
const asBytes = (bytes: Uint8Array | null): number[] | null =>
  bytes === null ? null : Array.from(bytes)

/**
 * The assembled draft, minus the one field that names its own store.
 *
 * `sourceDir` is descriptive by design — the filesystem adapter reports a
 * directory, the others an opaque label — and `renderSiteFiles` never reads it.
 * It is the ONLY thing two stores holding the same site may differ on.
 */
function assembled(result: { ok: boolean } & Record<string, unknown>): unknown {
  if (!result.ok) return { ok: false, errors: (result as { errors: unknown }).errors }
  const { sourceDir: _named, ...rest } = (result as { value: Record<string, unknown> }).value
  return { ok: true, ...rest }
}

/**
 * Ask one store everything, and return the answers as one comparable value.
 *
 * MUTATING BY DESIGN. Four of the questions are about what a write does, so this
 * applies a whole change and journals two records. Two stores must therefore be
 * asked over two fixtures built from the SAME seed — which is the point: the
 * comparison is of two stores that have been driven identically, not of two
 * stores sitting still.
 */
export async function askStorageQuestions(
  store: SiteStore,
  slug: string,
): Promise<Record<string, unknown>> {
  /** A slug no store was ever given, so "unheld" is answered, not assumed. */
  const unheld = `${slug}-never-stored`
  const answers: Record<string, unknown> = {}

  answers.hasDraft = { held: await store.hasDraft(slug), unheld: await store.hasDraft(unheld) }
  answers.readSiteJson = {
    held: await store.readSiteJson(slug),
    unheld: await store.readSiteJson(unheld),
  }
  answers.readPages = {
    held: await store.readPages(slug),
    unheld: await store.readPages(unheld),
  }

  // ONE WHOLE CHANGE: a definition, a new page, a removal of a page that is not
  // there, asset bytes, and a removal of an asset that is not there. Every store
  // must take all of it in one call and treat both absent removals as no-ops.
  const beforeWrite = await store.version(slug)
  await store.write(slug, {
    siteJson: { ...(await store.readSiteJson(slug))!, marker: 'one whole change' },
    pages: [
      { name: 'about.json', page: { id: 'about', slug: 'about', title: 'About', modules: [] } },
    ],
    removePages: ['never-there.json'],
    assets: [{ name: 'mark.svg', bytes: utf8(SVG) }],
    removeAssets: ['never-there.png'],
  })
  const afterWrite = await store.version(slug)
  answers.write = {
    siteJson: await store.readSiteJson(slug),
    pages: (await store.readPages(slug)).map((p) => p.name),
  }

  answers.listAssets = {
    held: await store.listAssets(slug),
    unheld: await store.listAssets(unheld),
  }
  answers.readAsset = {
    present: asBytes(await store.readAsset(slug, 'mark.svg')),
    absent: asBytes(await store.readAsset(slug, 'never-written.svg')),
    // Confinement, asked of every store so the answer cannot differ per adapter.
    parentStep: asBytes(await store.readAsset(slug, '../site.json')),
    embeddedSeparator: asBytes(await store.readAsset(slug, 'nested/mark.svg')),
    unheldSite: asBytes(await store.readAsset(unheld, 'mark.svg')),
  }

  answers.counter = { held: await store.counter(slug), unheld: await store.counter(unheld) }
  answers.appendChange = [
    await store.appendChange(slug, {
      actor: 'cli',
      op: 'copy.set',
      summary: 'first',
      ts: FIXED_TS,
    }),
    await store.appendChange(slug, {
      actor: 'cli',
      op: 'page.add',
      summary: 'second',
      ts: FIXED_TS,
    }),
  ]
  answers.changesSince = {
    all: await store.changesSince(slug),
    fromOne: await store.changesSince(slug, 1),
    fromNow: await store.changesSince(slug, 2),
    unheld: await store.changesSince(unheld),
  }

  answers.version = {
    // The VALUE is the adapter's own (a row counter here, a content hash there);
    // what the port promises is that it is a number, that it moves on a write,
    // and that a site the store does not hold has none.
    kind: typeof beforeWrite,
    movedOnWrite: beforeWrite !== afterWrite,
    unheld: await store.version(unheld),
  }

  const draft = await store.loadDraft(slug)
  answers.loadDraft = {
    assembled: draft === null ? null : assembled(draft.result as never),
    stampKind: typeof draft?.stamp,
    unheld: await store.loadDraft(unheld),
  }

  return answers
}
