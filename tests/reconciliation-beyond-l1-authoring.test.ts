/**
 * story-b3de4571 — authoring everything a site carries that is NOT its element
 * tree: its settings, the components on its pages, each page's search metadata,
 * and images the assistant draws itself.
 *
 * One UAT per acceptance criterion (AC-1095 … AC-1109). Every test drives a real
 * boundary — the bound Toolbox the assistant is handed, or `1c`'s argv entry
 * point — and asserts on the draft on disk, the rendered bytes, or the surface's
 * own declaration. Nothing here mocks `edit.ts` or stubs the Toolbox.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdRender, run } from '../tools/generate/src/cli'
import {
  createL1Toolbox,
  L1_DECLARATION,
  L1_INSTANCES,
} from '../tools/generate/src/cli/ai/toolbox'
// By path rather than by package name: the workspace links live under each
// package, and a suite at the repo root resolves neither — as every other test
// at this level reaches source.
import { validateSvg, SVG_MAX_BYTES, SVG_MAX_ELEMENTS } from '../packages/site-schema/src/svg'

const SLUG = 'studio'

let cwd: string

const draftDir = (root = cwd): string => path.join(root, 'storage', 'sites', SLUG, 'draft')
const sitePath = (root = cwd): string => path.join(draftDir(root), 'site.json')
const pagePath = (page = 'home', root = cwd): string =>
  path.join(draftDir(root), 'pages', `${page}.json`)

const readSite = (root = cwd): Record<string, any> =>
  JSON.parse(readFileSync(sitePath(root), 'utf8'))
const readPage = (page = 'home', root = cwd): Record<string, any> =>
  JSON.parse(readFileSync(pagePath(page, root), 'utf8'))

/** A read's payload, with the provenance markers a consumer strips after reading them. */
const unwrap = (answer: string): string =>
  answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, '')

interface Box {
  run: (tool: string, input: Record<string, unknown>) => string
  toolNames: () => string[]
  manual: () => string
}

const caretaker = (root = cwd): Promise<Box> => createL1Toolbox(SLUG, { cwd: root })

const json = <T,>(box: Box, tool: string, input: Record<string, unknown> = {}): T =>
  JSON.parse(unwrap(box.run(tool, input))) as T

function fresh(prefix: string): string {
  const root = mkdtempSync(path.join(tmpdir(), prefix))
  cmdNew(SLUG, { cwd: root })
  return root
}

/**
 * Put a mounting seam on the starter page.
 *
 * A component mounts at a `slot` node and the scaffold has none, so this is what
 * a session does with `set_l1` before `add_component`. Seeded directly so the
 * component tests measure instantiation rather than re-measuring the L1 write
 * path that story-189fc1ac already owns.
 */
function seedSlot(name = 'signup-form', behavior = 'contact-form', root = cwd): void {
  const page = readPage('home', root)
  page.l1.root.children.push({ kind: 'slot', name, behavior })
  writeFileSync(pagePath('home', root), JSON.stringify(page, null, 2))
}

interface CliResult {
  ok: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string; path?: string; hint?: string }
  exitCode: number
}

/** Drive the real `1c` entry point — argv in, envelope and exit code out. */
async function cli(root: string, ...argv: string[]): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const out: string[] = []
  process.chdir(root)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run([...argv, '--json'])
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  return { ...(JSON.parse(out[out.length - 1]) as CliResult), exitCode }
}

/** A palette with families and steps — the shape a `string` parameter could never carry. */
const PALETTE = {
  surface: { value: '#f7f4ed', steps: { raised: '#fffdf8', sunken: '#ebe6da' } },
  ink: { value: '#101822' },
  primary: { value: '#2e86a3', steps: { deep: '#1d5f77', light: '#7fc3d6' } },
}

const FORM_CONFIG = {
  action: '/api/lead',
  fields: [
    {
      name: 'email',
      label: 'Email address',
      labelMode: 'placeholder',
      type: 'email',
      required: true,
    },
  ],
  submitLabel: 'Join the waitlist',
}

const MARK = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">',
  '<title>Wireframe mark</title>',
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
  '<stop offset="0" stop-color="#2e86a3"/><stop offset="1" stop-color="#7fc3d6"/>',
  '</linearGradient></defs>',
  '<rect x="4" y="4" width="40" height="40" rx="6" fill="url(#g)"/>',
  '<path d="M12 34 L24 14 L36 34 Z" fill="none" stroke="#f7f4ed" stroke-width="2"/>',
  '</svg>',
].join('')

