import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  configPath,
  corpusDir,
  corpusMembership,
  DOC_KIND_FIELD,
  kbBundle,
  kbEnsure,
  kbSkew,
  kbSkewError,
  KbSkewError,
  MEMBER_KIND,
  projectedDocument,
  requireCoherentKb,
  SYSTEM_KB,
  writeProjections,
} from '../tools/generate/src/cli/kb'
import { projections } from '../tools/generate/src/cli/kb-projection'
import { buildIndexesAndMap, STUB_MODEL } from './support/kb-fixture'

/**
 * [[BUG-156]] — **coverage is not currency**, which is [[BUG-48]]'s sentence one
 * level further out.
 *
 * BUG-48 closed "a document in the corpus that is not in the index is a shipped
 * lie" with a check that refuses a bundle whose index does not cover its corpus.
 * The three projected references — `REF-l1`, `REF-behaviors`, `REF-surface` — pass
 * that check completely and can still be wrong, because they are the only corpus
 * documents nobody writes: `writeProjections` renders them from the behavior
 * catalogue, the L1 schemas and the declared control surface, and it runs only
 * inside a build.
 *
 * SO THE FAILURE IS A FILE THAT DID NOT MOVE. [[REQ-322]]'s stage decides whether
 * to rebuild by calling `requireCoherentKb`, whose test compares each corpus
 * file's mtime against the version in the two manifests. A projection whose SOURCE
 * moved has the same mtime, the same manifest entry and no skew — so the stage
 * prints *"the index covers all 12 corpus document(s) — nothing to build"*, which
 * was true and useless. Observed 2026-09-26: `kb/system/REF-l1.md` was rendered on
 * 09-24 and `packages/site-schema/src/l1/schema.ts` changed on 09-26 (REQ-329 /
 * REQ-330 / REQ-331); the shipped reference was 27,868 characters where the
 * current rendering is 32,911, and every build since had correctly reported
 * nothing to do.
 *
 * AND IT IS WORSE THAN AN UNINDEXED DOCUMENT, which is why it is a refusal and not
 * a warning. A document the index misses is unreachable; this one is retrievable,
 * confident and wrong — the assistant answers questions about the L1 vocabulary
 * from a document describing a vocabulary the code no longer has.
 *
 * WHAT IS REAL HERE. The corpus resolution, `writeProjections`' own rendering,
 * both index builds, the map, the bundle read and the whole `kbEnsure` stage are
 * the real thing. Two stand-ins, each at a boundary this repository does not own:
 * the embedding and describing models (`LAGRANGE_KM_EMBEDDER` /
 * `LAGRANGE_KM_DESCRIBER`, as REQ-123, BUG-48 and REQ-322 do it) and the ticketing
 * CLI the export shells out to.
 *
 * HOW A PROJECTION IS PUT BEHIND ITS SOURCE. The source is the repository's own
 * code and this suite does not edit it; instead the fixture renders the
 * projections, indexes them, and then REMOVES A SECTION from one file while
 * RESTORING ITS MTIME. That is byte-for-byte the state observed on 09-26 — a file
 * holding an older rendering, an index perfectly coherent with it, and nothing in
 * either manifest to notice. The direction is the observed one too: the file is
 * missing what the current source has. Whether the file fell behind or was
 * hand-edited is not a distinction a diff can make, and the document says so
 * itself ("Do not edit: this document is rebuilt from its source on every build").
 */

const tempRoots: string[] = []

