import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { resetAiHost, sessionsDir, setModelClient } from '../tools/generate/src/cli/ai/host'
import { CONSULTANT_PURPOSE } from '../tools/generate/src/cli/ai/host-core'
import {
  CONSULTANT_ROLE,
  CONSULTANT_SYSTEM,
  LEGACY_ROLE_NAMES,
} from '../tools/generate/src/cli/ai/roles'
import { L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import { repoRoot } from '../tools/generate/src/cli/webui'
import { cmdNew } from '../tools/generate/src/cli/commands'
import type { L1Node } from '@1stcontact/site-schema'
import { calls, says, scriptedClient } from './support/scripted-model-client'

/**
 * REQ-174 — **the assistant is a consultant, and the old sessions still open**.
 *
 * The rename is not cosmetic and this suite treats it as behaviour on two
 * counts. The role name is the first thing the model reads about itself, so it
 * is asserted where the model actually receives it — the `system` string of a
 * real request, through the real host, not by reading the constant back. And a
 * role name is DURABLE: it is written into the archived transcript's header and
 * into the live junction's `session_start` record, so a rename that did nothing
 * else would strand every conversation started before it.
 *
 * The same double as every other chat-host suite, for the same reason: the
 * Anthropic client is the network, and everything on this side of it — the
 * session manager, the role assembly, the tool loop, the `edit.ts` writes — is
 * the real thing.
 */

const SLUG = 'studio'
const HEADLINE = 'The old headline.'
const HEADLINE_PATH = '0.0'

function seedPage(cwd: string, slug: string): void {
  const homePath = path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
  const home = JSON.parse(readFileSync(homePath, 'utf8'))
  const root: L1Node = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }],
  }
  home.l1.root = root
  home.modules = []
  writeFileSync(homePath, JSON.stringify(home, null, 2))
}

