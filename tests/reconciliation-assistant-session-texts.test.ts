import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { editCopySet } from '../tools/generate/src/cli/edit'
import {
  openSession,
  resetAiHost,
  sessionsDir,
  setModelClient,
  streamPrompt,
} from '../tools/generate/src/cli/ai/host'
import { aiCore, L1_DECLARATION, nodeOperations } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import {
  CONSULTANT_ROLE_TEXT,
  LEGACY_ROLE_NAMES,
  PRODUCT_SYSTEM,
  consultantReminder,
} from '../tools/generate/src/cli/ai/roles'
import { fsSiteStore } from '../tools/generate/src/store'
import type { L1Node } from '@1stcontact/site-schema'
import { fsOpts } from './support/site-factory'
import { modelSaw, says, scriptedClient, type ModelRequest } from './support/scripted-model-client'

/**
 * **The session's three texts** (story-a58a0974 — AC-2107, AC-2108, AC-2109,
 * and the command-line half of AC-2110).
 *
 * Through the real host on the operator's machine: the real session manager,
 * the real role assembly, the real priming and reminder channels, the real tool
 * loop. The Anthropic client is the one double, because it is the network — and
 * it is also the recorder, so every assertion about what a session is told reads
 * what the model was actually SENT rather than a constant read back.
 *
 * The former role name is never spelled here; it is read from the compatibility
 * list, so the straggler scan holds this file to the same rule as every other.
 */

const SLUG = 'studio'
const HEADLINE_PATH = '0.0'

let cwd: string

function homePath(): string {
  return path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json')
}

function seedPage(): void {
  const home = JSON.parse(readFileSync(homePath(), 'utf8'))
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: 'The old headline.', axes: { fontSizePx: 32 } }],
  } satisfies L1Node
  home.modules = []
  writeFileSync(homePath(), JSON.stringify(home, null, 2))
}

/** The system text of one request, flattened from string or blocks. */
function systemOf(req: ModelRequest): string {
  const s = req.system
  return typeof s === 'string' ? s : s.map((block) => block.text ?? '').join('\n')
}

/** Run one turn to completion, draining the stream so the turn has finished. */
async function turn(sessionId: string, text: string): Promise<unknown[]> {
  const drained: unknown[] = []
  for await (const event of streamPrompt(sessionId, text, { cwd })) drained.push(event)
  expect(drained.length).toBeGreaterThan(0)
  return drained
}

/** The consultant's toolbox on this host, built the way the host builds it. */
async function consultantBox() {
  const opts = { cwd }
  const store = fsSiteStore(ctxOf(opts))
  return createL1Toolbox(SLUG, opts, {
    session: `site-${SLUG}`,
    lib: await aiCore(),
    store,
    extraOps: nodeOperations(SLUG, { ...opts, store } as never),
  })
}

beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'story-a58a0974-texts-'))
  cmdNew(SLUG, { cwd })
  seedPage()
  rmSync(sessionsDir({ cwd }), { recursive: true, force: true })
  resetAiHost()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  rmSync(cwd, { recursive: true, force: true })
})

// ── AC-2107: product level, role level, reminder ─────────────────────────────