afterEach(() => {
  for (const dir of tempRoots.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})

function tempRoot(prefix = 'bug156-'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
  tempRoots.push(dir)
  return dir
}

/** Two written documents, so the corpus is not only the projected namespace. */
const TICKETS = [
  {
    uid: 'doc-bug156-a',
    id: 'DOC-A156',
    title: 'Carousel behaviour module',
    body: '# Carousel behaviour module\n\nThe carousel rotates slides. Autoplay and interval are behavioural config.\n',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    fields: { [DOC_KIND_FIELD]: MEMBER_KIND },
  },
  {
    uid: 'doc-bug156-b',
    id: 'DOC-B156',
    title: 'Storage and revisions',
    body: '# Storage and revisions\n\nPublishing snapshots the draft into a numbered revision and renders the output.\n',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    fields: { [DOC_KIND_FIELD]: MEMBER_KIND },
  },
]

/**
 * A `xgd` on `PATH` answering `ticket list` with {@link TICKETS} and nothing else.
 *
 * The one thin mock, at a true external boundary: the corpus export reaches the
 * ticket store by spawning another program. Everything downstream of it is the
 * real path, unchanged and unaware — and without it a rebuild's export would sweep
 * the two written documents as documents no ticket claims.
 */
function fakeTicketStore(): string {
  const dir = tempRoot('bug156-bin-')
  const shim = path.join(dir, 'xgd')
  fs.writeFileSync(
    shim,
    `#!/bin/sh\ncat <<'JSON'\n${JSON.stringify({ items: TICKETS, next_cursor: null, truncated: false })}\nJSON\n`,
    { mode: 0o755 },
  )
  return dir
}

/** A KB root holding the written documents, the real projections, and both indexes. */
async function fixtureKb({ withProjections = true }: { withProjections?: boolean } = {}): Promise<string> {
  const root = tempRoot('bug156-kb-')
  const dir = corpusDir(root)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    configPath(root),
    JSON.stringify({
      knowledge_bases: {
        [SYSTEM_KB]: {
          description: 'Test system knowledge.',
          corpus: {},
          landscape: 'authored',
          source: 'shipped',
        },
      },
    }),
    'utf8',
  )
  for (const ticket of TICKETS) {
    fs.writeFileSync(
      path.join(dir, `${ticket.id}.md`),
      `---\nid: ${ticket.id}\ntype: doc\ntitle: ${ticket.title}\nfields:\n  ${DOC_KIND_FIELD}: ${MEMBER_KIND}\n---\n${ticket.body}`,
      'utf8',
    )
  }
  // THE REAL RENDERING, not a stand-in document in the `REF-` namespace: what is
  // under test is whether the check can tell the current rendering from an older
  // one, and a fabricated projection would only ever prove it can diff two strings.
  if (withProjections) writeProjections(root)
  await buildIndexesAndMap(root)
  return root
}

/** The projection this suite puts behind its source, and the section it loses. */
const BEHIND = 'REF-l1'

/**
 * Remove a section from a projection and put its mtime back.
 *
 * The mtime restore is the whole point and not tidiness: leave the file newer and
 * the manifest comparison fires, the bundle reads as `stale`, and the suite proves
 * BUG-48's check rather than this one. With the stamp preserved, the index is
 * perfectly coherent with the file — exactly the state that shipped — and the only
 * thing that can notice is a re-rendering.
 *
 * Returns the heading that was cut, so the rebuild can be shown to bring it back.
 */
function putBehindSource(root: string): string {
  const file = path.join(corpusDir(root), `${BEHIND}.md`)
  const before = fs.statSync(file)
  const text = fs.readFileSync(file, 'utf8')
  const cut = text.lastIndexOf('\n## ')
  expect(cut).toBeGreaterThan(0)
  const heading = text.slice(cut + 1, text.indexOf('\n', cut + 1))
  fs.writeFileSync(file, `${text.slice(0, cut)}\n`, 'utf8')
  fs.utimesSync(file, before.atime, before.mtime)
  return heading
}

/** What `writeProjections` would write into `root` for a projection, right now. */
function currentRendering(root: string, id: string): string {
  const doc = projections().find((p) => p.id === id)
  expect(doc).toBeDefined()
  return projectedDocument(doc!, corpusMembership(root))
}

