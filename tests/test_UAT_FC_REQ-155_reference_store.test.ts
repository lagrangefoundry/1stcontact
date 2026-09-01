import { describe, expect, it, afterEach } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { registerReferenceStoreContract } from './support/reference-store-contract'
import { syntheticCapture, syntheticL1, syntheticMultiState } from './support/reference-fixtures'
import {
  bundleDir,
  bundleDirFor,
  fsReferenceBundle,
  fsReferenceStore,
  ladderScreenshotPath,
} from '../tools/generate/src/store/fs-reference-store'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { bundleNameFor, pathSlug } from '../tools/generate/src/store/reference-store'
import { readL1, readMultiState, writeMultiState } from '../tools/generate/src/cli/capture/bundle'
import { cmdRefold } from '../tools/generate/src/cli/repro'

/**
 * REQ-155 — the `ReferenceStore` port, and the filesystem behind it.
 *
 * WHAT THIS FILE CARRIES AND WHAT IT DELEGATES. The adapter-agnostic assertions
 * live in `support/reference-store-contract.ts` and are registered below against
 * the two adapters that can run in node; the R2 one registers the SAME module
 * from inside workerd (`…_reference_store.workers.test.ts`). What is here on top
 * is the part that is genuinely node's: the structural proof that the capture
 * pipeline no longer reaches the filesystem (AC1), that `--ref <dir>` still
 * addresses exactly the tree it always did (AC6), and that `refold` runs over
 * either adapter without knowing which it got (AC4).
 */

const dirs: string[] = []
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true })
})

function tmp(prefix: string): string {
  const d = mkdtempSync(path.join(tmpdir(), prefix))
  dirs.push(d)
  return d
}

// ── the contract, over both node-side adapters ───────────────────────────────

registerReferenceStoreContract({
  name: 'filesystem',
  async makeStore() {
    return fsReferenceStore(tmp('req155-fs-'))
  },
})

registerReferenceStoreContract({
  name: 'memory',
  async makeStore() {
    return memoryReferenceStore()
  },
})

// ── AC1 — no `node:` import is reachable from the capture pipeline ───────────

