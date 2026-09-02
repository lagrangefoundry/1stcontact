import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * story-a7a12d81 — **the material store, as the deployment declares it**.
 *
 * The runtime half of this story is proved in workerd against two real object
 * stores (`reconciliation-material-blob-storage.workers.test.ts`). This is the
 * half that is about the configuration file: that a destination for attachment
 * bytes is declared on BOTH halves of `apps/control-app/wrangler.toml`, that the
 * two name one target rather than two that could diverge, and — the claim the
 * story leads with — that neither half ever names the store the public site is
 * served from.
 *
 * WHY THE SEPARATION IS ASSERTED HERE AND NOT INFERRED. A general criterion
 * elsewhere in the matrix already requires that everything declared at the top
 * level is repeated under the named environment, and the site store's own
 * criterion pairs its targets across the two halves. Neither says a SECOND store
 * exists, and neither says why it must not be the first. Those are this story's
 * claims, so they are made here, against the file, in both halves independently.
 *
 * NOTHING IS COUNTED ACROSS THE FILE. Every reading below pairs a bucket to the
 * binding name that declares it, inside the table path that half owns — a count
 * of `bucket_name` occurrences would be satisfied by two declarations of the
 * wrong bucket, which is precisely the mistake this file exists to catch.
 */

const REPO = path.resolve(__dirname, '..')
const CONTROL_APP = path.join(REPO, 'apps', 'control-app', 'wrangler.toml')
const PUBLIC_SITE = path.join(REPO, 'apps', 'public-site', 'wrangler.toml')

/** The binding the ticket store's attachment bytes go to. */
const MATERIAL = 'BLOBS'
/** The binding the published site's assets go to. */
const PUBLISHED = 'SITES'

const toml = readFileSync(CONTROL_APP, 'utf8')

interface Block {
  /** Dotted table path, e.g. `r2_buckets` or `env.production.r2_buckets`. */
  table: string
  keys: Map<string, string>
  /** Line index of the header, and of the first line after the block. */
  start: number
  end: number
}

/** Strip a trailing comment, so prose about a bucket is never read as a declaration. */
const bare = (line: string): string => line.replace(/(^|\s)#.*$/, '').trim()

/**
 * The file as its tables, in order, each carrying the lines it spans.
 *
 * Enough of a TOML reader to answer one question — which table declares which
 * binding — and no more, following the reader `tests/support/wrangler-toml.ts`
 * already establishes for the same file. The line span is what lets a mutation
 * below remove exactly one declaration and nothing else.
 */
function blocks(source: string): Block[] {
  const lines = source.split('\n')
  const out: Block[] = [{ table: '', keys: new Map(), start: 0, end: lines.length }]
  lines.forEach((raw, index) => {
    const line = bare(raw)
    if (line === '') return
    const header = /^\[\[?([^\]]+)\]\]?$/.exec(line)
    if (header) {
      out[out.length - 1].end = index
      out.push({ table: header[1].trim(), keys: new Map(), start: index, end: lines.length })
      return
    }
    const assignment = /^([A-Za-z0-9_.-]+)\s*=\s*"([^"]*)"$/.exec(line)
    if (assignment) out[out.length - 1].keys.set(assignment[1], assignment[2])
  })
  return out
}

/** Which half of the file a table belongs to. */
type Half = 'local' | 'deployed'

/** The table path an object-store declaration takes in each half. */
const R2_TABLE: Record<Half, string> = {
  local: 'r2_buckets',
  deployed: 'env.production.r2_buckets',
}

/**
 * `binding -> target` for one half, read only from that half's own tables.
 *
 * The deployed half is read from `env.production.*` and nowhere else, which is
 * what makes "restated rather than inherited" an actual observation: a top-level
 * declaration cannot satisfy it, exactly as wrangler cannot.
 */
function stores(source: string, half: Half): Map<string, string> {
  const out = new Map<string, string>()
  for (const block of blocks(source)) {
    if (block.table !== R2_TABLE[half]) continue
    const binding = block.keys.get('binding')
    const bucket = block.keys.get('bucket_name')
    if (binding !== undefined && bucket !== undefined) out.set(binding, bucket)
  }
  return out
}

/** The file with one declaration removed — the mutation each check is tested against. */
function withoutStore(source: string, half: Half, binding: string): string {
  const lines = source.split('\n')
  const target = blocks(source).find(
    (b) => b.table === R2_TABLE[half] && b.keys.get('binding') === binding,
  )
  expect(target, `there is a ${binding} declaration in the ${half} half to remove`).toBeDefined()
  return [...lines.slice(0, target!.start), ...lines.slice(target!.end)].join('\n')
}

/** The file with one declaration re-pointed at another target. */
function repointStore(source: string, half: Half, binding: string, to: string): string {
  const lines = source.split('\n')
  const target = blocks(source).find(
    (b) => b.table === R2_TABLE[half] && b.keys.get('binding') === binding,
  )!
  const patched = lines
    .slice(target.start, target.end)
    .map((l) => (/^\s*bucket_name\s*=/.test(l) ? `bucket_name = "${to}"` : l))
  return [...lines.slice(0, target.start), ...patched, ...lines.slice(target.end)].join('\n')
}

