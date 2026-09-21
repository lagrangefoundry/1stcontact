/**
 * REQ-290 — the file-backed authoring tier is retired.
 *
 * WHAT WAS RETIRED, AND WHAT DELIBERATELY WAS NOT. `storage/sites/` had three
 * uses and only one of them was dead. Authoring a real site on disk — `1c new`
 * against the `sites` root, then a push script to copy it up — is superseded by
 * the builder, whose D1/R2 store is where every real site now lives. The
 * reproduction substrate (`1c repro` and the fidelity loop over it) and the
 * corpus of hand-authored L1 the conformance suites read are both load-bearing,
 * and deleting the tree without separating them first breaks the build.
 *
 * WHY A RETIRED PATH THAT STILL WORKS IS THE DEFECT. The ticket exists because
 * an investigation looked in `storage/sites/` for a site, found nothing, and
 * reported that the site did not exist. It existed, in the builder's store. A
 * retired path that still answers is worse than one that is gone, because it
 * answers when an agent asks it a question — so several of these assert an
 * ABSENCE, which is the only form that claim can take.
 *
 * THESE DRIVE THE SHIPPED LAUNCHER. The root a command resolves is decided in
 * `run()`'s argument handling, and a test that called `cmdNew` directly would
 * be asserting the library's default rather than the CLI's — which is exactly
 * the distinction REQ-290 turns on, because the library still addresses both
 * roots and the CLI no longer chooses between them.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadSite } from '../tools/generate/src/store'
import { resetPlan } from '../tools/generate/src/cli/reset'
import { L1_CORPUS_CWD, L1_CORPUS_SITES } from './fixtures/l1-corpus/corpus'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LAUNCHER = path.join(REPO, 'tools', 'generate', 'bin', '1c.mjs')

/** The three sites the corpus carries, and has to keep carrying. */
const CORPUS_SLUGS = ['1stcontact', 'gigabytealchemy', 'xgd']

/** The retired script and verb, spelled at runtime. See the scan below. */
const NEEDLES = ['bin/' + 'publish', '1c ' + 'push']

let cwd: string
let help: string

beforeAll(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req290-'))
  help = execFileSync('node', [LAUNCHER, 'help'], { cwd: REPO, encoding: 'utf8' })
}, 300_000)

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe('REQ-290 — storage/sites/ ceases to be an authoring tier', () => {
  it('test_UAT_FC_REQ-290_the_three_site_trees_are_gone_from_storage', () => {
    // The tree itself, not just its contents: a surviving empty `storage/sites/`
    // is still a directory an agent finds and reads as a place sites go.
    expect(existsSync(path.join(REPO, 'storage', 'sites'))).toBe(false)
  })

  it('test_UAT_FC_REQ-290_the_push_script_and_its_helper_are_deleted', () => {
    expect(existsSync(path.join(REPO, 'bin', 'publish'))).toBe(false)
    // The throwaway authoring helper spliced sections into one page of the tree
    // that just went, and nothing else. It goes with what it edited.
    expect(existsSync(path.join(REPO, 'bin', 'author_xgd_sections.py'))).toBe(false)
  })

  it('test_UAT_FC_REQ-290_nothing_tracked_outside_the_ticket_store_names_the_push_script', () => {
    // "A grep for it returns only the tickets and documents that record its
    // retirement." Asserted over the TRACKED tree, which is what a fresh clone
    // has and what an agent greps — and over `git ls-files` rather than a walk,
    // so build output and node_modules cannot make this pass or fail by being
    // present. `.xgd/` is the ticket store: history, and out of scope by the
    // ticket's own words.
    const tracked = execFileSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' })
      .split('\n')
      .filter((f) => f !== '' && !f.startsWith('.xgd/'))

    const offenders: string[] = []
    for (const file of tracked) {
      const full = path.join(REPO, file)
      if (!existsSync(full)) continue
      let text: string
      try {
        text = readFileSync(full, 'utf8')
      } catch {
        continue // binary asset; nothing to read a path out of
      }
      // Both names the operator was ever given for this path — SPLICED rather
      // than written whole, because this file is inside the tree it scans and a
      // literal here would be the one hit that could never be cleaned up.
      if (NEEDLES.some((n) => text.includes(n))) offenders.push(file)
    }
    expect(offenders, 'files still naming the retired push path').toEqual([])
  })
})

