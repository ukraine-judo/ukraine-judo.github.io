# motosh.dev — design system

> Neutral paper, one warm band, one orange mark.

**Theme:** light only.

A quiet editorial system. The page is white; sections alternate into a neutral
grey (`Mist`) and, at most twice, into a warm sand. Type carries the hierarchy —
Manrope at weight 400 for display, Inter for everything else — and colour is
rationed hard enough that a single orange 28px dash reads as emphasis.

Two forms carry the whole system:

- **The tile** — a card with exactly one rounded corner (`6px 0 0 0`) that opens
  to `24px 0 0 0` on hover. It is the only decorative move on the page, and it
  is the reason a grid of four plain rectangles does not look like a table.
- **The rule** — 28px of accent, then a hairline running to the end of the
  column. It appears under the hero, under a case title, above a closing note.
  Same object every time.

Nothing is ever heavier than 400 in the display face; nothing casts a shadow
except the device rig, where the shadow is doing real work (lifting a rendered
site off the stage).

---

## Colour

| Name | Value | Token | Role |
|------|-------|-------|------|
| Ink | `#202020` | `--ink` | Headings, primary text, and the dark band. Off-black so a full-bleed dark section does not read as a hole. |
| Ink 2 | `#4d4d4d` | `--ink-2` | Body copy, secondary labels. Also the hairline on the dark band. |
| Ink 3 | `#8a8a8a` | `--ink-3` | Stepped-back state — only where a diagram dims what is not relevant. |
| Line | `#e8e8e8` | `--line` | The single hairline. Every border and divider on a light surface. |
| Line faint | `#f2f2f2` | `--line-faint` | A hairline stepped back — unlit connections in the content-model diagram. |
| Paper | `#ffffff` | `--paper` | Page background, cards on tinted bands, text on the dark band. |
| Mist | `#efefef` | `--mist` | The alternating band and the navigation pill. |
| Mist 2 | `#e8e8e8` | `--mist-2` | Hover for a tile already sitting on Mist. |
| Sand | `#ebe6dd` | `--sand` | The warm band, at most twice per page. Also the selection highlight. |
| Sand line | `#d9d2c6` | `--sand-line` | Hairline on Sand — the neutral one disappears against warm ground. |
| Ink raised | `#2a2a2a` | `--ink-raised` | Card hover on the dark band. |
| Accent | `#ff682c` | `--accent` | The only chromatic mark: the lead of every rule, the live dot, the lit path, the cost bar. |
| Bronze | `#816729` | `--bronze` | Section eyebrows and field labels. Never a surface. |

**The rationing rule.** Accent is allowed on: the 28px lead of a rule, a 7px
status dot, one lit path in an interactive diagram, the 3px cost bar, and the
"now" marker on a timeline. Nowhere else. A second orange thing on screen makes
both of them mean nothing.

---

## Type

**Display — Manrope 400** (`--font-display`). Weight 400 only. The pair works on
the difference in aperture and x-height against Inter, not on weight.

**Grammar — Inter** (`--font-sans`). 400 for copy, 500 for meta, 600 available
and effectively unused. Full Cyrillic including `ґ`, `є` and the apostrophe.

The design draws the phone and the desktop as two compositions, so every
display step has two values. The phone number is the base; the desktop one
takes over at 900px.

| Step | Phone | Desktop | Use |
|---|---|---|---|
| `--display-hero` | 48px | `clamp(40px, 4.6vw, 66px)` | The only fluid step. Line-height 0.91. |
| `--display-xl` | 40px | 56px | Oversized ordinals: decision log, principle rows. |
| `--display-lg` | 32px | 40px | Section headline. Line-height 0.98 → 0.95. |
| `--display-md` | 28px | 32px | Card headline. |
| `--display-sm` | 22px | 24px | Tile headline. |
| `--text-lede` | 18px | Section lead, line-height 1.5. |
| `--text-body` | 16px | Running text, line-height 1.6. |
| `--text-eyebrow` | 14px | Bronze section label. Sentence case — it is a name, not a stamp. |
| `--text-caps` | 13px | The meta voice: 500, 0.08em, uppercase. |

