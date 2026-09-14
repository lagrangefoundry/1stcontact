import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  UnsafeAssetNameError,
  isUnsafeAssetName,
  sanitizeAssetName,
} from '../tools/generate/src/store/asset-name'
import { memorySiteStore } from '../tools/generate/src/store/memory-store'
import { fsSiteStore } from '../tools/generate/src/store/fs-store'
import { editAssetAdd } from '../tools/generate/src/cli/edit'

/**
 * REQ-246 §3, §5 AC6–AC10 — **the rule itself, and every adapter obeying it.**
 *
 * WHY THIS IS SEPARATE FROM THE PATH SUITE.
 * `test_UAT_FC_REQ-246_a_usable_name.workers.test.ts` proves the property about
 * a real R2 key, which is the only place it can honestly be proved — but it can
 * only afford a handful of filenames, and the rule has to answer for every shape
 * a file can be called. These cases are the rule at close range, and the
 * adapters that enforce the floor beneath it.
 *
 * IDEMPOTENCE IS NOT A NICETY HERE, it is what makes the design legal: the name
 * is sanitised once in `freeAssetName` — so the collision it decides about is
 * the real one — and again in `editAssetAdd`, which is the one write path every
 * surface reaches. Two applications have to mean one, or the second would be a
 * second rule.
 */

// ── AC6, AC9 — what a name is allowed to contain ─────────────────────────────

describe('REQ-246 AC6/AC9 — a stored name needs no encoding anywhere', () => {
  it('test_UAT_FC_REQ_246_the_unsafe_characters_are_replaced_and_the_extension_kept', () => {
    const cases: Array<[string, string]> = [
      // The real filename from the real incident.
      [
        'How_Can_You_Trust_the_Code_Your_AI_Writes?.pdf',
        'How_Can_You_Trust_the_Code_Your_AI_Writes.pdf',
      ],
      ['my holiday photo.jpg', 'my-holiday-photo.jpg'],
      ['price list #2.pdf', 'price-list-2.pdf'],
      ['100% organic.png', '100-organic.png'],
      ['terms & conditions.pdf', 'terms-conditions.pdf'],
      // A RUN COLLAPSES rather than becoming a run of hyphens — `a---b.svg` is
      // not a name anybody would have typed.
      ['a  b   c.svg', 'a-b-c.svg'],
      // Leading and trailing punctuation goes; it would otherwise produce names
      // like `-logo.png` that read as a flag to half the tools that see them.
      ['  logo  .png', 'logo.png'],
      // A path a directory upload hands over is a name in its last segment and
      // nothing else — on either platform's separator.
      ['Pictures/2026/logo.svg', 'logo.svg'],
      ['C:\\Users\\alice\\mark.png', 'mark.png'],
      // Case is preserved: it is the client's name for their own file, and
      // lowercasing it would be a second, unrelated opinion.
      ['Annual-Report-2026.PDF', 'Annual-Report-2026.PDF'],
      // A dot inside the stem is safe and stays.
      ['v1.2.3-notes.txt', 'v1.2.3-notes.txt'],
      // Anything outside the ASCII unreserved set has to go, however innocent,
      // because a character that needs percent-encoding in a path is exactly the
      // one that makes the stored name and the referenced name differ.
      ['Café Menu.pdf', 'Caf-Menu.pdf'],
      ['naïve.png', 'na-ve.png'],
    ]

    for (const [given, expected] of cases) {
      expect(sanitizeAssetName(given), given).toBe(expected)
      // AC9 STATED AS A PROPERTY RATHER THAN A LIST: whatever comes out, the
      // name a page references and the name the bytes are stored under are one
      // string, with no reader in between that has to encode or decode.
      expect(encodeURIComponent(sanitizeAssetName(given)), given).toBe(sanitizeAssetName(given))
    }
  })

  it('test_UAT_FC_REQ_246_sanitising_twice_means_sanitising_once', () => {
    // WHAT MAKES IT LEGAL TO APPLY AT TWO POINTS ON ONE PATH. `freeAssetName`
    // sanitises so the collision is the real one; `editAssetAdd` sanitises
    // because it is the one write path and cannot assume its caller did.
    for (const given of [
      'How_Can_You_Trust_the_Code_Your_AI_Writes?.pdf',
      'my holiday photo.jpg',
      '???',
      'Pictures/2026/logo.svg',
      'a  b   c.svg',
      'whitepaper-1-2.pdf',
      'logo.png',
    ]) {
      const once = sanitizeAssetName(given)
      expect(sanitizeAssetName(once), given).toBe(once)
    }
  })
})

// ── AC7 — nothing sanitises to nothing ───────────────────────────────────────

