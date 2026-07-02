import type { Motion } from '@1stcontact/site-schema'

/**
 * Structured-motion rendering (REQ-16, DOC-7 §6, sycamore.so analysis).
 *
 * A motion is structured data on a module instance or a layer child; the
 * framework — never the instance — turns it into scoped CSS. `wrapWithMotion`
 * wraps a module's markup in a single `fc-motion` element carrying:
 *
 *   - trigger + type classes (`fc-motion--load`, `fc-motion--fade`, …) that
 *     select a keyframe animation or a hover transition in {@link MOTION_CSS};
 *   - framework-computed custom properties (`--fc-motion-duration`, …) emitted
 *     as an inline `style` — computed from the params, so no raw instance CSS
 *     ever reaches the page (the security/reproducibility line of DOC-7 §6.2);
 *   - `data-fc-motion-scroll` for the scroll trigger, so the tiny
 *     IntersectionObserver island ({@link MOTION_SCRIPT}) can reveal it when it
 *     enters the viewport.
 *
 * `prefers-reduced-motion: reduce` disables every animation/transition and
 * forces scroll-revealed elements visible — motion is decoration, never a
 * gate on content (WCAG).
 */

/** Framework defaults, applied via CSS `var(…, default)` fallbacks. */
const DEFAULT_DURATION_MS = 500
const DEFAULT_HOVER_DURATION_MS = 250
const DEFAULT_EASING = 'ease-out'
const DEFAULT_DELAY_MS = 0

/** Highest child index the stagger nth-child cascade sequences explicitly. */
const STAGGER_MAX = 12
/** Per-child delay step for stagger, in milliseconds. */
const STAGGER_STEP_MS = 80

/** The nth-child delay rules that sequence a stagger group's direct children. */
function staggerRules(): string {
  const rules: string[] = []
  for (let i = 1; i <= STAGGER_MAX; i += 1) {
    const delay = `calc(var(--fc-motion-delay, ${DEFAULT_DELAY_MS}ms) + ${STAGGER_STEP_MS * (i - 1)}ms)`
    rules.push(`.fc-motion--stagger > *:nth-child(${i}) { animation-delay: ${delay}; }`)
  }
  return rules.join('\n')
}

/**
 * Static motion CSS. Identical for every site; folded into the per-site
 * stylesheet alongside the module / background / layer CSS.
 */
export const MOTION_CSS = `/* motion (REQ-16) */
@keyframes fc-motion-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes fc-motion-slide {
  from { opacity: 0; transform: translateY(var(--fc-motion-distance, 24px)); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fc-motion-scale {
  from { opacity: 0; transform: scale(var(--fc-motion-scale-from, 0.92)); }
  to { opacity: 1; transform: none; }
}

/* load / scroll: keyframe animations driven by the type + trigger classes. */
.fc-motion--load, .fc-motion--scroll {
  animation-duration: var(--fc-motion-duration, ${DEFAULT_DURATION_MS}ms);
  animation-timing-function: var(--fc-motion-easing, ${DEFAULT_EASING});
  animation-delay: var(--fc-motion-delay, ${DEFAULT_DELAY_MS}ms);
  animation-fill-mode: both;
}
.fc-motion--load.fc-motion--fade { animation-name: fc-motion-fade; }
.fc-motion--load.fc-motion--slide { animation-name: fc-motion-slide; }
.fc-motion--load.fc-motion--scale { animation-name: fc-motion-scale; }

/* scroll: hidden until the island adds --visible when it enters the viewport. */
.fc-motion--scroll { opacity: 0; }
.fc-motion--scroll.fc-motion--visible.fc-motion--fade { animation-name: fc-motion-fade; }
.fc-motion--scroll.fc-motion--visible.fc-motion--slide { animation-name: fc-motion-slide; }
.fc-motion--scroll.fc-motion--visible.fc-motion--scale { animation-name: fc-motion-scale; }
.fc-motion--scroll.fc-motion--visible.fc-motion--stagger { opacity: 1; }

/* stagger: a group whose direct children animate in sequence. */
.fc-motion--stagger > * {
  animation-duration: var(--fc-motion-duration, ${DEFAULT_DURATION_MS}ms);
  animation-timing-function: var(--fc-motion-easing, ${DEFAULT_EASING});
  animation-fill-mode: both;
  animation-name: fc-motion-slide;
}
${staggerRules()}

/* hover: a transition whose end-state is chosen by the type class. */
.fc-motion--hover {
  transition-property: transform, opacity;
  transition-duration: var(--fc-motion-duration, ${DEFAULT_HOVER_DURATION_MS}ms);
  transition-timing-function: var(--fc-motion-easing, ${DEFAULT_EASING});
  transition-delay: var(--fc-motion-delay, ${DEFAULT_DELAY_MS}ms);
}
.fc-motion--hover.fc-motion--fade:hover { opacity: 0.85; }
.fc-motion--hover.fc-motion--slide:hover { transform: translateY(-6px); }
.fc-motion--hover.fc-motion--scale:hover { transform: scale(1.04); }
.fc-motion--hover.fc-motion--stagger:hover { transform: translateY(-6px); }

@media (prefers-reduced-motion: reduce) {
  .fc-motion--load, .fc-motion--scroll, .fc-motion--hover, .fc-motion--stagger > * {
    animation: none !important;
    transition: none !important;
  }
  .fc-motion--scroll { opacity: 1 !important; }
  .fc-motion--hover.fc-motion--slide:hover,
  .fc-motion--hover.fc-motion--scale:hover,
  .fc-motion--hover.fc-motion--stagger:hover { transform: none !important; }
}`