// ── AC-1490: declared on both halves, naming one target ──────────────────────

describe('story-a7a12d81 — the material store is declared on both halves of the deployment', () => {
  it('test_UAT_AC1490_both_halves_declare_the_material_store_and_name_the_same_target', () => {
    const local = stores(toml, 'local')
    const deployed = stores(toml, 'deployed')

    // ── (a) the half `wrangler dev` reads declares it ───────────────────────
    expect(local.get(MATERIAL), 'the local half declares a destination for attachment bytes')
      .toBeDefined()
    expect(local.get(MATERIAL)).not.toBe('')

    // ── (b) and the named deployed half declares it too, restated ───────────
    // Read from `env.production.*` alone, because that is all wrangler reads: a
    // named environment inherits neither values nor bindings, so an omitted
    // restatement leaves the deployed application with no destination at all.
    expect(deployed.get(MATERIAL), 'the deployed half restates it rather than inheriting it')
      .toBeDefined()

    // ── (c) both name the SAME target ───────────────────────────────────────
    // Not implied by (a) and (b): both would pass with the deployment pointing
    // at a second store that could diverge from the one dev exercises.
    expect(deployed.get(MATERIAL)).toBe(local.get(MATERIAL))

    // ── (d) paired by binding name, never counted across the file ───────────
    // A count of `bucket_name` lines is satisfied by two declarations of the
    // wrong store. This reading is not, and here is the evidence: dropping the
    // deployed declaration is reported, and dropping the local one is reported
    // separately, rather than one absence being covered by the other's presence.
    expect(stores(withoutStore(toml, 'deployed', MATERIAL), 'deployed').get(MATERIAL))
      .toBeUndefined()
    expect(stores(withoutStore(toml, 'deployed', MATERIAL), 'local').get(MATERIAL))
      .toBe(local.get(MATERIAL))
    expect(stores(withoutStore(toml, 'local', MATERIAL), 'local').get(MATERIAL)).toBeUndefined()

    // …and a deployed half that named a DIFFERENT store passes (a) and (b) and
    // fails (c), which is the whole reason (c) is stated.
    expect(stores(repointStore(toml, 'deployed', MATERIAL, 'somewhere-else'), 'deployed').get(MATERIAL))
      .not.toBe(local.get(MATERIAL))
  })
})

// ── AC-1489: and it is never the store the public site is served from ────────

describe('story-a7a12d81 — the material store is never the published-site store', () => {
  it('test_UAT_AC1489_neither_half_points_attachment_bytes_at_the_public_sites_store', () => {
    // The public site's own store, read from the Worker that serves the public
    // internet rather than named as a literal here — "not the published-site
    // store under any name" is a claim about that Worker's bindings, so that is
    // where the names come from.
    const publicSite = readFileSync(PUBLIC_SITE, 'utf8')
    const publicTargets = new Set(
      (['local', 'deployed'] as Half[]).flatMap((half) => [...stores(publicSite, half).values()]),
    )
    expect(publicTargets.size, 'the public site declares a store to be distinct from').toBeGreaterThan(0)

    for (const half of ['local', 'deployed'] as Half[]) {
      const declared = stores(toml, half)
      const material = declared.get(MATERIAL)
      expect(material, `the ${half} half declares a material destination`).toBeDefined()

      // ── (a) not the target the published site's assets go to ──────────────
      // Asserted on each half INDEPENDENTLY: the deployed half is the one that
      // matters and the one nothing else would catch.
      expect(material, `${half}: attachment bytes do not go to the published-site target`)
        .not.toBe(declared.get(PUBLISHED))
      // ── (b) nor that store under any other binding name ───────────────────
      expect(
        publicTargets.has(material!),
        `${half}: attachment bytes do not go to a store apps/public-site serves`,
      ).toBe(false)

      // ── (c) and the published-site store is still declared ────────────────
      // A separation claim passes trivially if SITES has simply been dropped,
      // which would break publishing instead of protecting material. The
      // criterion is that TWO distinct stores are declared, not that one is
      // missing.
      expect(declared.get(PUBLISHED), `${half}: the published-site store is still declared`)
        .toBeDefined()
      expect(publicTargets.has(declared.get(PUBLISHED)!)).toBe(true)
    }

    // ── the check has teeth, on each half separately ────────────────────────
    // Re-point attachment bytes at the published-site store and the claim above
    // must stop holding — otherwise it is a comment that happens to be true.
    for (const half of ['local', 'deployed'] as Half[]) {
      const published = stores(toml, half).get(PUBLISHED)!
      const mutated = stores(repointStore(toml, half, MATERIAL, published), half)
      expect(mutated.get(MATERIAL), `${half}: the mutation is detectable`).toBe(mutated.get(PUBLISHED))
      expect(publicTargets.has(mutated.get(MATERIAL)!)).toBe(true)
    }
  })
})
