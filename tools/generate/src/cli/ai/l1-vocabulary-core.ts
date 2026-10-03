/**
 * The L1 vocabulary as a walk over its own schemas — and the builder's copy of it
 * ([[BUG-182]]).
 *
 * TWO READERS, ONE WALK. `kb-projection.ts` renders the whole vocabulary into
 * `REF-l1`, with every field's meaning lifted from the schema source; the builder
 * is primed with the same vocabulary condensed to names and types. Both read the
 * Zod schemas through the helpers below, so the value sets and bounds either one
 * states are literally the ones the validator enforces, and the two cannot come
 * to disagree about what a page may contain.
 *
 * NO FILE IS READ HERE, and that is why the walk lives in this directory rather
 * than beside the projection. The projection reads the schema SOURCE for its
 * prose, which only the CLI can do; the builder's priming is assembled in the
 * Worker as well, where there is no filesystem. Everything below is reached
 * through the package import alone.
 */

import * as SiteSchema from '@1stcontact/site-schema'

export function range(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${min}–${max}`
  if (min !== undefined) return `at least ${min}`
  if (max !== undefined) return `at most ${max}`
  return ''
}

/**
 * Every schema in `@1stcontact/site-schema` that has a name, keyed by IDENTITY.
 *
 * A Zod schema is a value, and the same value is reachable from several places —
 * `surfaceGradient` in the surface group IS `l1GradientSchema`. Keying the map on
 * the object means a reference is recognised as one wherever it appears, so a
 * shape is described once and pointed at everywhere else. Rendering it inline at
 * each use would repeat the gradient contract a dozen times and lose the fact
 * that they are the same thing.
 *
 * The export name is the identity the codebase itself uses, so it is what the
 * document says. `l1LinearGradientSchema` reads as `linear gradient`.
 */
export function namedSchemas(): Map<unknown, string> {
  const named = new Map<unknown, string>()
  for (const [key, value] of Object.entries(SiteSchema as Record<string, unknown>)) {
    if (!key.startsWith('l1') || !key.endsWith('Schema')) continue
    if (value === null || typeof value !== 'object') continue
    if (!named.has(value)) named.set(value, key)
  }
  return named
}

/** `l1LinearGradientSchema` → `linear gradient`. */
export function readableName(exportName: string): string {
  return exportName
    .replace(/^l1/, '')
    .replace(/Schema$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
}

/** Zod's internal definition of a schema, which is where introspection lives. */
type ZodLike = { def?: Record<string, unknown> } & Record<string, unknown>

export function def(schema: unknown): Record<string, unknown> {
  return ((schema as ZodLike | null)?.def ?? {}) as Record<string, unknown>
}

/** Unwrap the wrappers that add no vocabulary — optional, default, lazy, readonly. */
export function unwrap(schema: unknown, named: Map<unknown, string>): unknown {
  let current = schema
  for (let hop = 0; hop < 12; hop += 1) {
    if (named.has(current)) return current
    const d = def(current)
    const kind = d.type
    if (kind === 'optional' || kind === 'nullable' || kind === 'readonly' || kind === 'default') {
      current = d.innerType
    } else if (kind === 'lazy' && typeof d.getter === 'function') {
      current = (d.getter as () => unknown)()
    } else if (kind === 'pipe') {
      current = d.in
    } else return current
  }
  return current
}

/** The numeric bounds a schema's checks declare, as `1–400` or `at least 0`. */
function numericRange(schema: unknown): string {
  const checks = (def(schema).checks ?? []) as Array<Record<string, unknown>>
  let min: number | undefined
  let max: number | undefined
  for (const check of checks) {
    const inner = ((check as { _zod?: { def?: Record<string, unknown> } })._zod?.def ??
      def(check)) as Record<string, unknown>
    if (inner.check === 'greater_than' && typeof inner.value === 'number') min = inner.value
    if (inner.check === 'less_than' && typeof inner.value === 'number') max = inner.value
  }
  return range(min, max)
}

/**
 * One field's type, in words, referring to named shapes rather than expanding them.
 *
 * `depth` exists only to stop an unnamed self-referential shape; every shape that
 * recurses in practice (`box`, `container`) is named, so the guard never fires on
 * the real schema and is there so that a future one cannot hang a build.
 */
export function typeWords(schema: unknown, named: Map<unknown, string>, depth = 0): string {
  const inner = unwrap(schema, named)
  const name = named.get(inner)
  if (name && depth > 0) return readableName(name)
  const d = def(inner)
  switch (d.type) {
    case 'enum': {
      const values = Object.keys((d.entries ?? {}) as Record<string, unknown>)
      return values.map((v) => `\`${v}\``).join(' | ')
    }
    case 'literal': {
      const values = (d.values ?? []) as unknown[]
      return values.map((v) => `\`${String(v)}\``).join(' | ')
    }
    case 'string':
      return 'text'
    case 'boolean':
      return 'true / false'
    case 'number': {
      const bounds = numericRange(inner)
      return bounds ? `number, ${bounds}` : 'number'
    }
    case 'array':
      return `a list of ${depth > 3 ? 'values' : typeWords(d.element, named, depth + 1)}`
    case 'union': {
      const options = (d.options ?? []) as unknown[]
      return depth > 3
        ? 'one of several shapes'
        : options.map((o) => typeWords(o, named, depth + 1)).join(' or ')
    }
    case 'record':
      return `named ${depth > 3 ? 'values' : typeWords(d.valueType, named, depth + 1)}`
    case 'object':
      return 'a group of fields'
    default:
      return String(d.type ?? 'value')
  }
}

