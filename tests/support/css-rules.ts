/**
 * Reading a stylesheet as text, for suites whose subject is what the CSS SAYS.
 *
 * ONE COPY, BECAUSE THERE WERE THREE. The same fourteen-line `rulesOf` was
 * pasted into three copy-edit suites, which is how a latent defect in it stayed
 * latent in two of them: the selector was handed to `keep` exactly as it sits in
 * the file, so an assertion matching a contiguous substring of a selector was
 * really an assertion about how the selector had been WRAPPED. `builder.css`
 * formats one `:not(:has( … ))` with its selector list indented onto its own
 * lines; `:has(.builder-modal__box` is present in that rule and absent from its
 * text, and two `AC-1043` tests read the empty string for months because of it.
 */

/** One declaration block, with the selector that introduced it. */
export interface CssRule {
  selector: string
  body: string
}

/**
 * The selector as a matcher should see it: layout normalised away.
 *
 * Runs of whitespace collapse to one space and the space around `(`, `)` and `,`
 * goes entirely, so `:has(\n    .a,\n    .b\n  )` and `:has(.a,.b)` are the same
 * string. Descendant combinators survive — they are the one place a space is
 * load-bearing — so `.panel .box` never becomes `.panel.box`.
 *
 * WHITESPACE INSIDE A SELECTOR LIST IS NOT A BEHAVIOUR ANYBODY MEANT TO PIN. A
 * test that breaks when a rule is re-wrapped is reporting on the formatter.
 */
export function normaliseSelector(selector: string): string {
  return selector
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),])\s*/g, '$1')
    .trim()
}

/**
 * Every rule in `css`, selector normalised.
 *
 * Comments are stripped FIRST. A selector is everything since the last `}`, so a
 * rule preceded by a comment — which is most of the modal's, since each explains
 * why it is the way it is — would otherwise arrive with that comment glued to
 * its front and match nothing, silently narrowing every assertion to the rules
 * that happen to have no comment above them.
 */
export function cssRules(css: string): CssRule[] {
  const rules: CssRule[] = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let m: RegExpExecArray | null
  while ((m = re.exec(bare))) rules.push({ selector: normaliseSelector(m[1]), body: m[2] })
  return rules
}

/** The bodies of every declaration block whose (normalised) selector satisfies `keep`. */
export function rulesOf(css: string, keep: (selector: string) => boolean): string[] {
  return cssRules(css)
    .filter((rule) => keep(rule.selector))
    .map((rule) => rule.body)
}
