import { afterEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { nodeDeps, resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host'
import { openSession, streamPrompt } from '../tools/generate/src/cli/ai/host-core'
import type { HostDeps } from '../tools/generate/src/cli/ai/host-core'
import {
  LIBRARY_DECLARATION,
  libraryInstanceConfig,
  type CatalogueItem,
  type LibraryDeps,
} from '../tools/generate/src/cli/ai/library-core'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { says, scriptedClient } from './support/scripted-model-client'

/**
 * **The assistant reads the client's Library as one catalogue** (story-a0b20525)
 * — AC-2585: where the catalogue tools exist, and how they are grouped.
 *
 * ENTRY POINT. A real consultant turn through the host's own `openSession` /
 * `streamPrompt`, built from the `1c` CLI's own `nodeDeps`, and the tool list
 * read off what the backend sent the model. The hosted half composes the same
 * host with the `library` dependency the control app hands it (a catalogue
 * backed by a ticket store); the catalogue itself is doubled because nothing
 * here is about what it holds, only about whether the surface is offered and
 * under which grant. The Worker's own route-level evidence that a hosted
 * conversation calls these tools against real D1 and R2 is
 * `test_reconciliation_library_catalogue.workers.test.ts`.
 *
 * ONE DOUBLE: the Anthropic client (the network).
 */

const LIBRARY_TOOLS = ['list_library', 'get_library_item', 'place_on_site']

const workspaces: string[] = []
const savedKey = process.env.ANTHROPIC_API_KEY

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  while (workspaces.length > 0) rmSync(workspaces.pop()!, { recursive: true, force: true })
  if (savedKey === undefined) delete process.env.ANTHROPIC_API_KEY
  else process.env.ANTHROPIC_API_KEY = savedKey
})

function workspace(slug: string): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'library-grant-'))
  workspaces.push(cwd)
  cmdNew(slug, { cwd })
  return cwd
}

/** A catalogue as a hosted deployment hands one to the host: one item, unplaced. */
function hostedCatalogue(slug: string): LibraryDeps {
  const row: CatalogueItem = {
    name: 'material-logo',
    where: 'library',
    mediaType: 'image/png',
    title: 'The logo',
    aliases: ['logo.png'],
    filename: 'logo.png',
    kind: 'image',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    edits: [],
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-11-09T00:00:00Z',
  }
  return {
    slug,
    list: async () => [row],
    read: async () => ({ ...row, description: 'A logo.' }),
    place: async () => ({ asset: 'logo.png', size: 1, placed_on: [slug], description: 'A logo.' }),
  }
}

/** One turn on a fresh session; the names of the tools the model was offered. */
async function offeredTools(cwd: string, slug: string, deps: HostDeps): Promise<string[]> {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? 'test-key-not-a-real-one'
  const client = scriptedClient([says('Right.')])
  setModelClient(client)
  const opened = await openSession(slug, { cwd }, deps)
  expect(opened.error).toBeUndefined()
  for await (const _event of streamPrompt(opened.sessionId, 'Hello.', { cwd }, deps)) {
    // drain the turn
  }
  expect(client.seen.length).toBeGreaterThan(0)
  return client.seen[0].tools.map((t) => t.name)
}

describe('AC-2585 — the catalogue tools, their groups, and where they are offered', () => {
  it('test_UAT_AC2585_hosted_consultant_offers_library_tools_in_read_and_place_groups_and_cli_offers_none', async () => {
    const slug = 'studio'
    const cwd = workspace(slug)
    const cli = await nodeDeps({ cwd })
    const base: HostDeps = { ...cli, junctions: cli.lib.memoryJunctions() }

    // ── the local `1c` CLI: no ticket store, so no catalogue ────────────────
    expect(cli.library ?? null).toBeNull()
    const cliTools = await offeredTools(cwd, slug, base)
    for (const tool of LIBRARY_TOOLS) expect(cliTools, tool).not.toContain(tool)
    // Its other site tools are unchanged.
    expect(cliTools).toContain('list_assets')

    resetAiHost()

    // ── the hosted conversation: a catalogue backed by the ticket store ─────
    const hostedTools = await offeredTools(cwd, slug, {
      ...base,
      library: (s: string) => hostedCatalogue(s),
    })
    for (const tool of LIBRARY_TOOLS) expect(hostedTools, tool).toContain(tool)
    expect(hostedTools).toContain('list_assets')

    // Two groups, each effect-homogeneous, exactly as the AC states.
    const groups = LIBRARY_DECLARATION.groups as {
      group: string
      effect: string
      operations: string[]
    }[]
    const byName = new Map(groups.map((g) => [g.group, g]))
    expect([...byName.keys()].sort()).toEqual(['PlaceOnSite', 'ReadLibrary'])
    expect(byName.get('ReadLibrary')!.effect).toBe('read')
    expect(byName.get('ReadLibrary')!.operations.sort()).toEqual(['get_library_item', 'list_library'])
    expect(byName.get('PlaceOnSite')!.effect).toBe('write')
    expect(byName.get('PlaceOnSite')!.operations).toEqual(['place_on_site'])
    const effectOf = new Map(
      (LIBRARY_DECLARATION.operations as { op: string; effect: string }[]).map((o) => [o.op, o.effect]),
    )
    expect(effectOf.get('list_library')).toBe('read')
    expect(effectOf.get('get_library_item')).toBe('read')
    expect(effectOf.get('place_on_site')).toBe('write')

    // Both groups are granted by the surface's own grant, and the repository's
    // instance grant file carries no entry for the surface.
    expect(libraryInstanceConfig()).toEqual({ library: { groups: ['ReadLibrary', 'PlaceOnSite'] } })
    const instances = (await import('../tools/generate/src/cli/ai/instances.json')).default as Record<
      string,
      Record<string, unknown>
    >
    for (const role of Object.values(instances)) expect(role).not.toHaveProperty('library')
  }, 60000)
})