describe('REQ-155 AC1 — the capture pipeline cannot reach the filesystem', () => {
  /**
   * ASSERTED AGAINST THE SOURCE, NOT AGAINST A MOCK, and that is the only way
   * this claim is checkable. "No `node:fs` call remains reachable" is a property
   * of the import graph: a runtime probe would prove one path did not touch the
   * disk on one run, while a stale `import { writeFileSync }` sitting unused
   * would still make the module unloadable in a Worker. So the test reads the
   * modules the pipeline is made of and looks at what they import.
   */
  const SRC = path.join(__dirname, '..', 'tools', 'generate', 'src', 'cli', 'capture')
  const PIPELINE = ['bundle.ts', 'capture.ts', 'pipeline.ts', 'extract.ts', 'values-diff.ts', 'hints.ts', 'theme.ts', 'sections.ts']

  it('test_UAT_FC_REQ-155_capture_pipeline_modules_import_no_node_builtin', () => {
    const offenders: string[] = []
    for (const file of PIPELINE) {
      const src = readFileSync(path.join(SRC, file), 'utf8')
      for (const m of src.matchAll(/from\s+'(node:[^']+)'/g)) offenders.push(`${file} → ${m[1]}`)
    }
    expect(offenders).toEqual([])
  })

  it('test_UAT_FC_REQ-155_the_codec_calls_no_filesystem_verb_at_all', () => {
    // Belt and braces against the import-free way to reach the filesystem: a
    // `require`, or a re-export of a helper that has one. Comments are stripped
    // first, because the module's own documentation legitimately DISCUSSES the
    // verbs it no longer calls — a check that could not tell prose from code
    // would force the explanation out of the file to stay green, which is the
    // wrong thing to optimise for.
    const codec = readFileSync(path.join(SRC, 'bundle.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
    for (const verb of ['mkdirSync', 'writeFileSync', 'readFileSync', 'existsSync', 'readdirSync', 'require(']) {
      expect(codec, `bundle.ts must not call ${verb}`).not.toContain(verb)
    }
  })

  it('test_UAT_FC_REQ-155_reextract_is_node_only_and_says_so', () => {
    // The decision recorded in the ticket: `reextract` loses `node:fs` (its
    // members come from the port) and KEEPS `node:http`, because the real
    // navigation of mirrored bytes is the point and workerd has no loopback
    // server to perform it against. Asserting both halves stops a later change
    // quietly "finishing the port" by dropping the navigation.
    const src = readFileSync(path.join(SRC, 'reextract.ts'), 'utf8')
    expect(src).not.toMatch(/from\s+'node:fs'/)
    expect(src).toMatch(/from\s+'node:http'/)
  })
})

// ── AC6 — `--ref <dir>` addresses exactly the tree it always did ─────────────

describe('REQ-155 AC6 — the filesystem layout is unchanged', () => {
  it('test_UAT_FC_REQ-155_bundle_name_and_directory_agree_with_doc13', () => {
    const cwd = tmp('req155-layout-')
    // DOC-13 §4's layout, reached two ways that must agree: the name a capture
    // derives from its URL, and the directory an operator types after `--ref`.
    expect(bundleNameFor({ host: 'faelan.com', path: '/' })).toBe('faelan.com/index')
    expect(bundleDirFor(cwd, { host: 'faelan.com', path: '/' })).toBe(
      path.join(cwd, 'storage', 'references', 'faelan.com', 'index'),
    )
    expect(bundleDir(cwd, bundleNameFor({ host: 'faelan.com', path: '/about/team' }))).toBe(
      path.join(cwd, 'storage', 'references', 'faelan.com', 'about_team'),
    )
    // A path segment is slugged to one safe name segment, so a nested URL never
    // becomes a nested directory the `--ref` argument cannot name.
    expect(pathSlug('/a/b?c=d')).toBe('a_b_c_d')
  })

  it('test_UAT_FC_REQ-155_store_writes_land_where_ref_reads_them', async () => {
    const cwd = tmp('req155-roundtrip-')
    const capture = syntheticCapture()
    const store = fsReferenceStore(cwd)
    const written = store.bundle(bundleNameFor(capture))
    await writeMultiState(written, syntheticMultiState())

    // The bytes are on disk at DOC-13 §4's path — an operator could `cat` them.
    const dir = bundleDirFor(cwd, capture)
    expect(readdirSync(dir)).toContain('multistate.json')

    // And `--ref <dir>` — a directory handle, not a store lookup — reads the
    // same artifact back. This is the whole of AC6: the port moved the read, not
    // the layout, so the two ways in agree.
    expect(await readMultiState(fsReferenceBundle(dir))).toEqual(syntheticMultiState())
  })

  it('test_UAT_FC_REQ-155_a_bundle_outside_storage_references_is_addressable', async () => {
    // Every reproduction verb takes a directory the operator typed, which may be
    // a scratch copy or a fixture under a temp dir and need not be under
    // `storage/references/` at all. The filesystem adapter opens a bundle
    // wherever it is; the name a CAPTURE gets is still derived from its URL.
    const loose = tmp('req155-loose-')
    const bundle = fsReferenceBundle(loose)
    await writeMultiState(bundle, syntheticMultiState())
    expect(bundle.name).toBe(loose)
    expect(await readMultiState(fsReferenceBundle(loose))).not.toBeNull()
  })

  it('test_UAT_FC_REQ-155_ladder_screenshot_keeps_its_filename', () => {
    // `1c diff --size` resolves a PATH here deliberately (the image layer still
    // takes one until REQ-156), and it must be the same name the codec writes.
    const dir = tmp('req155-ladder-')
    expect(ladderScreenshotPath(dir, 768)).toBe(path.join(dir, 'screenshot-768.png'))
  })
})

// ── AC4 — refold runs over either adapter ────────────────────────────────────

describe('REQ-155 AC4 — `refold` re-derives from a stored bundle, on any adapter', () => {
  /**
   * The one reproduction verb that takes a {@link ReferenceBundle} rather than a
   * directory, because everything it needs is in the bundle (the retained oracle
   * in, `l1.json` and `forms.json` out) and nothing it needs is on the machine
   * running it. Proving it over BOTH node adapters is what makes the R2 claim
   * credible: the verb demonstrably does not know which store it has.
   */
  it('test_UAT_FC_REQ-155_refold_rewrites_l1_from_the_retained_oracle_on_disk', async () => {
    const cwd = tmp('req155-refold-fs-')
    const store = fsReferenceStore(cwd)
    const bundle = store.bundle('example.test/pricing')
    await writeMultiState(bundle, syntheticMultiState())
    // `capture.json` is read for its font handles, so a refold needs it present.
    await bundle.write('capture.json', new TextEncoder().encode(JSON.stringify(syntheticCapture())))

    // Nothing derived exists yet…
    expect(await readL1(bundle)).toBeNull()
    const result = await cmdRefold(bundle)
    // …and afterwards both derived members do, named by the bundle they came from.
    expect(result.bundle).toBe('example.test/pricing')
    expect(await readL1(bundle)).not.toBeNull()
    expect(await bundle.list()).toContain('forms.json')
    // The oracle is untouched: a refold changes what we DERIVE, never what we
    // OBSERVED.
    expect(await readMultiState(bundle)).toEqual(syntheticMultiState())
  })

  it('test_UAT_FC_REQ-155_refold_runs_identically_against_a_non_filesystem_store', async () => {
    const store = memoryReferenceStore()
    const bundle = store.bundle('example.test/pricing')
    await writeMultiState(bundle, syntheticMultiState())
    await bundle.write('capture.json', new TextEncoder().encode(JSON.stringify(syntheticCapture())))

    const result = await cmdRefold(bundle)
    expect(result.bundle).toBe('example.test/pricing')
    expect(await readL1(bundle)).not.toBeNull()
    // No disk was touched — the verb never learned there was one.
    expect(await bundle.list()).toContain('l1.json')
  })

  it('test_UAT_FC_REQ-155_refold_refuses_a_bundle_with_no_retained_oracle', async () => {
    const store = memoryReferenceStore()
    const bundle = store.bundle('stale.test/index')
    // A bundle predating multi-state capture has nothing to re-fold, and the
    // refusal must name the bundle and the fix rather than fail on a parse.
    await expect(cmdRefold(bundle)).rejects.toThrow(/stale\.test\/index/)
    await expect(cmdRefold(bundle)).rejects.toThrow(/re-capture/)
  })
})

// ── the fs adapter's own listing, which the port cannot state ────────────────

describe('REQ-155 — the filesystem store enumerates what is on disk', () => {
  it('test_UAT_FC_REQ-155_fs_store_lists_host_slug_pairs_and_ignores_stray_files', async () => {
    const cwd = tmp('req155-list-')
    const root = path.join(cwd, 'storage', 'references')
    mkdirSync(path.join(root, 'a.test', 'index'), { recursive: true })
    mkdirSync(path.join(root, 'b.test', 'pricing'), { recursive: true })
    writeFileSync(path.join(root, 'a.test', 'index', 'l1.json'), '{}')
    writeFileSync(path.join(root, 'README'), 'not a bundle')

    // Two segments deep is what a bundle name is, so a loose file at the root is
    // not one and neither is a bare host directory.
    expect(await fsReferenceStore(cwd).list()).toEqual(['a.test/index', 'b.test/pricing'])
  })

  it('test_UAT_FC_REQ-155_fs_store_list_is_empty_before_anything_is_captured', async () => {
    expect(await fsReferenceStore(tmp('req155-empty-')).list()).toEqual([])
  })
})
