import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, ctxOf } from '../tools/generate/src/cli/commands'
import { fsSiteStore } from '../tools/generate/src/store'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import * as hostCore from '../tools/generate/src/cli/ai/host-core'
import type { HostDeps } from '../tools/generate/src/cli/ai/host-core'
import { backendsDocument } from '../tools/generate/src/cli/ai/backends'
import { says, scriptedClient, type ScriptedClient } from './support/scripted-model-client'

/**
 * STORY-103 — **the model and the reply ceiling are the project's backend
 * configuration document** (AC-2467), on the operator's-machine (CLI) host. The
 * deployed (workerd) host is in
 * `test_reconciliation_assistant_backend_settings.workers.test.ts`.
 *
 * Observed at the model-client boundary: `ScriptedClient.seen[n]` is the request
 * `ClaudeAPIBackend` built, i.e. what would go on the wire. The expected values
 * are read from the shipped document, never restated.
 *
 * ONE DOUBLE: the Anthropic client. The "edit the document" property replaces
 * the document's bytes as the host imports them (`vi.doMock` on the JSON data
 * file) and loads a fresh host — no code is substituted, only the data the
 * project would edit.
 */

const DOC_PATH = '../tools/generate/src/cli/ai/backends.json'

let cwd: string
let ai: Record<string, unknown>

type Host = typeof hostCore

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

/** Open a NEW session on `slug` through `host` and take its first turn. */
async function firstTurn(host: Host, slug: string): Promise<ScriptedClient> {
  const client = scriptedClient([says('Noted.')])
  host.setModelClient(client)
  const opened = await host.openSession(slug, { cwd }, deps())
  expect(opened.ready).toBe(true)
  for await (const _event of host.streamPrompt(opened.sessionId, 'Hello', { cwd }, deps())) void _event
  expect(client.seen.length).toBeGreaterThanOrEqual(1)
  return client
}

beforeAll(async () => {
  cwd = mkdtempSync(path.join(tmpdir(), 'ac2467-backends-'))
  cmdNew('ac2467a', { cwd })
  cmdNew('ac2467b', { cwd })
  ai = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Record<string, unknown>
})

afterEach(() => {
  hostCore.resetAiHost()
  vi.doUnmock(DOC_PATH)
  vi.resetModules()
  ;(ai as { resetBackendConfig: () => void }).resetBackendConfig()
})

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe('AC-2467: model requests carry the backend document’s model and max_tokens (CLI host)', () => {
  it('test_UAT_AC2467_cli_host_requests_carry_the_documents_model_and_max_tokens_and_follow_an_edit', async () => {
    const declared = backendsDocument.claude
    const settings = ai as { backendSettings: (n: string) => { model: string; maxTokens: number } }

    // The library's own defaults are what is installed before the host runs, and
    // they are not the document's — so a request carrying the document's values
    // can only have got them from the document.
    const libraryDefault = settings.backendSettings('claude')
    expect(libraryDefault.maxTokens).not.toBe(declared.max_tokens)

    // ── From the first turn: the first request of a new session carries the
    //    document's values exactly, on every request of the turn.
    const shipped = await firstTurn(hostCore, 'ac2467a')
    for (const req of shipped.seen) {
      expect(req.model).toBe(declared.model)
      expect(req.max_tokens).toBe(declared.max_tokens)
    }

    // ── The document alone changes it: same code, edited document bytes.
    hostCore.resetAiHost()
    ;(ai as { resetBackendConfig: () => void }).resetBackendConfig()
    const edited = {
      ...backendsDocument,
      claude: { model: `${declared.model}-edited`, max_tokens: declared.max_tokens - 1000 },
    }
    vi.resetModules()
    vi.doMock(DOC_PATH, () => ({ default: edited }))
    const freshHost = (await import('../tools/generate/src/cli/ai/host-core')) as Host
    try {
      const after = await firstTurn(freshHost, 'ac2467b')
      for (const req of after.seen) {
        expect(req.model).toBe(edited.claude.model)
        expect(req.max_tokens).toBe(edited.claude.max_tokens)
      }
    } finally {
      freshHost.resetAiHost()
    }
  })
})