/**
 * The scroll-reveal island — a self-contained IIFE injected before `</body>`
 * only when a page carries scroll-triggered motion. It adds `fc-motion--visible`
 * to each `[data-fc-motion-scroll]` element as it enters the viewport, then
 * stops observing it. Degrades to revealing everything immediately where
 * IntersectionObserver is unavailable, so content is never trapped behind a
 * missing API.
 */
export const MOTION_SCRIPT = `(function () {
  var els = document.querySelectorAll('[data-fc-motion-scroll]');
  if (!els.length) return;
  if (typeof IntersectionObserver !== 'function') {
    for (var i = 0; i < els.length; i++) els[i].classList.add('fc-motion--visible');
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    for (var j = 0; j < entries.length; j++) {
      if (entries[j].isIntersecting) {
        entries[j].target.classList.add('fc-motion--visible');
        io.unobserve(entries[j].target);
      }
    }
  }, { threshold: 0.15 });
  for (var k = 0; k < els.length; k++) io.observe(els[k]);
})();`

/** Escape a string for safe use inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

/** The trigger + type class list for a motion. */
export function motionClasses(motion: Motion): string {
  return `fc-motion fc-motion--${motion.trigger} fc-motion--${motion.type}`
}

/**
 * The framework-computed `--fc-motion-*` custom-property declarations for a
 * motion's params. Only params the instance actually set are emitted; the rest
 * fall through to the CSS defaults. Numbers are formatted with their unit here
 * so no raw CSS crosses the boundary.
 */
export function motionVars(motion: Motion): string {
  const decls: string[] = []
  if (motion.duration !== undefined) decls.push(`--fc-motion-duration: ${motion.duration}ms;`)
  if (motion.easing !== undefined) decls.push(`--fc-motion-easing: ${motion.easing};`)
  if (motion.delay !== undefined) decls.push(`--fc-motion-delay: ${motion.delay}ms;`)
  return decls.join(' ')
}

/**
 * Wrap a module's rendered HTML in a motion element. Returns the HTML unchanged
 * when the instance has no motion, so modules without one render exactly as
 * before. Scroll-triggered motions carry `data-fc-motion-scroll` for the island.
 */
export function wrapWithMotion(moduleHtml: string, motion: Motion | undefined): string {
  if (!motion) return moduleHtml
  const cls = motionClasses(motion)
  const vars = motionVars(motion)
  const styleAttr = vars ? ` style="${escapeAttr(vars)}"` : ''
  const scrollAttr = motion.trigger === 'scroll' ? ' data-fc-motion-scroll' : ''
  return `<div class="${cls}"${styleAttr}${scrollAttr}>${moduleHtml}</div>`
}

/** Whether `motion` needs the scroll-reveal island shipped to the page. */
export function isScrollMotion(motion: Motion | undefined): boolean {
  return motion?.trigger === 'scroll'
}