describe('the session is told three texts, each piece of material in exactly one', () => {
  it(
    'test_UAT_AC2107_system_prompt_opens_with_the_role_then_carries_the_product_text_which_names_no_role',
    async () => {
      const client = scriptedClient([says('Hello.')])
      setModelClient(client)
      const { sessionId } = await openSession(SLUG, { cwd })
      await turn(sessionId, 'hello')

      expect(client.seen.length).toBeGreaterThan(0)
      const system = systemOf(client.seen[0])

      // ROLE FIRST, PRODUCT VERBATIM AFTER IT — in what the model received.
      expect(system.trimStart().startsWith(CONSULTANT_ROLE_TEXT)).toBe(true)
      const productAt = system.indexOf(PRODUCT_SYSTEM)
      expect(productAt).toBeGreaterThan(system.indexOf(CONSULTANT_ROLE_TEXT))

      // THE PRODUCT TEXT IS ROLE-INDEPENDENT and carries the product facts.
      expect(PRODUCT_SYSTEM).toContain('only through your tools')
      expect(PRODUCT_SYSTEM).toContain('refused whole')
      expect(PRODUCT_SYSTEM).not.toMatch(/consultant/i)
      for (const retired of LEGACY_ROLE_NAMES) {
        expect(PRODUCT_SYSTEM).not.toMatch(new RegExp(retired, 'i'))
      }

      // NO SENTENCE OF THE PRODUCT TEXT IS RESTATED in the role text or reminder.
      const reminder = consultantReminder(SLUG)
      expect(modelSaw(client.seen[0])).toContain(reminder)
      const sentences = PRODUCT_SYSTEM.replace(/\s+/g, ' ')
        .split(/(?<=[.:])\s+/)
        .map((s) => s.replace(/^#+\s*[^.]*?(?=[A-Z])/, '').trim())
        .filter((s) => s.length > 30)
      expect(sentences.length).toBeGreaterThan(5)
      const roleFlat = CONSULTANT_ROLE_TEXT.replace(/\s+/g, ' ')
      for (const sentence of sentences) {
        expect(roleFlat, sentence).not.toContain(sentence)
        expect(reminder, sentence).not.toContain(sentence)
      }

      // THE METHOD IS IN THE CORPUS, referenced, and appears in none of the three.
      for (const text of [PRODUCT_SYSTEM, CONSULTANT_ROLE_TEXT, reminder]) {
        expect(text).not.toMatch(/stage \d/i)
      }
    },
    180000,
  )
})

// ── AC-2108: priming carries the summary manual ──────────────────────────────

describe('priming carries the grant-projected summary, with DescribeTools for the rest', () => {
  it(
    'test_UAT_AC2108_priming_is_the_summary_manual_of_the_grant_and_describe_tools_is_offered',
    async () => {
      const box = await consultantBox()
      const full = box.manual() as string
      const summary = box.manual({ level: 'summary' }) as string
      const offered = box.toolNames() as string[]

      // A FRACTION OF THE FULL REFERENCE, not a re-wrapping of it.
      expect(summary.length).toBeLessThan(full.length / 2)

      // KEEPS WHAT A MODEL CHOOSES WITH: every granted group, every granted op.
      const decl = L1_DECLARATION as unknown as {
        operations: Array<{ op: string; tool?: string }>
        groups: Array<{ group: string; title?: string; description?: string; operations: string[] }>
      }
      const toolOf = (op: string) => decl.operations.find((o) => o.op === op)?.tool ?? op
      const grantedGroups = decl.groups.filter((g) => g.operations.some((op) => offered.includes(toolOf(op))))
      expect(grantedGroups.length).toBeGreaterThan(0)
      for (const g of grantedGroups) expect(summary).toContain(g.title ?? g.group)
      const grantedSite = decl.operations.map((o) => o.tool ?? o.op).filter((t) => offered.includes(t))
      expect(grantedSite.length).toBeGreaterThan(0)
      for (const tool of grantedSite) expect(summary, tool).toContain(tool)

      // DROPS WHAT IT ONLY NEEDS TO CALL WITH.
      expect(full).toContain('(string, required)')
      expect(summary).not.toContain('(string, required)')
      expect(full).toContain('Fails with')
      expect(summary).not.toContain('Fails with')

      // NAMES NO OPERATION THE SESSION WAS NOT GRANTED.
      const ungranted = decl.operations.map((o) => o.tool ?? o.op).filter((t) => !offered.includes(t))
      expect(ungranted.length).toBeGreaterThan(0)
      for (const tool of ungranted) {
        expect(summary, tool).not.toMatch(new RegExp(`\\b${tool}\\b`))
      }

      // EVERY CAPABILITY GROUP CARRIES A DESCRIPTION.
      const silent = decl.groups.filter((g) => !g.description || g.description.trim() === '')
      expect(silent.map((g) => g.group)).toEqual([])

      // THE REAL HOST: priming is the summary, and DescribeTools is offered.
      const client = scriptedClient([says('Hello.')])
      setModelClient(client)
      const { sessionId } = await openSession(SLUG, { cwd })
      await turn(sessionId, 'hello')
      const req = client.seen[0]
      const system = systemOf(req)
      expect(system).toContain('describe_page')
      for (const g of grantedGroups) expect(system).toContain(g.title ?? g.group)
      expect(system).not.toContain('(string, required)')
      expect(system).not.toContain('Fails with')
      const tools = req.tools.map((t) => t.name)
      expect(tools).toContain('DescribeTools')
      for (const tool of ungranted) expect(tools).not.toContain(tool)
    },
    180000,
  )
})

// ── AC-2109: the reminder is a handful of lines ──────────────────────────────

describe('the per-turn reminder points to the method and carries only the per-turn signals', () => {
  it(
    'test_UAT_AC2109_reminder_is_short_points_to_doc33_and_carries_signals_only_when_present',
    async () => {
      const client = scriptedClient([says('Right.'), says('Noted.')])
      setModelClient(client)
      const { sessionId } = await openSession(SLUG, { cwd })

      // A QUIET TURN: the reminder the model received is the plain one.
      await turn(sessionId, 'hello')
      const quiet = consultantReminder(SLUG)
      const firstSaw = modelSaw(client.seen[0])
      expect(firstSaw).toContain(quiet)
      expect(quiet).toContain(`"${SLUG}"`)
      expect(quiet).toMatch(/acts on that site and no other/)
      expect(quiet).toContain('DOC-33')
      expect(quiet).toMatch(/differ in kind rather than refining one/)
      expect(quiet).not.toMatch(/stage \d/i)
      expect(quiet.length).toBeLessThan(600)
      expect(firstSaw).not.toMatch(/changed this site since your last turn/)

      // THE CLIENT CHANGES THE SITE between turns: the change line appears.
      await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'I rewrote this myself.' }, {
        ...fsOpts(cwd),
        actor: 'client',
      })
      await turn(sessionId, 'make the heading bigger')
      const secondSaw = modelSaw(client.seen[1])
      expect(secondSaw).toMatch(/changed this site since your last turn — 1 change\b/)
      const at = Number(/list_changes with since: (\d+)/.exec(secondSaw)![1])
      expect(secondSaw).toContain(consultantReminder(SLUG, { at, changes: 1 }))

      // A CORPUS DELTA rides last, after every other line.
      const DELTA = 'New in your client’s material since you were last told: "Winter menu".'
      const withBoth = consultantReminder(SLUG, { at: 3, changes: 2 }, DELTA)
      expect(withBoth).toMatch(/2 changes/)
      expect(withBoth.endsWith(DELTA)).toBe(true)
      expect(withBoth.indexOf(DELTA)).toBeGreaterThan(withBoth.indexOf('2 changes'))
      expect(consultantReminder(SLUG, undefined, null)).toBe(quiet)
    },
    180000,
  )
})

// ── AC-2110 (command-line half): no ticket store, no ledger ──────────────────

describe('where there is no ticket store the ledger surface is absent', () => {
  it(
    'test_UAT_AC2110_command_line_host_offers_no_ledger_operation_and_still_takes_a_turn',
    async () => {
      const client = scriptedClient([says('Hello from the command line.')])
      setModelClient(client)
      const { sessionId } = await openSession(SLUG, { cwd })
      const events = (await turn(sessionId, 'hello')) as { kind: string; content?: string }[]

      expect(client.seen.length).toBeGreaterThan(0)
      const tools = client.seen[0].tools.map((t) => t.name)
      expect(tools).not.toContain('record_decision')
      expect(tools).not.toContain('name_engagement')
      expect(tools.length).toBeGreaterThan(0)
      expect(events.at(-1)?.kind).toBe('done')
      expect(events.some((e) => e.kind === 'text' && (e.content ?? '').includes('command line'))).toBe(true)
    },
    180000,
  )
})