Measure is capped in `ch`, never in pixels: `w-44` on a card paragraph, `w-46`
on a section lead, `w-62` on a closing note.

---

## Shape

| Token | Value | Use |
|---|---|---|
| `--radius-btn` | 6px | Buttons. Deliberately not a pill — the pill belongs to navigation. |
| `--radius-tile` | `6px 0 0 0` → `24px 0 0 0` | The signature single corner. |
| `--radius-inner` | 12px | A screen inside a frame. |
| `--radius-card` | 20px | Rounded card, stand frame, route panel at rest. |
| `--radius-pill` | 200px | Navigation, chips, segmented controls. |

---

## Motion

Three curves, no others.

| Token | Curve | Meaning |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Things arriving — reveals, hero stagger, curtain copy. |
| `--ease-soft` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Things answering the pointer — hover, radius morph, row nudge. |
| `--ease-gate` | `cubic-bezier(0.76, 0, 0.24, 1)` | Things owning the screen — intro curtain, route morph. |

Durations: `180 / 260 / 340 / 620 / 720ms`. A hover is never slower than 340ms;
a curtain is never faster than 620ms. The gap is the point — a control and a
navigation must not feel like the same event.

**`prefers-reduced-motion` is not consulted anywhere.** This is the system's
choice, not an oversight: the page animates always. An earlier build inverted
it and hung the curtain, the reveal, the parallax and the route morph on that
media query, which left the site frozen for anyone whose system had the
setting on — a still page with a dead hero, not a calmer version of the design.

**A curtain plays where something is actually being covered.** There are three
entrances, and exactly one of them runs on any given load:

| Class | When | What plays |
|---|---|---|
| `has-intro` | the first arrival of the session | the name card, the drawn rule, the lift |
| `has-gate` | the page was reached through a transition | the ink panel lifts and the lockup follows |
| neither | a reload, a deep link, a step back | nothing covers the page |

The decision is taken by an inline `<head>` script before the first paint, from
a word the previous page left in `sessionStorage`. It has to be that early: a
curtain decided after boot is a curtain that flashes.

An earlier build ran a curtain on every load of every document, which is not
the same intent. Coming back to the home page replayed the whole two-second
name card, and an ordinary link from one case to another flashed the ink panel
with no morph in front of it — a black frame with nothing on either side of it.

A curtain only exists once a script can lift it again: the class is set by that
same inline script and dropped after four seconds if the module never boots.
Without JavaScript there is no curtain at all.

**One panel does both halves of a transition.** The ink sheet that rises over
the page being left is the same element the next document lifts, so the two
documents draw the literal same frame either side of the navigation. The
home→case morph is the richer version of it — the card grows into a panel that
already carries the case lockup — and every other internal link uses the plain
wipe.

**The route morph opens with `clip-path`, not `width`/`height`.** The panel is
always viewport-sized; the card's rectangle is only its starting `inset()`. That
keeps the growth on the compositor and, because the box never actually resizes,
the case lockup inside it does not reflow one character while the panel opens.
The page swaps on the morph's `transitionend`, with a timer only as a backstop —
a stopwatch and an animation drift apart on a backgrounded tab, and that drift
is what tears a page transition.

The ambient dot field is a 40px lattice drifting under a pixel, deliberately
kept running. It keeps its own clock but skips the paint whenever its band is
off screen or the tab is hidden, so the pattern is wherever it would have been
when the band comes back.

**Entry is decided by geometry, not by an observer.** One shared frame reads
the rects of everything that answers the scroll. Two consequences are load-
bearing: in a hidden tab `requestAnimationFrame` never runs, so that work falls
back to a slow heartbeat — otherwise a page opened in a background tab would
sit at `opacity: 0`; and only the top edge is tested, so a block the visitor
has already scrolled past counts as arrived instead of staying hidden for the
rest of the session.
