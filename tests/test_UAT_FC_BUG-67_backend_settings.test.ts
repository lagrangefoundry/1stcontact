import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { fsSiteStore } from '../tools/generate/src/store'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  openSession,
  resetAiHost,
  setModelClient,
  streamPrompt,
  type HostDeps,
} from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument, configureProjectBackends } from '../tools/generate/src/cli/ai/backends'
import { says, scriptedClient, type ScriptedClient } from './support/scripted-model-client'

/**
 * BUG-67 — **the model and the reply ceiling are this project's decision**.
 *
 * WHAT BROKE. `build` constructed `ClaudeAPIBackend` naming neither, so both came
 * from the framework, and the framework's ceiling was 4096. Twelve consecutive
 * `set_l1` calls reached the tool executor with an empty input object: the cap is
 * enforced without the model's knowledge, so a reply is cut wherever it happens
 * to be, and in a tool call that is a broken JSON argument rather than a smaller
 * edit. The operator lost nine minutes to a turn that produced nothing and
 * apologised for a mistake it had not made.
 *
 * WHY A FRAMEWORK RELEASE WAS NOT THE FIX. It made the symptom rarer and left the
 * cause exactly where it was — a value this repository sends on every request and
 * had no way to name. lagrange-framework BUG-49 turned both settings into
 * configuration; these are the three properties of this project consuming it.
 *
 * THE DECISIVE ASSERTIONS ARE ON THE WIRE, for the reason BUG-39's double gives
 * at length: a test that reads the host's own objects passes on a shape the
 * request never carries. `ScriptedClient.seen[n]` is what `ClaudeAPIBackend`
 * built, so `max_tokens` there is the number that would have been sent to
 * Anthropic — the one field whose wrong value is this whole ticket.
 *
 * AND THEY ARE READ FROM THE DOCUMENT, not restated. A test that hardcodes 64000
 * beside a file that says 64000 asserts the two agree today; it does not assert
 * that editing the file is what changes the request, which is the property the
 * operator actually asked for. So `backends.json` is the expected value.
 */

const SLUG = 'bug67'

let cwd: string
let ai: Record<string, unknown>

/** The settings the project's own document declares — the expected values. */
const DECLARED = backendsDocument.claude

/** The host, wired as `host.ts` wires it, minus the corpus this suite has no use for. */
function deps(): HostDeps {
  const lib = ai as { NullArchive: new () => unknown; memoryJunctions: () => unknown }
  return {
    lib: ai as HostDeps['lib'],
    store: fsSiteStore(ctxOf({ cwd })),
    archive: new lib.NullArchive(),
    junctions: lib.memoryJunctions(),
    apiKey: 'test-key',
  } as HostDeps
}

/** Take one turn through the real host and hand back what the model was sent. */
async function turn(): Promise<ScriptedClient> {
  const client = scriptedClient([says('Noted.')])
  setModelClient(client)
  const opened = await openSession(SLUG, { cwd }, deps())
  expect(opened.ready).toBe(true)
  for await (const _event of streamPrompt(opened.sessionId, 'Hello', { cwd }, deps())) void _event
  return client
}

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug67-backends-'))
  cmdNew(SLUG, { cwd })
  ai = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Record<string, unknown>
})

afterEach(() => {
  resetAiHost()
  // Put the framework's shipped values back between cases, so nothing here
  // passes on configuration a previous case happened to leave installed.
  ;(ai as { resetBackendConfig: () => void }).resetBackendConfig()
})

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe('BUG-67: backend settings are project configuration', () => {
  it('sends the ceiling this project declares, not the framework default', async () => {
    const client = await turn()

    expect(client.seen[0].max_tokens).toBe(DECLARED.max_tokens)
    expect(client.seen[0].model).toBe(DECLARED.model)
  })

  it('sends a ceiling large enough for the write that failed', async () => {
    const client = await turn()

    // The literal that produced the bug, and the framework's shipped replacement.
    // Naming both is the point: neither is what goes on the wire, because this
    // repository names its own and a default is not a decision.
    expect(client.seen[0].max_tokens).not.toBe(4096)
    expect(client.seen[0].max_tokens).not.toBe(32000)
    expect(client.seen[0].max_tokens).toBe(64000)
  })

  it('installs the configuration during build, not before it', async () => {
    // The framework's values are in force at the moment the session opens —
    // `afterEach` reset them and nothing in this case configures anything. If
    // `build` did not install the document itself, the request would carry 32000.
    expect((ai as { backendSettings: (n: string) => { maxTokens: number } }).backendSettings('claude').maxTokens).toBe(
      32000,
    )

    const client = await turn()

    expect(client.seen[0].max_tokens).toBe(DECLARED.max_tokens)
  })

  it('installs this project’s own document without complaint', () => {
    const lib = ai as HostDeps['lib']

    configureProjectBackends(lib)

    const settings = (ai as { backendSettings: (n: string) => { model: string; maxTokens: number } })
      .backendSettings('claude')
    expect(settings).toEqual({ model: DECLARED.model, maxTokens: DECLARED.max_tokens })
  })

  it('rejects a malformed document at install, naming the offending key', () => {
    const install = (ai as { configureBackends: (d: unknown) => unknown }).configureBackends

    // Each of these would otherwise be discovered as a 400 on the first turn of a
    // session an operator had already started — or, for the unknown key, never
    // discovered at all: a setting written in good faith that silently does
    // nothing. They are start-up failures instead, and each message names what is
    // wrong so the answer is in the error rather than in a bisect.
    expect(() => install({ claude: { max_tokens: 0 } })).toThrow(/max_tokens/)
    expect(() => install({ claude: { max_tokens: 64000.5 } })).toThrow(/max_tokens/)
    expect(() => install({ claude: { model: '' } })).toThrow(/model/)
    expect(() => install({ claude: { ceiling: 64000 } })).toThrow(/ceiling/)
    expect(() => install({ gemini: { model: 'x' } })).toThrow(/gemini/)
  })

  it('declares the settings as a document a Worker can read', () => {
    // Item 11: `host-core.ts` is the half workerd loads, so the settings must
    // arrive by static import. `loadBackends` is the framework's Node file
    // reader and would put a filesystem in that import graph; naming either it
    // or `node:fs` here would also mean the CLI and the Worker could disagree
    // about what this project sends, which is the split REQ-146 exists to close.
    // Comments stripped first: this file ARGUES about `node:fs` and
    // `loadBackends` at length, and an assertion that cannot tell prose from an
    // import would be satisfied by deleting the explanation.
    const source = readFileSync(path.resolve('tools/generate/src/cli/ai/backends.ts'), 'utf8')
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    expect(code).toContain("import backendsDocument from './backends.json'")
    expect(code).not.toContain('node:fs')
    expect(code).not.toContain('loadBackends')
  })

  it('holds the values in the document, so an edit there is the whole change', () => {
    // The file is the configuration. If this ever reads from somewhere else, the
    // operator's edit stops being sufficient and the seam has quietly closed.
    const onDisk = JSON.parse(
      readFileSync(path.resolve('tools/generate/src/cli/ai/backends.json'), 'utf8'),
    ) as { claude: { model: string; max_tokens: number } }

    expect(onDisk.claude).toEqual(DECLARED)
  })
})