describe('REQ-290 — the CLI always uses the sandbox root', () => {
  it('test_UAT_FC_REQ-290_a_created_site_lands_in_sandbox_with_no_flag_typed', () => {
    // The case that would have quietly rebuilt the retired tier: no flag, so the
    // old default applied and `storage/sites/<slug>` came back one site at a
    // time. Pinning `1c repro` alone would have left exactly this open.
    const out = spawnSync('node', [LAUNCHER, 'new', 'alpha'], { cwd, encoding: 'utf8' })
    expect(out.stderr, out.stderr).not.toMatch(/error/i)
    expect(out.status).toBe(0)
    expect(existsSync(path.join(cwd, 'storage', 'sandbox', 'alpha', 'draft'))).toBe(true)
    expect(existsSync(path.join(cwd, 'storage', 'sites'))).toBe(false)
  })

  it('test_UAT_FC_REQ-290_the_sandbox_flag_is_redundant_rather_than_removed', () => {
    // Still accepted, because a flag that errors is a worse answer than a flag
    // that means what it always meant — but it selects nothing now, so it lands
    // the site in the one place a site can land.
    const out = spawnSync('node', [LAUNCHER, 'new', 'beta', '--sandbox'], { cwd, encoding: 'utf8' })
    expect(out.status).toBe(0)
    expect(existsSync(path.join(cwd, 'storage', 'sandbox', 'beta', 'draft'))).toBe(true)
    expect(existsSync(path.join(cwd, 'storage', 'sites'))).toBe(false)
  })

  it('test_UAT_FC_REQ-290_rendered_output_lands_under_dist_sandbox', () => {
    // The root a command resolves reaches the render path too: `distDir` is
    // `storage/dist/<root>/<slug>/<channel>/`, so a render that still wrote
    // `dist/sites/` would mean the flip had missed a call site.
    const out = spawnSync('node', [LAUNCHER, 'render', 'alpha'], { cwd, encoding: 'utf8' })
    expect(out.status, out.stderr).toBe(0)
    expect(existsSync(path.join(cwd, 'storage', 'dist', 'sandbox', 'alpha', 'draft'))).toBe(true)
    expect(existsSync(path.join(cwd, 'storage', 'dist', 'sites'))).toBe(false)
  })

  it('test_UAT_FC_REQ-290_help_lists_no_push_verb_and_no_root_selector', () => {
    // Read as a list of verbs rather than matched as a literal, because this
    // file is itself inside the tracked tree the absence test above scans: a
    // regex spelling the retired command out would make that test fail on this
    // one.
    const verbs = help
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('1c '))
      .map((l) => l.split(/\s+/)[1])
    expect(verbs).not.toContain('push')
    // The flag comes out of the usage text because it no longer selects
    // anything; documenting a choice that is not offered is how the retired
    // tier would keep being advertised.
    expect(help).not.toContain('--sandbox')
    // And the paragraph that used to describe two trees now describes one.
    expect(help).toContain('storage/sandbox/')
  })

  it('test_UAT_FC_REQ-290_push_is_no_longer_a_command', () => {
    const out = spawnSync('node', [LAUNCHER, 'push', 'alpha'], { cwd, encoding: 'utf8' })
    expect(out.status).not.toBe(0)
  })
})