// ── settings ─────────────────────────────────────────────────────────────────

describe('story-b3de4571 — a site’s settings are written as structured values', () => {
  beforeEach(() => {
    cwd = fresh('ac-settings-')
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1095_a_settings_group_is_written_whole_and_unnamed_siblings_survive', async () => {
    const box = await caretaker()

    // A whole palette — several families, each with steps — in ONE call.
    expect(box.run('set_config', { key: 'palette', settings: PALETTE })).not.toContain(
      'SCHEMA_INVALID',
    )
    expect(readSite().palette).toEqual(PALETTE)

    // Naming ONE family with ONE changed step must not delete its siblings, at
    // any depth. Under replace-at-key this call would drop `ink` and `surface`
    // and nothing would say so until someone looked at the site.
    box.run('set_config', {
      key: 'palette',
      settings: { primary: { steps: { deep: '#0f3f52' } } },
    })
    const palette = readSite().palette
    expect(palette.primary.steps.deep).toBe('#0f3f52')
    expect(palette.primary.steps.light).toBe(PALETTE.primary.steps.light)
    expect(palette.primary.value).toBe(PALETTE.primary.value)
    expect(palette.ink).toEqual(PALETTE.ink)
    expect(palette.surface).toEqual(PALETTE.surface)

    // A list REPLACES: there is no sane merge of two ordered lists, so the whole
    // set is sent and the whole set is what is stored.
    const entries = [
      { label: 'How it works', target: { kind: 'anchor', pageId: 'home', moduleId: 'how' } },
      { label: 'Home', target: { kind: 'page', pageId: 'home' } },
    ]
    box.run('set_config', { key: 'nav', settings: { pattern: 'in-page-anchors', entries } })
    box.run('set_config', { key: 'nav', settings: { entries: [entries[1]] } })
    expect(readSite().nav.entries).toEqual([entries[1]])
    // ...while the scalar sibling written alongside it is still merged.
    expect(readSite().nav.pattern).toBe('in-page-anchors')
  })

  it('test_UAT_AC1096_omitting_the_group_writes_top_level_and_a_scalar_is_refused', async () => {
    const box = await caretaker()
    const themeBefore = readSite().theme

    // No `key` at all: the object merges into the site's top-level settings
    // under the same rule, so a single scalar setting stays reachable without a
    // second operation.
    expect(
      box.run('set_config', { settings: { config: { tagline: 'Sites that keep themselves' } } }),
    ).not.toContain('SCHEMA_INVALID')
    const site = readSite()
    expect(site.config.tagline).toBe('Sites that keep themselves')
    // The pre-existing top-level settings are all still there.
    expect(site.config.businessName).toBeTruthy()
    expect(site.theme).toEqual(themeBefore)

    // A top-level write that is not an object of settings has no meaning —
    // there is no key for it to be the value of — so it is refused, saying an
    // object is what is required, and nothing is written.
    const before = readFileSync(sitePath(), 'utf8')
    const refused = box.run('set_config', { settings: 'in-page-anchors' as unknown as never })
    expect(refused).toMatch(/must be an object/i)
    expect(readFileSync(sitePath(), 'utf8')).toBe(before)
  })

  it('test_UAT_AC1097_a_settings_value_the_site_schema_rejects_leaves_the_site_unchanged', async () => {
    const box = await caretaker()
    box.run('set_config', { key: 'palette', settings: PALETTE })
    const before = readFileSync(sitePath(), 'utf8')

    // A palette family whose step is not the declared form. Widening the
    // parameter to carry an object must not widen what the site accepts: the
    // shared validator still runs over the whole resulting definition.
    const refused = box.run('set_config', {
      key: 'palette',
      settings: { accent: { value: 'cornflower', steps: { deep: 12 } } },
    })
    expect(refused).toContain('SCHEMA_INVALID')

    // No part of the write lands — not even the keys that were individually fine.
    expect(readFileSync(sitePath(), 'utf8')).toBe(before)
    const group = json<{ value: Record<string, unknown> }>(box, 'get_config', { key: 'palette' })
    expect(group.value).toEqual(PALETTE)
    expect(Object.keys(group.value)).not.toContain('accent')
  })
})

// ── components ───────────────────────────────────────────────────────────────