/** Whether a field may be omitted. */
export function isOptional(schema: unknown): boolean {
  const kind = def(schema).type
  return kind === 'optional' || kind === 'default'
}

/** The object shape a schema resolves to, or `null` when it is not an object. */
export function objectShape(
  schema: unknown,
  named: Map<unknown, string>,
): Record<string, unknown> | null {
  const inner = unwrap(schema, named)
  const d = def(inner)
  if (d.type !== 'object') return null
  return (d.shape ?? {}) as Record<string, unknown>
}

/**
 * Each element kind in the node union: what it is called, the shape it accepts,
 * and the declaration it was written in — which is what scopes its field prose to
 * the fields it actually declares (see `harvestDeclarations` in `kb-projection.ts`).
 */
export function elementKinds(named: Map<unknown, string>): Array<{
  kind: string
  declaration: string | undefined
  shape: Record<string, unknown>
}> {
  const union = unwrap(SiteSchema.l1NodeSchema, new Map())
  const options = (def(union).options ?? []) as unknown[]
  const kinds: Array<{ kind: string; declaration: string | undefined; shape: Record<string, unknown> }> = []
  for (const option of options) {
    const shape = objectShape(option, new Map())
    if (!shape) continue
    const literal = (def(unwrap(shape.kind, new Map())).values ?? []) as unknown[]
    const kind = literal.length ? String(literal[0]) : '(unnamed)'
    kinds.push({ kind, declaration: named.get(option), shape })
  }
  // Named order rather than union order: `named` is only used for field types,
  // and the union's own order is the one the schema declares, which is the one a
  // maintainer chose. Nothing is sorted, deliberately.
  return kinds
}

/**
 * Every named shape reachable from the element kinds, breadth-first from the
 * fields they declare. Terminates because `named` is finite and each shape is
 * expanded once.
 */
export function reachableShapes(
  seeds: unknown[],
  named: Map<unknown, string>,
): Array<{ name: string; shape: Record<string, unknown> }> {
  const seen = new Set<string>()
  const found: Array<{ name: string; shape: Record<string, unknown> }> = []
  const queue = [...seeds]
  const elementNames = new Set(
    ((def(unwrap(SiteSchema.l1NodeSchema, new Map())).options ?? []) as unknown[])
      .map((o) => named.get(o))
      .filter((n): n is string => typeof n === 'string'),
  )
  while (queue.length > 0) {
    const schema = queue.shift()
    const inner = unwrap(schema, named)
    const name = named.get(inner)
    const d = def(inner)
    if (d.type === 'union') {
      for (const option of (d.options ?? []) as unknown[]) queue.push(option)
    }
    if (d.type === 'array') queue.push(d.element)
    if (d.type === 'record') queue.push(d.valueType)
    if (!name || seen.has(name)) continue
    seen.add(name)
    // The element kinds have their own section above; describing them a second
    // time here would be the one duplication this whole file exists to avoid.
    const shape = elementNames.has(name) ? null : objectShape(inner, named)
    if (!shape) continue
    found.push({ name, shape })
    for (const field of Object.values(shape)) queue.push(field)
  }
  found.sort((a, b) => readableName(a.name).localeCompare(readableName(b.name)))
  return found
}

/**
 * Every NAMED value set reachable from the seeds — the enums and unions a field's
 * type names (`layout mode`, `easing`, `align`) — expanded to what it accepts
 * ([[BUG-182]]).
 *
 * {@link reachableShapes} collects only object shapes, so a field typed `layout
 * mode` names a value set that nothing then spells out; a worker writing a
 * container would have to guess the layout values. Walked over the same fields
 * those shapes declare, so the two together describe every name a type uses.
 */