describe('1c kb ensure — a projection is the current one', () => {
  beforeAll(() => {
    process.env.LAGRANGE_KM_EMBEDDER = STUB_MODEL
    process.env.LAGRANGE_KM_DESCRIBER = STUB_MODEL
  })

  afterAll(() => {
    delete process.env.LAGRANGE_KM_EMBEDDER
    delete process.env.LAGRANGE_KM_DESCRIBER
  })

  it('test_UAT_FC_BUG-156_a_projection_behind_its_source_is_skew_while_the_index_is_coherent', async () => {
    const root = await fixtureKb()
    const heading = putBehindSource(root)
    const bundle = await kbBundle(root)
    expect(bundle).not.toBeNull()

    const skew = await kbSkew(bundle!, root)

    // THE INDEX IS FINE, and that is the finding. Both of BUG-48's lists are
    // empty: the file is in both manifests, under the version its mtime says it
    // has. Everything the check could ask before this ticket, it asked, and the
    // answer was that there was nothing to do.
    expect(skew.missing).toEqual([])
    expect(skew.stale).toEqual([])

    // The corpus is what is behind — named, so an operator knows which document
    // and not merely that one of them is wrong.
    expect(skew.outdated).toEqual([BEHIND])

    // …and the disagreement is real rather than an artefact of how it is measured:
    // the file genuinely no longer holds what its source renders.
    const held = bundle!.docs[`${BEHIND}.md`].text
    expect(held).not.toContain(heading)
    expect(currentRendering(root, BEHIND)).toContain(heading)

    // REFUSED, in the same call and by the same gate `1c assets` refuses on.
    await expect(requireCoherentKb(bundle!, root)).rejects.toBeInstanceOf(KbSkewError)
  }, 180_000)

  it('test_UAT_FC_BUG-156_the_build_stage_rebuilds_the_projection_and_the_bundle_then_matches_its_source', async () => {
    const root = await fixtureKb()
    const heading = putBehindSource(root)
    const bin = fakeTicketStore()
    const realPath = process.env.PATH
    process.env.PATH = `${bin}${path.delimiter}${realPath ?? ''}`
    try {
      const outcome = await kbEnsure({ root, env: process.env })

      // THE STAGE BUILT, where before this ticket it reported nothing to do. And
      // the skew that triggered it is carried, so the report says why.
      expect(outcome.action).toBe('built')
      expect(outcome.skew?.outdated).toEqual([BEHIND])
      expect(outcome.report).toContain(BEHIND)

      // ONE MECHANISM, NOT TWO. Rewriting the projection makes its file newer than
      // the manifest, which is already the existing trigger, so the ordinary
      // rebuild path carries it the rest of the way — both indexes and the map.
      expect(outcome.report).toContain('index:')
      expect(outcome.report).toContain('chunks:')
      expect(outcome.report).toContain('map:')

      // The file on disk is the current rendering again, section and all.
      const file = path.join(corpusDir(root), `${BEHIND}.md`)
      expect(fs.readFileSync(file, 'utf8')).toEqual(currentRendering(root, BEHIND))
      expect(fs.readFileSync(file, 'utf8')).toContain(heading)

      // AND THE STAGE IS NOW SATISFIED BY THE GATE THAT REFUSED IT, which is the
      // property that keeps a build that passes this stage from being refused by
      // the next one.
      const rebuilt = await kbBundle(root)
      await expect(requireCoherentKb(rebuilt!, root)).resolves.toBeTruthy()
      expect((await kbEnsure({ root, env: process.env })).action).toBe('current')
    } finally {
      process.env.PATH = realPath
    }
  }, 300_000)

  it('test_UAT_FC_BUG-156_a_current_corpus_still_costs_no_credential_and_no_request', async () => {
    const root = await fixtureKb()

    // REQ-322's property, restated because this ticket is the thing most likely to
    // break it: the comparison is a rendering of declarations already in the tree,
    // so a build that touched nothing must still read no token and make no request.
    // The environment carries no credential at all, and `fetch` throws if called.
    const spent: string[] = []
    const realFetch = globalThis.fetch
    globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
      spent.push(String(args[0]))
      throw new Error('the KB stage made a request it had no business making')
    }) as typeof fetch
    try {
      const outcome = await kbEnsure({ root, env: {} })
      expect(outcome.action).toBe('current')
      expect(outcome.skew?.outdated).toEqual([])

      // THE LINE CLAIMS ONLY WHAT IT CHECKED. "The index covers all N corpus
      // document(s)" was a complete account of a check that never asked whether
      // the corpus was current, printed on every build while `REF-l1` sat two days
      // behind its schema.
      expect(outcome.report).toContain('nothing to build')
      expect(outcome.report).toMatch(/3 projection\(s\) match their source/)
    } finally {
      globalThis.fetch = realFetch
    }
    expect(spent).toEqual([])
  }, 180_000)

  it('test_UAT_FC_BUG-156_an_outdated_projection_with_no_credential_fails_in_this_stage_and_writes_nothing', async () => {
    const root = await fixtureKb()
    putBehindSource(root)
    const snapshot = (): Array<readonly [string, string]> =>
      fs
        .readdirSync(corpusDir(root))
        .filter((name) => name.endsWith('.md'))
        .map(
          (name) =>
            [name, fs.readFileSync(path.join(corpusDir(root), name), 'utf8')] as const,
        )
    const before = snapshot()

    // REFUSED HERE rather than at `1c assets`, with the credential and the reason
    // both named — and BEFORE the corpus is rewritten, so a tree that was
    // previously built is left exactly as it was.
    await expect(kbEnsure({ root, env: {} })).rejects.toThrow(/CLOUDFLARE_API_TOKEN/)
    await expect(kbEnsure({ root, env: {} })).rejects.toThrow(new RegExp(BEHIND))
    expect(snapshot()).toEqual(before)
  }, 180_000)

  it('test_UAT_FC_BUG-156_a_corpus_that_carries_no_projection_is_not_behind_for_lacking_one', async () => {
    // WHETHER A CORPUS IS MISSING A DOCUMENT IS BUG-48'S AXIS — the directory is
    // the boundary — and this ticket adds nothing to it. What it adds is that a
    // projection the corpus DOES carry must be the current one. A corpus that was
    // never meant to hold the projected namespace is coherent, not stale, and a
    // check that said otherwise would fail every suite that brings its own corpus.
    const root = await fixtureKb({ withProjections: false })
    const bundle = await kbBundle(root)
    const skew = await kbSkew(bundle!, root)
    expect(skew.outdated).toEqual([])
    expect(Object.keys(bundle!.docs).filter((name) => name.startsWith('REF-'))).toEqual([])
    await expect(requireCoherentKb(bundle!, root)).resolves.toBeTruthy()
  }, 180_000)

  it('test_UAT_FC_BUG-156_the_refusal_names_the_outdated_projection_and_does_not_blame_the_index', () => {
    // "The index is stale" is a diagnosis an operator cannot act on when the index
    // is fine. The two index states and this one have different subjects — one is
    // the index failing the corpus, the other the corpus failing its source — and
    // an operator told the wrong one looks in the wrong place.
    const message = kbSkewError({
      missing: [],
      stale: [],
      outdated: [BEHIND],
      unmapped: [],
      exempt: ['awareness'],
    })
    expect(message).not.toBeNull()
    expect(message).toContain(BEHIND)
    expect(message).toMatch(/OUTDATED/)
    expect(message).toContain('1c kb build')
    expect(message).not.toContain('corpus and its index disagree')

    // The exemption is not a failure and does not appear among the reasons the
    // build stopped — it would read as one more thing to fix (BUG-48).
    expect(message).not.toContain('awareness')

    // And a coherent, current bundle still earns no message at all.
    expect(kbSkewError({ missing: [], stale: [], outdated: [], unmapped: [], exempt: [] })).toBeNull()
  })
})