describe('story-b3de4571 — components are instantiated from a closed catalog', () => {
  beforeEach(() => {
    cwd = fresh('ac-component-')
    seedSlot()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1098_the_catalog_is_listable_and_closed', async () => {
    const box = await caretaker()
    const { behaviors } = json<{ behaviors: any[] }>(box, 'list_behaviors')
    expect(behaviors.length).toBeGreaterThan(0)

    const form = behaviors.find((b) => b.type === 'contact-form')
    expect(form).toBeDefined()
    // Everything a caller needs to get the first call right: the kind and its
    // version, which settings are required and what each accepts (including the
    // item shape of a list), the seams it mounts at, the controls it may bind,
    // and whether it arrives with a look of its own.
    expect(typeof form.version).toBe('number')
    expect(form.config.action.required).toBe(true)
    expect(form.config.fields.required).toBe(true)
    expect(form.config.fields.items.type.values).toContain('email')
    expect(Object.keys(form.slots)).toContain('form')
    expect(Object.keys(form.controls)).toContain('field')
    expect(form.hasDefaultPresentation).toBe(true)

    // Closed: a kind that is not in the set is NOT_FOUND, and the refusal names
    // what the catalog does hold and says a new kind is a developer's work.
    const refused = box.run('add_component', {
      page: 'home',
      name: 'checkout',
      behavior: 'payments',
      slot: 'signup-form',
      config: {},
    })
    expect(refused).toContain('NOT_FOUND')

    // The refusal NAMES what the catalog does hold and says a new kind is a
    // developer's work. Asserted at the command line, because the Toolbox
    // replaces a refusal's text with per-code coaching for the model, and the
    // written surface of the error is the CLI's `{ok:false,error}` envelope.
    const fromCli = await cli(
      cwd,
      'module',
      'add',
      SLUG,
      'home',
      'checkout',
      'payments',
      '--slot',
      'signup-form',
      '--config',
      '{}',
    )
    expect(fromCli.ok).toBe(false)
    expect(fromCli.error!.code).toBe('NOT_FOUND')
    for (const known of behaviors.map((b) => b.type)) {
      expect(`${fromCli.error!.message}${fromCli.error!.hint}`).toContain(known)
    }
    expect(fromCli.error!.hint).toMatch(/developer/i)
  })

  it('test_UAT_AC1099_a_component_is_added_with_configuration_alone_and_arrives_rendering', async () => {
    const box = await caretaker()

    // Configuration only — no presentation. The vetted default look is laid out
    // from this instance's own config, so a form asked for with these fields
    // arrives with a control per field.
    const twoFields = {
      ...FORM_CONFIG,
      fields: [
        FORM_CONFIG.fields[0],
        { name: 'message', label: 'What do you need?', type: 'textarea', required: false },
      ],
    }
    expect(
      box.run('add_component', {
        page: 'home',
        name: 'signup',
        behavior: 'contact-form',
        slot: 'signup-form',
        config: twoFields,
      }),
    ).not.toContain('SCHEMA_INVALID')

    const instance = readPage().modules[0]
    expect(instance).toMatchObject({ id: 'signup', type: 'contact-form', slot: 'signup-form' })
    const presentation = JSON.stringify(instance.slots.form)
    expect(presentation).toContain('"control":"email"')
    expect(presentation).toContain('"control":"message"')

    // What arrives is ORDINARY page content: the element-tree read operation
    // reaches into it like anything else.
    const map = json<{ segments: { path: string; module?: string }[] }>(box, 'describe_page', {
      page: 'home',
    })
    const inside = map.segments.find((s) => s.module === 'signup')
    expect(inside).toBeDefined()
    const node = json<{ node: { kind: string } }>(box, 'get_l1', {
      page: 'home',
      path: inside!.path,
      module: 'signup',
      slot: 'form',
    }).node
    expect(typeof node.kind).toBe('string')

    // And it is a WORKING component, not a validated record: the module is the
    // sole `<form>` sink, so a rendered form means the instance mounted.
    const { outDir } = await cmdRender(SLUG, { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toMatch(/<form[^>]+action="\/api\/lead"/)
    expect(html).toMatch(/type="email"/)
    expect(html).toContain('<textarea')

    // A kind with no default look, added with no presentation, is refused with
    // the seams it needs named — not left to fail later at render.
    seedSlot('gallery', 'carousel')
    const noLook = box.run('add_component', {
      page: 'home',
      name: 'gallery',
      behavior: 'carousel',
      slot: 'gallery',
      config: {},
    })
    expect(noLook).toContain('SCHEMA_INVALID')
    expect(readPage().modules.map((m: any) => m.id)).toEqual(['signup'])
    // ...and the refusal LISTS the seams it needs, at the boundary that carries
    // a refusal's own text.
    const listed = await cli(cwd, 'module', 'add', SLUG, 'home', 'gallery', 'carousel', '--config', '{}')
    expect(listed.ok).toBe(false)
    expect(listed.error!.code).toBe('SCHEMA_INVALID')
    expect(listed.error!.message).toContain('slide')
    expect(listed.error!.message).toMatch(/no default presentation/i)
  }, 120000)

  it('test_UAT_AC1100_a_configuration_violating_the_kind_contract_is_refused_at_the_field', async () => {
    const box = await caretaker()
    const before = readFileSync(pagePath(), 'utf8')

    // `action` is declared required by contact-form's OWN contract. A form with
    // nowhere to send its enquiries must be refused at the field, not discovered
    // at render — so this check runs ahead of the site's definition validator.
    const refused = box.run('add_component', {
      page: 'home',
      name: 'signup',
      behavior: 'contact-form',
      slot: 'signup-form',
      config: { fields: FORM_CONFIG.fields },
    })
    expect(refused).toContain('SCHEMA_INVALID')

    // The refusal NAMES the offending field and the reason, and points at where
    // to read the kind's contract — the CLI envelope is where a refusal's own
    // text survives.
    const fromCli = await cli(
      cwd,
      'module',
      'add',
      SLUG,
      'home',
      'signup',
      'contact-form',
      '--slot',
      'signup-form',
      '--config',
      JSON.stringify({ fields: FORM_CONFIG.fields }),
    )
    expect(fromCli.ok).toBe(false)
    expect(fromCli.error!.code).toBe('SCHEMA_INVALID')
    expect(fromCli.error!.message).toContain('action')
    expect(fromCli.error!.message).toMatch(/required/i)
    expect(fromCli.error!.hint).toContain('behavior list')

    // The page is unchanged, and no instance of that name exists on it.
    expect(readFileSync(pagePath(), 'utf8')).toBe(before)
    const map = json<{ components: { id: string }[] }>(box, 'describe_page', { page: 'home' })
    expect(map.components.find((c) => c.id === 'signup')).toBeUndefined()
  })

  it('test_UAT_AC1101_reconfiguring_merges_and_removing_leaves_the_seam_in_place', async () => {
    const box = await caretaker()
    box.run('add_component', {
      page: 'home',
      name: 'signup',
      behavior: 'contact-form',
      slot: 'signup-form',
      config: FORM_CONFIG,
    })

    // Merged, like a settings group: changing the button's words must not lose
    // the endpoint the form posts to.
    expect(
      box.run('configure_component', {
        page: 'home',
        name: 'signup',
        config: { submitLabel: 'Get early access' },
      }),
    ).not.toContain('SCHEMA_INVALID')
    const config = readPage().modules[0].config
    expect(config.submitLabel).toBe('Get early access')
    expect(config.action).toBe('/api/lead')
    expect(config.fields).toEqual(FORM_CONFIG.fields)

    // The merged result is re-checked against the contract before it is stored.
    const badMerge = box.run('configure_component', {
      page: 'home',
      name: 'signup',
      config: { fields: [{ name: 'phone', label: 'Phone', type: 'carrier-pigeon' }] },
    })
    expect(badMerge).toContain('SCHEMA_INVALID')
    expect(readPage().modules[0].config.fields).toEqual(FORM_CONFIG.fields)

    // Removing takes only the instance off; the seam survives its occupant so
    // another component can be mounted there.
    box.run('remove_component', { page: 'home', name: 'signup' })
    expect(readPage().modules).toEqual([])
    expect(JSON.stringify(readPage().l1.root)).toContain('"name":"signup-form"')

    // A name that is not on the page is NOT_FOUND for either operation.
    expect(box.run('configure_component', { page: 'home', name: 'ghost', config: {} })).toContain(
      'NOT_FOUND',
    )
    expect(box.run('remove_component', { page: 'home', name: 'ghost' })).toContain('NOT_FOUND')
  })

  it('test_UAT_AC1102_describing_a_page_reports_its_components_and_their_configuration', async () => {
    const box = await caretaker()

    // A page with nothing on it still reports the list — present and empty, so a
    // caller can tell "none" from "not supported".
    const empty = json<{ components: unknown[] }>(box, 'describe_page', { page: 'home' })
    expect(empty.components).toEqual([])

    box.run('add_component', {
      page: 'home',
      name: 'signup',
      behavior: 'contact-form',
      slot: 'signup-form',
      config: FORM_CONFIG,
    })

    const map = json<{
      components: {
        id: string
        type: string
        version: number
        slot: string | null
        config: Record<string, unknown>
      }[]
      segments: unknown[]
    }>(box, 'describe_page', { page: 'home' })

    expect(map.components).toHaveLength(1)
    const [entry] = map.components
    expect(entry.id).toBe('signup')
    expect(entry.type).toBe('contact-form')
    expect(typeof entry.version).toBe('number')
    expect(entry.slot).toBe('signup-form')
    expect(entry.config).toMatchObject({ action: '/api/lead', submitLabel: 'Join the waitlist' })
    // Alongside the page's element map, not instead of it.
    expect(Array.isArray(map.segments)).toBe(true)
    expect(map.segments.length).toBeGreaterThan(0)
  })
})

// ── page metadata ────────────────────────────────────────────────────────────

describe('story-b3de4571 — a page describes itself to a search engine', () => {
  beforeEach(() => {
    cwd = fresh('ac-seo-')
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1103_search_metadata_is_written_merged_and_reaches_the_rendered_document', async () => {
    const box = await caretaker()

    // Written on creation.
    box.run('add_page', {
      page: 'about',
      title: 'About',
      seo: { title: 'About XGD', description: 'Who builds it and why.' },
    })
    expect(readPage('about').seoMeta).toEqual({
      title: 'About XGD',
      description: 'Who builds it and why.',
    })

    // Merged on update: improving a description must not clear the title.
    box.run('update_page', { page: 'about', seo: { description: 'The people behind XGD.' } })
    expect(readPage('about').seoMeta).toEqual({
      title: 'About XGD',
      description: 'The people behind XGD.',
    })

    // An update naming nothing is refused, saying what may be passed.
    const refused = box.run('update_page', { page: 'about' })
    expect(refused).toContain('SCHEMA_INVALID')
    const fromCli = await cli(cwd, 'page', 'update', SLUG, 'about')
    expect(fromCli.ok).toBe(false)
    expect(fromCli.error!.code).toBe('SCHEMA_INVALID')
    expect(fromCli.error!.message).toContain('--title')
    expect(fromCli.error!.message).toContain('--seo')
    // ...and the metadata it already had is untouched by the refusal.
    expect(readPage('about').seoMeta.title).toBe('About XGD')

    // And it reaches the rendered document — the reason it is worth a parameter.
    box.run('update_page', {
      page: 'home',
      seo: { title: 'XGD — AI writes it.', description: 'A living spec of intended behaviour.' },
    })
    const { outDir } = await cmdRender(SLUG, { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(html).toContain('<title>XGD — AI writes it.</title>')
    expect(html).toMatch(/name="description"[^>]*content="A living spec of intended behaviour\."/)
  }, 120000)
})

// ── generated images ─────────────────────────────────────────────────────────

/**
 * Every shape the validator exists to refuse. Each is legal SVG a browser would
 * honour, and each is a stored-XSS or exfiltration vector once the bytes are
 * composed by a model rather than placed by a person — served same-origin from
 * the site's own `/assets/`, where the renderer's URL-scheme allowlist neither
 * applies nor helps.
 */
const HOSTILE: Array<[string, string]> = [
  ['a script element', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
  ['an event handler on the root', '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>'],
  [
    'an event handler on a shape',
    '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1" onclick="alert(1)"/></svg>',
  ],
  [
    'an embedded document',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><p>hi</p></foreignObject></svg>',
  ],
  [
    'an external reference',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x.png"/></svg>',
  ],
  [
    'a non-local use reference',
    '<svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="https://evil.example/x#y"/></svg>',
  ],
  ['a stylesheet', '<svg xmlns="http://www.w3.org/2000/svg"><style>*{x:y}</style></svg>'],
  [
    'a style attribute',
    '<svg xmlns="http://www.w3.org/2000/svg"><rect style="background:url(https://evil.example/x)"/></svg>',
  ],
  [
    'an external paint reference',
    '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(https://evil.example/x#g)"/></svg>',
  ],
  [
    'an entity declaration',
    '<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"><title>&x;</title></svg>',
  ],
  [
    'a character entity beyond the five',
    '<svg xmlns="http://www.w3.org/2000/svg"><title>&#x3c;script&#x3e;</title></svg>',
  ],
  ['a link', '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><rect/></a></svg>'],
]

/** Constructs the grammar does not name at all — the closure, not the allowlist. */
const UNRECOGNISED: Array<[string, string]> = [
  ['an unquoted attribute', '<svg xmlns="http://www.w3.org/2000/svg"><rect width=10/></svg>'],
  [
    'a character-data section',
    '<svg xmlns="http://www.w3.org/2000/svg"><title><![CDATA[<script>alert(1)</script>]]></title></svg>',
  ],
  ['a malformed tag', '<svg xmlns="http://www.w3.org/2000/svg"><rect x="1" </svg>'],
  ['a root that is not a drawing root', '<html><body>hi</body></html>'],
]

describe('story-b3de4571 — a drawing the assistant composed', () => {
  beforeEach(() => {
    cwd = fresh('ac-image-')
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1104_a_drawing_becomes_an_ordinary_site_image_and_ships_unaltered', async () => {
    const box = await caretaker()

    const written = json<{ asset: { id: string; src: string; alt: string } }>(box, 'write_image', {
      name: 'wordmark',
      svg: MARK,
      alt: 'The XGD wireframe mark',
    })
    expect(written.asset.id).toBe('wordmark.svg')
    // The handle handed back is the one an L1 image node takes, so the caller
    // uses the answer directly rather than composing a path.
    expect(written.asset.src).toBe('/assets/wordmark.svg')
    expect(written.asset.alt).toBe('The XGD wireframe mark')
    expect(readFileSync(path.join(draftDir(), 'assets', 'wordmark.svg'), 'utf8')).toBe(MARK)

    // The listing every image picker reads reports it as an image.
    const listed = json<{ assets: { src: string; kind: string }[] }>(box, 'list_assets')
    expect(listed.assets.find((a) => a.src === '/assets/wordmark.svg')?.kind).toBe('image')

    // Referenced from a picture element through the ordinary L1 write path...
    const root = json<{ node: any }>(box, 'get_l1', { page: 'home', path: '0' }).node
    box.run('set_l1', {
      page: 'home',
      path: '0',
      node: {
        ...root,
        children: [{ kind: 'image', src: '/assets/wordmark.svg', alt: 'The XGD wireframe mark' }],
      },
    })

    // ...emitted document-relative, as every asset reference is, and the bytes
    // ship into the output unchanged: a drawing is an asset, not a special case.
    const { outDir } = await cmdRender(SLUG, { cwd })
    expect(readFileSync(path.join(outDir, 'index.html'), 'utf8')).toMatch(
      /<img[^>]+src="assets\/wordmark\.svg"/,
    )
    expect(readFileSync(path.join(outDir, 'assets', 'wordmark.svg'), 'utf8')).toBe(MARK)
  }, 120000)

  it('test_UAT_AC1105_a_drawing_carrying_anything_executable_is_refused_whole', async () => {
    const box = await caretaker()
    const assetsDir = path.join(draftDir(), 'assets')
    const before = readFileSync(sitePath(), 'utf8')

    for (const [what, hostile] of HOSTILE) {
      const answer = box.run('write_image', { name: 'attack', svg: hostile, alt: what })
      expect(answer, what).toContain('SCHEMA_INVALID')
      // The refusal identifies the rule that was broken rather than saying only
      // "invalid" — and it is never a rewrite: nothing is stripped to make the
      // drawing acceptable.
      expect(answer, what).toMatch(/refused/i)
    }

    // Refusal is WHOLE: no file created, no registry change, byte-identical.
    expect(existsSync(assetsDir) ? readdirSync(assetsDir) : []).toEqual([])
    expect(readFileSync(sitePath(), 'utf8')).toBe(before)
  })

  it('test_UAT_AC1106_the_grammar_refuses_what_it_does_not_name_and_bounds_size_and_count', () => {
    // A well-formed drawing validates.
    expect(validateSvg(MARK).ok).toBe(true)

    // THE CLOSURE: a construct the grammar does not recognise is refused rather
    // than skipped, so something nobody anticipated fails closed. Tested at the
    // validator, because that is where the closure lives and a sample of
    // payloads cannot demonstrate it.
    for (const [what, source] of UNRECOGNISED) {
      expect(validateSvg(source).ok, what).toBe(false)
    }

    // Bounded, like L1's own envelope: a document that renders is not the same
    // as a document that renders quickly.
    const overElements = `<svg xmlns="http://www.w3.org/2000/svg">${'<rect x="0"/>'.repeat(
      SVG_MAX_ELEMENTS + 1,
    )}</svg>`
    expect(validateSvg(overElements).ok).toBe(false)
    const overBytes = `<svg xmlns="http://www.w3.org/2000/svg">${'x'.repeat(SVG_MAX_BYTES)}</svg>`
    expect(validateSvg(overBytes).ok).toBe(false)

    // A detailed drawing sits comfortably inside both caps, so being large is
    // not itself a refusal.
    const detailed = `<svg xmlns="http://www.w3.org/2000/svg">${'<rect x="1"/>'.repeat(1500)}</svg>`
    expect(validateSvg(detailed).ok).toBe(true)
  })

  it('test_UAT_AC1107_the_filename_is_generated_and_an_existing_name_is_a_conflict', async () => {
    const box = await caretaker()

    // There is no path to traverse because no path is accepted — a name is one
    // plain lowercase word of letters, digits and hyphens.
    const BAD_NAMES = ['../../etc/passwd', 'a/b', 'mark.png', '.hidden', 'Mark Two']
    for (const name of BAD_NAMES) {
      expect(box.run('write_image', { name, svg: MARK }), name).toContain('SCHEMA_INVALID')
      // The refusal shows an ACCEPTABLE name rather than restating the rule —
      // read at the command line, where a refusal's own text survives.
      const fromCli = await cli(cwd, 'asset', 'write', SLUG, name, '--content', MARK)
      expect(fromCli.ok, name).toBe(false)
      expect(fromCli.error!.code, name).toBe('SCHEMA_INVALID')
      expect(fromCli.error!.hint, name).toContain('wordmark')
    }
    // Not one of them left a byte behind.
    const assetsDir = path.join(draftDir(), 'assets')
    expect(existsSync(assetsDir) ? readdirSync(assetsDir) : []).toEqual([])

    // The stored filename is derived from the plain name under the one format.
    const written = json<{ asset: { id: string } }>(box, 'write_image', {
      name: 'wordmark',
      svg: MARK,
    })
    expect(written.asset.id).toBe('wordmark.svg')

    // A name already in use is a conflict, never a silent overwrite.
    expect(box.run('write_image', { name: 'wordmark', svg: MARK })).toContain('CONFLICT')
    expect(readFileSync(path.join(draftDir(), 'assets', 'wordmark.svg'), 'utf8')).toBe(MARK)

    // Replacing is a deliberate act, and then the stored bytes are the new ones.
    const redrawn = MARK.replace('#2e86a3', '#1d5f77')
    expect(box.run('write_image', { name: 'wordmark', svg: redrawn, replace: true })).not.toContain(
      'CONFLICT',
    )
    expect(readFileSync(path.join(draftDir(), 'assets', 'wordmark.svg'), 'utf8')).toBe(redrawn)
  })

  it('test_UAT_AC1108_drawing_is_its_own_grantable_capability_apart_from_managing_supplied_files', async () => {
    const groups = L1_DECLARATION.groups as { group: string; operations: string[] }[]

    // Declared in DIFFERENT groups: every other image in a site was chosen by a
    // person, and this is the one that was not.
    const drawing = groups.find((g) => g.operations.includes('write_image'))
    const supplied = groups.find((g) => g.operations.includes('add_asset'))
    expect(drawing).toBeDefined()
    expect(supplied).toBeDefined()
    expect(drawing!.group).not.toBe(supplied!.group)
    expect(supplied!.operations).toEqual(expect.arrayContaining(['add_asset', 'remove_asset']))
    expect(drawing!.operations).not.toContain('add_asset')
    expect(drawing!.operations).not.toContain('remove_asset')

    // The grant is what makes the separation real: the assistant holds the
    // drawing group and not the supplied-file one.
    const granted = (L1_INSTANCES.caretaker as { l1: { groups: string[] } }).l1.groups
    expect(granted).toContain(drawing!.group)
    expect(granted).not.toContain(supplied!.group)

    // ...and that is what the assistant is actually offered: drawing is present
    // and performs a write; managing supplied files is absent from the set.
    const box = await caretaker()
    const tools = box.toolNames()
    expect(tools).toContain('write_image')
    expect(tools).not.toContain('add_asset')
    expect(tools).not.toContain('remove_asset')

    box.run('write_image', { name: 'wordmark', svg: MARK, alt: 'mark' })
    expect(readFileSync(path.join(draftDir(), 'assets', 'wordmark.svg'), 'utf8')).toBe(MARK)
  })
})

// ── the command line ─────────────────────────────────────────────────────────

describe('story-b3de4571 — the same four capabilities from the command line', () => {
  let viaCli: string
  let viaSurface: string

  beforeEach(() => {
    viaCli = fresh('ac-cli-')
    viaSurface = fresh('ac-surface-')
    seedSlot('signup-form', 'contact-form', viaCli)
    seedSlot('signup-form', 'contact-form', viaSurface)
  })
  afterEach(() => {
    rmSync(viaCli, { recursive: true, force: true })
    rmSync(viaSurface, { recursive: true, force: true })
  })

  it('test_UAT_AC1109_every_capability_is_reachable_from_the_command_line', async () => {
    // ── the command line ────────────────────────────────────────────────────
    const catalog = await cli(viaCli, 'behavior', 'list')
    expect(catalog.ok).toBe(true)
    expect((catalog.data!.behaviors as { type: string }[]).map((b) => b.type)).toContain(
      'contact-form',
    )

    expect(
      (
        await cli(
          viaCli,
          'module',
          'add',
          SLUG,
          'home',
          'signup',
          'contact-form',
          '--slot',
          'signup-form',
          '--config',
          JSON.stringify(FORM_CONFIG),
        )
      ).ok,
    ).toBe(true)

    const drawn = await cli(
      viaCli,
      'asset',
      'write',
      SLUG,
      'wordmark',
      '--content',
      MARK,
      '--alt',
      'The XGD wireframe mark',
    )
    expect(drawn.ok).toBe(true)
    expect((drawn.data!.asset as { src: string }).src).toBe('/assets/wordmark.svg')

    expect(
      (
        await cli(
          viaCli,
          'page',
          'add',
          SLUG,
          'about',
          '--title',
          'About',
          '--seo',
          JSON.stringify({ title: 'About XGD', description: 'Who builds it and why.' }),
        )
      ).ok,
    ).toBe(true)
    expect(
      (
        await cli(
          viaCli,
          'page',
          'update',
          SLUG,
          'about',
          '--seo',
          JSON.stringify({ description: 'The people behind XGD.' }),
        )
      ).ok,
    ).toBe(true)

    // The one boundary where a setting genuinely arrives as a string: argv is
    // text, so the value is read as structured data here and nowhere else.
    expect((await cli(viaCli, 'config', 'set', SLUG, 'palette', JSON.stringify(PALETTE))).ok).toBe(
      true,
    )
    expect(
      (
        await cli(
          viaCli,
          'config',
          'set',
          SLUG,
          'palette',
          JSON.stringify({ primary: { steps: { deep: '#0f3f52' } } }),
        )
      ).ok,
    ).toBe(true)

    // ── the equivalent surface calls ────────────────────────────────────────
    const box = await caretaker(viaSurface)
    box.run('add_component', {
      page: 'home',
      name: 'signup',
      behavior: 'contact-form',
      slot: 'signup-form',
      config: FORM_CONFIG,
    })
    box.run('write_image', { name: 'wordmark', svg: MARK, alt: 'The XGD wireframe mark' })
    box.run('add_page', {
      page: 'about',
      title: 'About',
      seo: { title: 'About XGD', description: 'Who builds it and why.' },
    })
    box.run('update_page', { page: 'about', seo: { description: 'The people behind XGD.' } })
    box.run('set_config', { key: 'palette', settings: PALETTE })
    box.run('set_config', { key: 'palette', settings: { primary: { steps: { deep: '#0f3f52' } } } })

    // ── the stored definitions agree ────────────────────────────────────────
    // The merge rule applied, the drawing under its generated filename, the
    // component on the page and the page's merged search metadata — identical
    // whichever vocabulary asked for them.
    expect(readSite(viaCli)).toEqual(readSite(viaSurface))
    expect(readPage('home', viaCli)).toEqual(readPage('home', viaSurface))
    expect(readPage('about', viaCli)).toEqual(readPage('about', viaSurface))

    // ...and the substance of each, so an agreement between two empty results
    // cannot pass for coverage.
    expect(readSite(viaCli).palette.primary.steps).toEqual({
      deep: '#0f3f52',
      light: PALETTE.primary.steps.light,
    })
    expect(readSite(viaCli).assets.map((a: any) => a.id)).toContain('wordmark.svg')
    expect(readFileSync(path.join(draftDir(viaCli), 'assets', 'wordmark.svg'), 'utf8')).toBe(MARK)
    expect(readPage('home', viaCli).modules[0]).toMatchObject({
      id: 'signup',
      type: 'contact-form',
    })
    expect(readPage('about', viaCli).seoMeta).toEqual({
      title: 'About XGD',
      description: 'The people behind XGD.',
    })
  }, 120000)
})