export function reachableValueSets(
  seeds: unknown[],
  named: Map<unknown, string>,
): Array<{ name: string; accepts: string }> {
  const fields = [...seeds, ...reachableShapes(seeds, named).flatMap(({ shape }) => Object.values(shape))]
  const seen = new Set<unknown>()
  const found: Array<{ name: string; accepts: string }> = []
  const queue = [...fields]
  while (queue.length > 0) {
    const inner = unwrap(queue.shift(), named)
    if (seen.has(inner)) continue
    seen.add(inner)
    const d = def(inner)
    if (d.type === 'union') queue.push(...((d.options ?? []) as unknown[]))
    if (d.type === 'array') queue.push(d.element)
    if (d.type === 'record') queue.push(d.valueType)
    const name = named.get(inner)
    // A `lazy` is the recursion back into the element union, which the kinds
    // section already describes field by field.
    if (name && d.type !== 'object' && d.type !== 'lazy') found.push({ name, accepts: typeWords(inner, named, 0) })
  }
  found.sort((a, b) => readableName(a.name).localeCompare(readableName(b.name)))
  return found
}

/**
 * The page vocabulary a builder is primed with: names and types, no prose
 * ([[BUG-182]]).
 *
 * WHY THE BUILDER IS HANDED IT. A worker's budget is a few dozen tool calls, and
 * the vocabulary was reachable only through the platform reference, one search or
 * read at a time — on a blank page, with no existing element to copy a shape
 * from, a worker spent a third of its run learning field names and ran out before
 * it built what the brief asked for. Primed, it is in the cached prefix every
 * worker of this deployment shares, so it costs one cache write rather than a
 * fetch per delegation.
 *
 * CONDENSED, NOT ABRIDGED. Every element kind, every document key and every shape
 * the kinds reach is here — a worker told it has the whole vocabulary must have
 * it. What is dropped is the per-field prose, and the repetition: the fields every
 * kind shares are stated once rather than once per kind. And it says one thing
 * `REF-l1` does not: what each NAMED value set accepts — see
 * {@link reachableValueSets}.
 *
 * DETERMINISTIC, so it is rendered once per isolate. The schemas are module
 * constants and nothing here depends on the site.
 */
let vocabulary: string | undefined

export function builderVocabulary(): string {
  if (vocabulary !== undefined) return vocabulary
  const named = namedSchemas()
  const field = (name: string, schema: unknown): string => {
    const words = typeWords(schema, named, 1)
    return `\`${name}\` (${isOptional(schema) ? words : `${words}; required`})`
  }
  const lines: string[] = []

  const seeds: unknown[] = []
  const page = objectShape(SiteSchema.l1DocumentSchema, new Map()) ?? {}
  lines.push('### The page itself', '', Object.entries(page).map(([n, s]) => field(n, s)).join(', '), '')
  seeds.push(...Object.values(page))

  // A field is SHARED when every kind declares it with the same type in words —
  // `axes` is on every kind and is not shared, because what it holds differs.
  const kinds = elementKinds(named)
  const rendered = kinds.map(({ kind, shape }) => ({
    kind,
    fields: Object.entries(shape)
      .filter(([name]) => name !== 'kind')
      .map(([name, schema]) => ({ name, line: field(name, schema), schema })),
  }))
  const shared = new Set(
    (rendered[0]?.fields ?? [])
      .filter(({ name, line }) =>
        rendered.every(({ fields }) => fields.some((f) => f.name === name && f.line === line)),
      )
      .map(({ name }) => name),
  )
  lines.push('### The kinds of element', '')
  lines.push(
    `Every kind takes: ${(rendered[0]?.fields ?? [])
      .filter(({ name }) => shared.has(name))
      .map(({ line }) => line)
      .join(', ')}.`,
    '',
  )
  for (const { kind, fields } of rendered) {
    const own = fields.filter(({ name }) => !shared.has(name))
    lines.push(`- \`${kind}\`: ${own.map(({ line }) => line).join(', ')}`)
    seeds.push(...fields.map(({ schema }) => schema))
  }
  lines.push('')

  lines.push('### The shapes those fields take', '')
  for (const { name, shape } of reachableShapes(seeds, named)) {
    const fields = Object.entries(shape).map(([n, s]) => field(n, s))
    lines.push(`- **${readableName(name)}**: ${fields.join(', ')}`)
  }

  lines.push('', '### The named values those fields take', '')
  for (const { name, accepts } of reachableValueSets(seeds, named)) {
    lines.push(`- **${readableName(name)}**: ${accepts}`)
  }

  vocabulary = lines.join('\n').trimEnd()
  return vocabulary
}
