import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { resetAiHost, sessionsDir, setModelClient } from '../tools/generate/src/cli/ai/host'
import { CONSULTANT_PURPOSE } from '../tools/generate/src/cli/ai/host-core'
import { CONSULTANT_ROLE, LEGACY_ROLE_NAMES } from '../tools/generate/src/cli/ai/roles'
import { L1_INSTANCES } from '../tools/generate/src/cli/ai/toolbox-core'
import { repoRoot } from '../tools/generate/src/cli/webui'
import { cmdNew } from '../tools/generate/src/cli/commands'
import type { L1Node } from '@1stcontact/site-schema'
import { calls, says, scriptedClient } from './support/scripted-model-client'

/**
 * **The assistant is a consultant** (story-a58a0974, REQ-174).
 *
 * Real HTTP against a real `startBuilder`: real session manager, real role
 * assembly, real tool loop, real `edit.ts` writes, real on-disk archive. The
 * Anthropic client is the one double, because it is the network.
 *
 * The former role name is never spelled in this file — it is read from the
 * compatibility list — so the straggler scan (AC-2057) can hold this file to the
 * same rule as every other.
 */

const SLUG = 'studio'
const HEADLINE = 'The old headline.'
const HEADLINE_PATH = '0.0'
const LEGACY = LEGACY_ROLE_NAMES[0]

function homePath(cwd: string, slug: string): string {
  return path.join(cwd, 'storage', 'sites', slug, 'draft', 'pages', 'home.json')
}

function seedPage(cwd: string, slug: string): void {
  const home = JSON.parse(readFileSync(homePath(cwd, slug), 'utf8'))
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }],
  } satisfies L1Node
  home.modules = []
  writeFileSync(homePath(cwd, slug), JSON.stringify(home, null, 2))
}

function headline(cwd: string, slug: string): string {
  return JSON.parse(readFileSync(homePath(cwd, slug), 'utf8')).l1.root.children[0].text
}