describe('REQ-246 AC7 — a name that sanitises to nothing is still a name', () => {
  it('test_UAT_FC_REQ_246_an_unusable_name_still_yields_a_usable_one', () => {
    // REFUSING A CLIENT'S FILE OVER ITS FILENAME IS NOT A THING THIS PRODUCT
    // SHOULD DO, so the rule is total. Every one of these is a name somebody can
    // type, and the ones that carried an extension keep it.
    for (const given of ['???', '***', '   ', '..', '.', '%%%.png', '---.pdf', '']) {
      const name = sanitizeAssetName(given)
      expect(name, given).not.toBe('')
      expect(name, given).toMatch(/^[A-Za-z0-9._-]+$/)
      expect(name, given).not.toMatch(/^[-.]|[-.]$/)
    }

    // The extension survives even when the stem does not, because the extension
    // is what every consumer reads the type from.
    expect(sanitizeAssetName('%%%.png')).toBe('file.png')
    expect(sanitizeAssetName('?.pdf')).toBe('file.pdf')
    expect(sanitizeAssetName('???')).toBe('file')
  })
})

/** Every file under `dir`, recursively — used to prove nothing escaped. */
function everyFileUnder(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...everyFileUnder(full))
    else found.push(full)
  }
  return found
}

// ── AC10 — the floor, in every adapter ───────────────────────────────────────

describe('REQ-246 AC10 — no write reports success while dropping bytes', () => {
  it('test_UAT_FC_REQ_246_the_refused_names_are_stated_once', () => {
    // THE HARD FLOOR IS NARROWER THAN THE SANITISER, deliberately: an asset
    // stored under an awkward-but-harmless name has to go on resolving and go on
    // being published, so only what cannot be a single key segment at all is
    // refused.
    for (const name of ['nested/logo.png', 'back\\slash.png', '..', '../escape.png', '.', '']) {
      expect(isUnsafeAssetName(name), name).toBe(true)
    }
    for (const name of [
      'logo.png',
      'How_Can_You_Trust_the_Code_Your_AI_Writes?.pdf',
      'a b c.png',
      'file',
    ]) {
      expect(isUnsafeAssetName(name), name).toBe(false)
    }
  })

  it('test_UAT_FC_REQ_246_every_adapter_refuses_rather_than_skipping', async () => {
    // BOTH NODE-SIDE ADAPTERS, because the rule is one rule. The D1/R2 store is
    // where the silent `continue` was; the filesystem adapter never checked at
    // all, so a name with a separator in it composed a path that left the assets
    // directory entirely. (The D1/R2 half is proved against real bindings in the
    // `.workers` sibling — it cannot be run here.)
    const bytes = new TextEncoder().encode('x')

    const memory = memorySiteStore()
    memory.seed('acme', { siteJson: { name: 'acme' }, pages: {} })
    await expect(memory.write('acme', { assets: [{ name: '../escape.png', bytes }] })).rejects.toThrow(
      UnsafeAssetNameError,
    )
    expect(await memory.listAssets('acme')).toEqual([])

    const root = mkdtempSync(path.join(tmpdir(), 'req246-'))
    try {
      const disk = fsSiteStore({ cwd: root, root: 'sites' })
      await disk.write('acme', { siteJson: { name: 'acme' } })

      await expect(
        disk.write('acme', { assets: [{ name: '../../escape.png', bytes }] }),
      ).rejects.toThrow(UnsafeAssetNameError)

      // NOTHING WAS WRITTEN ANYWHERE UNDER THE ROOT, which is the failure this
      // adapter's missing check actually permitted: the name went straight into
      // a `path.join` and composed a path outside the assets directory.
      expect(everyFileUnder(root).filter((f) => f.endsWith('.png'))).toEqual([])
      expect(await disk.listAssets('acme')).toEqual([])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('test_UAT_FC_REQ_246_the_one_write_path_sanitises_before_it_writes', async () => {
    // `editAssetAdd` IS THE PLACE ITS OWN COMMENT ALREADY CLAIMED. Every surface
    // that can name a file — `1c asset add`, the AI toolbox's adapter, a client's
    // drag onto the conversation — arrives through it, so the rule is applied
    // once and the answer it reports is the name that actually landed.
    const store = memorySiteStore()
    store.seed('acme', { siteJson: { name: 'acme' }, pages: {} })
    const out = await editAssetAdd(
      'acme',
      'my holiday photo.jpg',
      new TextEncoder().encode('a photograph'),
      { store, actor: 'operator' },
    )

    const asset = (out.data as { asset: { id: string; src: string } }).asset
    expect(asset.id).toBe('my-holiday-photo.jpg')
    expect(asset.src).toBe('/assets/my-holiday-photo.jpg')
    // THE HUMAN LINE AND THE JOURNAL NOTE SAY THE NAME IT LANDED UNDER, not the
    // one it was asked for — a caller that cannot learn the real name cannot
    // reference the picture it just added.
    expect(out.human).toContain('my-holiday-photo.jpg')
    expect(await store.listAssets('acme')).toEqual(['my-holiday-photo.jpg'])

    // AND THE COLLISION CHECK IS ABOUT THE SANITISED NAME, so a second file
    // whose name sanitises the same way is refused rather than replacing the
    // first. (Promotion mints a free name instead; the CLI has an operator to
    // tell, so it refuses — that split predates this ticket and survives it.)
    await expect(
      editAssetAdd('acme', 'my  holiday  photo.jpg', new TextEncoder().encode('another'), {
        store,
        actor: 'operator',
      }),
    ).rejects.toThrow(/already exists/)
    expect(new TextDecoder().decode((await store.readAsset('acme', asset.id))!)).toBe(
      'a photograph',
    )
  })
})