describe('REQ-290 — the L1 conformance corpus moved intact', () => {
  it('test_UAT_FC_REQ-290_the_corpus_carries_the_same_three_sites', () => {
    const found = readdirSync(L1_CORPUS_SITES).filter((n) => !n.startsWith('.')).sort()
    expect(found).toEqual([...CORPUS_SLUGS].sort())
    for (const slug of CORPUS_SLUGS) {
      expect(existsSync(path.join(L1_CORPUS_SITES, slug, 'draft', 'site.json')), slug).toBe(true)
      const pages = readdirSync(path.join(L1_CORPUS_SITES, slug, 'draft', 'pages'))
      expect(pages.filter((f) => f.endsWith('.json')).length, `${slug} pages`).toBeGreaterThan(0)
    }
  })

  it('test_UAT_FC_REQ-290_the_corpus_keeps_repo_shape_and_loads_as_a_store_context', () => {
    // THIS is what repo shape buys, and the reason the fixture keeps a
    // `storage/sites/` segment inside it: two suites address the corpus through
    // a StoreContext, and `siteDir` resolves `<cwd>/storage/<root>/<slug>`. A
    // flattened fixture would have needed a second path resolver or rewritten
    // assertions in every suite that reads one.
    expect(path.join(L1_CORPUS_CWD, 'storage', 'sites')).toBe(L1_CORPUS_SITES)
    for (const slug of CORPUS_SLUGS) {
      const loaded = loadSite({ cwd: L1_CORPUS_CWD, root: 'sites' }, slug, 'draft')
      expect(loaded.ok, loaded.ok ? '' : `${slug}: ${JSON.stringify(loaded.errors)}`).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-290_the_corpus_says_what_it_is_and_what_it_is_not', () => {
    // The path `storage/sites/` still reads as an authoring tier to anything
    // grepping for it. One file closes that, and it is only worth anything if it
    // actually says the three things — so they are asserted rather than trusted.
    const readme = readFileSync(path.join(L1_CORPUS_CWD, 'README.md'), 'utf8')
    expect(readme).toMatch(/frozen test input/i)
    expect(readme).toMatch(/not an authoring tier/i)
    expect(readme).toMatch(/made in the builder/i)
  })
})

describe('REQ-290 — 1c reset stops advertising a source it no longer has', () => {
  it('test_UAT_FC_REQ-290_reset_no_longer_reports_storage_sites_as_preserved', () => {
    // The `preserved` list is where an operator reads what survives a reset. It
    // named `storage/sites` as "the git-tracked authored source a re-seed comes
    // from" — a promise the reset cannot keep once there is nothing to re-seed
    // from. The two that ARE preserved stay named, because the point of the line
    // is that the operator can check the ones they care about are on it.
    const { preserved } = resetPlan({ repoRoot: REPO, measure: () => ({ present: false, files: 0, bytes: 0 }) })
    expect(preserved).not.toContain('storage/sites')
    expect(preserved).toContain('storage/chat')
    expect(preserved).toContain('storage/references')
  })
})

describe('REQ-290 — the transport the retired verb used is not retired with it', () => {
  it('test_UAT_FC_REQ-290_the_site_payload_module_stays_and_the_worker_still_imports_it', async () => {
    // `pushSite(store, slug, opts)` takes any `SiteStore` and cannot tell which
    // adapter it was handed — it was never about the file tier; the CLI verb was
    // merely what wired an fs-store over `storage/sites` into it. Deleting the
    // module would break the deployed Worker, which imports the payload
    // conversion to serve `/api/import`, and would delete the rights gate and
    // the Access credential handling REQ-289's copy pair is built on.
    const mod = await import('../tools/generate/src/cli/push')
    for (const name of ['pushSite', 'readSitePayload', 'readSiteDraft', 'payloadToWrite', 'postSitePayload']) {
      expect(typeof (mod as Record<string, unknown>)[name], name).toBe('function')
    }
    const router = readFileSync(path.join(REPO, 'apps', 'control-app', 'src', 'router.ts'), 'utf8')
    expect(router).toMatch(/from '\.\.\/\.\.\/\.\.\/tools\/generate\/src\/cli\/push'/)
  })
})