interface StreamEvent {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

interface OpenedSession {
  sessionId: string
  turns: { role: string; markdown: string }[]
  ready: boolean
  error?: string
}

function post(base: string, route: string, body: unknown): Promise<Response> {
  return fetch(`${base}api/ai/${route}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function open(base: string, slug: string): Promise<OpenedSession> {
  const res = await post(base, 'session', { slug })
  expect(res.status).toBe(200)
  return (await res.json()) as OpenedSession
}

async function turn(base: string, sessionId: string, text: string): Promise<StreamEvent[]> {
  const res = await post(base, 'prompt', { sessionId, text })
  expect(res.status).toBe(200)
  return (await res.text())
    .split('\n\n')
    .map((frame) => frame.trim())
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => JSON.parse(frame.slice(5).trim()) as StreamEvent)
}

async function speak(base: string, slug: string, text: string): Promise<StreamEvent[]> {
  const opened = await open(base, slug)
  expect(opened.ready, opened.error).toBe(true)
  return turn(base, opened.sessionId, text)
}

/** The file archive's copy of a site's conversation — the durable one on this host. */
function archivePath(cwd: string, slug: string): string {
  return path.join(sessionsDir({ cwd }), `site-${slug}.md`)
}

/** The JSON session header of a stored transcript. */
function archivedHeader(cwd: string, slug: string): { role: string } {
  const text = readFileSync(archivePath(cwd, slug), 'utf8')
  return JSON.parse(text.split('<!-- xgd-session')[1].split('-->')[0]) as { role: string }
}

async function roles(base: string): Promise<{ roles: string[]; ready: boolean; error?: string }> {
  const res = await fetch(`${base}api/ai/roles`)
  expect(res.status).toBe(200)
  return res.json() as Promise<{ roles: string[]; ready: boolean; error?: string }>
}

let cwd: string
let builder: BuilderHandle
let base: string

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-a58a0974-consultant-'))
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

describe('the assistant is told it is a consultant', () => {
  it('test_UAT_AC2054_preamble_the_model_receives_names_a_consultant_and_asks_for_a_view', async () => {
    const client = scriptedClient([says('Understood.')])
    setModelClient(client)

    await speak(base, SLUG, 'Say something')

    // The system text of the first REAL model request, assembled by the host —
    // not the constant read back.
    expect(client.seen.length).toBeGreaterThan(0)
    // `system` is a string or a list of `{type: 'text', text}` blocks; the
    // preamble is the joined text either way.
    const seen = client.seen[0].system
    const system =
      typeof seen === 'string' ? seen : seen.map((block) => block.text ?? '').join('\n\n')
    expect(system.length).toBeGreaterThan(0)

    expect(system).toContain('consultant')
    expect(system).not.toMatch(new RegExp(LEGACY, 'i'))

    // The advisory register: judgement, push back, settle open questions.
    expect(system).toMatch(/judgement/i)
    expect(system).toMatch(/would make the site worse/i)
    expect(system).toMatch(/never build past an open question/i)

    // The closed-vocabulary constraint survives unchanged. The preamble wraps
    // its lines, so whitespace is normalised before matching the sentence.
    const flat = system.replace(/\s+/g, ' ')
    expect(flat).toContain('closed vocabulary')
    expect(flat).toContain('you cannot write HTML, CSS or JavaScript')

    // The person the site belongs to is the client.
    expect(system).toMatch(/\bclient\b/)
  })

  it('test_UAT_AC2055_new_session_is_recorded_and_reported_under_the_consultant_name_alone', async () => {
    setModelClient(scriptedClient([says('Noted.')]))
    await speak(base, SLUG, 'Remember this')

    // Durable: the stored transcript's header names the consultant.
    expect(CONSULTANT_ROLE).toBe('consultant')
    expect(archivedHeader(cwd, SLUG).role).toBe('consultant')
    expect(readFileSync(archivePath(cwd, SLUG), 'utf8')).not.toMatch(new RegExp(LEGACY, 'i'))

    // The capability answer claims the new name and nothing else.
    expect((await roles(base)).roles).toEqual(['consultant'])

    // The grant is keyed by the consultant role alone.
    expect(Object.keys(L1_INSTANCES)).toEqual(['consultant'])

    // The corpus purpose advises; it is not custodial and does not name the old role.
    expect(CONSULTANT_PURPOSE).toMatch(/advise/i)
    expect(CONSULTANT_PURPOSE).not.toMatch(new RegExp(LEGACY, 'i'))
    expect(CONSULTANT_PURPOSE).not.toMatch(/look after/i)
  })
})

describe('a conversation stored under the former name still works', () => {
  it('test_UAT_AC2056_session_stored_under_the_legacy_role_resumes_and_takes_an_editing_turn', async () => {
    setModelClient(scriptedClient([says('Noted.')]))
    await speak(base, SLUG, 'Remember this')

    // Age the stored session: its header now records the former role name, the
    // state of every conversation begun before the rename.
    const archive = archivePath(cwd, SLUG)
    writeFileSync(
      archive,
      readFileSync(archive, 'utf8').replaceAll(`"role": "${CONSULTANT_ROLE}"`, `"role": "${LEGACY}"`),
    )
    expect(archivedHeader(cwd, SLUG).role).toBe(LEGACY)

    // Drop the in-process host: the next request must resume from storage.
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

    const reopened = await open(base, SLUG)
    expect(reopened.error).toBeUndefined()
    expect(reopened.ready).toBe(true)
    expect(reopened.turns).toHaveLength(2)
    expect(reopened.turns[0].markdown).toContain('Remember this')

    // A working session, not merely an opened one: the turn reaches the tools.
    await turn(base, reopened.sessionId, 'Change the headline to "A new headline."')
    expect(headline(cwd, SLUG)).toBe('A new headline.')

    // Accepted on read only: the host still reports the consultant alone, and no
    // stored conversation is filed under the former name.
    expect((await roles(base)).roles).toEqual(['consultant'])
    for (const file of readdirSync(sessionsDir({ cwd }))) {
      expect(file).not.toMatch(new RegExp(LEGACY, 'i'))
    }
  })
})

describe('the rename left nothing behind', () => {
  it('test_UAT_AC2057_no_working_tree_file_carries_the_legacy_role_word_except_the_alias', () => {
    const root = repoRoot()
    // Excluded: dependencies and build output, the system KB exports (`kb/`) and
    // their inlined copy (`generated/`), stored conversations (`storage/`), and
    // every dot-directory (the ticket store and runtime caches).
    const skip = new Set(['node_modules', 'dist', 'generated', 'storage', 'kb'])
    const alias = path.join(root, 'tools', 'generate', 'src', 'cli', 'ai', 'roles.ts')
    const stale = new RegExp(LEGACY_ROLE_NAMES.join('|'), 'i')
    const offenders: string[] = []
    let scanned = 0
    let aliasCarriesWord = false

    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) {
          if (skip.has(entry) || entry.startsWith('.')) continue
          walk(full)
          continue
        }
        if (!/\.(ts|tsx|js|mjs|json|md|html|css)$/.test(entry)) continue
        scanned++
        const matches = stale.test(readFileSync(full, 'utf8'))
        if (full === alias) {
          aliasCarriesWord = matches
          continue
        }
        if (matches) offenders.push(path.relative(root, full))
      }
    }
    walk(root)

    // Not vacuous: the walk read the tree, and the one permitted survivor really
    // is where the scan would have found the word.
    expect(scanned).toBeGreaterThan(50)
    expect(aliasCarriesWord).toBe(true)
    expect(offenders).toEqual([])
  })
})