function headline(cwd: string, slug: string): string {
  const home = JSON.parse(
    readFileSync(path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json'), 'utf8'),
  )
  return home.l1.root.children[0].text
}

interface StreamEvent {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

async function session(base: string, slug: string) {
  const res = await fetch(`${base}api/ai/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug }),
  })
  expect(res.status).toBe(200)
  return res.json() as Promise<{
    sessionId: string
    turns: { role: string; markdown: string }[]
    ready: boolean
    error?: string
  }>
}

async function sendTurn(base: string, sessionId: string, text: string): Promise<StreamEvent[]> {
  const res = await fetch(`${base}api/ai/prompt`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, text }),
  })
  expect(res.status).toBe(200)
  const body = await res.text()
  return body
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()) as StreamEvent)
}

async function turn(base: string, slug: string, text: string): Promise<StreamEvent[]> {
  const opened = await session(base, slug)
  expect(opened.ready).toBe(true)
  return sendTurn(base, opened.sessionId, text)
}

/** The archived transcript for a site, as the file archive writes it. */
function archivePath(cwd: string, slug: string): string {
  return path.join(sessionsDir({ cwd }), `site-${slug}.md`)
}

let cwd: string
let builder: BuilderHandle
let base: string

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'req174-'))
  cmdNew(SLUG, { cwd })
  seedPage(cwd, SLUG)
  builder = await startBuilder({ cwd })
  base = builder.url
}, 180000)

afterAll(async () => {
  await builder.close()
  rmSync(cwd, { recursive: true, force: true })
})

beforeEach(() => {
  seedPage(cwd, SLUG)
  rmSync(sessionsDir({ cwd }), { recursive: true, force: true })
  resetAiHost()
})

afterEach(() => {
  setModelClient(null)
})

// ── the role is a consultant ─────────────────────────────────────────────────

describe('REQ-174 — the assistant is told it is a consultant', () => {
  it('test_UAT_FC_REQ-174_the_preamble_the_model_receives_names_a_consultant_and_asks_for_a_view', async () => {
    const client = scriptedClient([says('Understood.')])
    setModelClient(client)

    await turn(base, SLUG, 'Say something')

    // THE STRING THE MODEL ACTUALLY GOT, assembled by the real host — not the
    // constant read back, which would prove only that a file says what it says.
    const system = client.seen[0].system
    expect(system).toContain('consultant')
    // The old word, taken from the compatibility list rather than spelled here:
    // this suite is the one place that would otherwise reintroduce it, and the
    // scan at the bottom of the file has to be able to say so.
    expect(system).not.toMatch(new RegExp(LEGACY_ROLE_NAMES[0], 'i'))

    // The rename is a change of REGISTER, and the register is what the ticket is
    // about: a consultant forms a view, says when the request would make the
    // site worse, and does not build past an open question.
    expect(system).toMatch(/judgement/i)
    expect(system).toMatch(/would make the site worse/i)
    expect(system).toMatch(/never build past an open question/i)

    // …while the constraint language the preamble already carried is untouched.
    // The closed vocabulary is what makes every change safe, and a posture
    // rewrite is not licence to soften it.
    expect(system).toContain('closed vocabulary')
    expect(system).toContain('you cannot\nwrite HTML, CSS or JavaScript')
  })

  it('test_UAT_FC_REQ-174_a_new_session_is_recorded_and_reported_under_the_new_name', async () => {
    setModelClient(scriptedClient([says('Noted.')]))
    await turn(base, SLUG, 'Remember this')

    // DURABLE. The archived transcript's header is what a later process reads a
    // session's role name back out of, and it is what the compatibility case
    // below rewrites.
    const archived = JSON.parse(
      readFileSync(archivePath(cwd, SLUG), 'utf8').split('<!-- xgd-session')[1].split('-->')[0],
    ) as { role: string }
    expect(archived.role).toBe(CONSULTANT_ROLE)
    expect(CONSULTANT_ROLE).toBe('consultant')

    // And what the panel is told at mount is the new name ALONE. The legacy
    // alias is a read path; it is not something the host claims to be.
    const status = (await fetch(`${base}api/ai/roles`).then((r) => r.json())) as {
      roles: string[]
    }
    expect(status.roles).toEqual([CONSULTANT_ROLE])
  })

  it('test_UAT_FC_REQ-174_the_grant_and_the_corpus_purpose_are_the_consultants', () => {
    // `instances.json` is keyed by role name, so the rename has to move the key
    // with it or every session fails to construct a Toolbox at all.
    expect(Object.keys(L1_INSTANCES)).toEqual([CONSULTANT_ROLE])

    // The role's purpose primes knowledge retrieval (step 2 of the landscape).
    // It said the role "looks after" a website, which is the custodial register
    // the rename exists to leave behind.
    expect(CONSULTANT_PURPOSE).not.toMatch(new RegExp(`${LEGACY_ROLE_NAMES[0]}|look after`, 'i'))
    expect(CONSULTANT_PURPOSE).toMatch(/advise/i)
  })
})

// ── sessions written before the rename still open ────────────────────────────

describe('REQ-174 — a conversation started under the old name still opens', () => {
  it('test_UAT_FC_REQ-174_a_session_stored_under_the_old_role_name_resumes_and_takes_another_turn', async () => {
    setModelClient(scriptedClient([says('Noted.')]))
    await turn(base, SLUG, 'Remember this')

    // AGE THE SESSION BACKWARDS. The archived header is rewritten to the name
    // this project used to write, which is exactly the state on disk for every
    // conversation that predates the rename. Nothing else about it changes.
    //
    // The archive is the only durable copy this host keeps — the junction is
    // per-manager and does not outlive the process — so it is the whole of what
    // a restart reads. The compatibility itself is not archive-specific: the
    // stored name is resolved by LOOKING IT UP in the manager's role map, so a
    // deployment whose junction does survive resolves it through the same entry.
    const archive = archivePath(cwd, SLUG)
    writeFileSync(
      archive,
      readFileSync(archive, 'utf8').replaceAll(
        `"role": "${CONSULTANT_ROLE}"`,
        `"role": "${LEGACY_ROLE_NAMES[0]}"`,
      ),
    )
    expect(readFileSync(archive, 'utf8')).toContain(LEGACY_ROLE_NAMES[0])

    // A fresh process: no live manager, so the session is resumed from the
    // records — which is where the stored role name is read and looked up.
    resetAiHost()
    setModelClient(
      scriptedClient([
        calls('set_l1', {
          page: 'home',
          path: HEADLINE_PATH,
          node: { kind: 'text', text: 'A new headline.', axes: { fontSizePx: 32 } },
        }),
        says('Changed it.'),
      ]),
    )

    const reopened = await session(base, SLUG)
    // READY, not "Unknown role" — and the conversation is the same one, with the
    // turns it already had.
    expect(reopened.error).toBeUndefined()
    expect(reopened.ready).toBe(true)
    expect(reopened.turns).toHaveLength(2)
    expect(reopened.turns[0].markdown).toContain('Remember this')

    // …and it is a working session, not merely one that opened: the next turn
    // reaches the tools and changes the site.
    await sendTurn(base, reopened.sessionId, 'Change the headline to "A new headline."')
    expect(headline(cwd, SLUG)).toBe('A new headline.')
  })
})

// ── the rename left nothing behind ───────────────────────────────────────────

describe('REQ-174 — the old word survives in exactly one place', () => {
  it('test_UAT_FC_REQ-174_no_source_file_carries_the_old_role_name', () => {
    // A rename rots when a straggler is left somewhere nobody greps — a comment,
    // a test helper, a JSON key. The compatibility alias is the ONE deliberate
    // survivor, and it is declared in `roles.ts` beside the reason it exists, so
    // this scan allows that file and no other.
    const root = repoRoot()
    // Build artefacts are excluded and so are the two stores: `kb/` and the
    // inlined copy under `generated/` are the SYSTEM KB, whose corpus is
    // exported from the ticket store and rebuilt by `1c kb build`, and
    // `storage/` holds conversations this rename deliberately does not migrate.
    const skip = new Set(['node_modules', 'dist', 'generated', 'storage', 'kb'])
    const allowed = path.join(root, 'tools', 'generate', 'src', 'cli', 'ai', 'roles.ts')
    const stale = new RegExp(LEGACY_ROLE_NAMES.join('|'), 'i')
    const offenders: string[] = []

    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) {
          // Dot-directories hold no source of ours and two of them hold copies
          // of it: `.wrangler` caches a bundled Worker, `.xgd` the ticket store
          // this rename is recorded in. Both are written by other processes
          // while this suite runs, so scanning them makes the check flaky as
          // well as wrong.
          if (skip.has(entry) || entry.startsWith('.')) continue
          walk(full)
          continue
        }
        if (!/\.(ts|tsx|js|mjs|json|md|html|css)$/.test(entry)) continue
        if (full === allowed) continue
        if (stale.test(readFileSync(full, 'utf8'))) offenders.push(path.relative(root, full))
      }
    }
    walk(root)

    expect(offenders).toEqual([])
  })
})
