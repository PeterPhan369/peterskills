# Frontend Anti-Patterns and Detector Rules

Exhaustive catalog of 75 deterministic detector rules for frontend design. These rules define the quality floor, identifying common AI tells, usability failures, and visual flaws across CSS, HTML, JSX, and Tailwind.

---

## 1. Visual and Structural

These patterns represent default reflexes of AI-generated user interfaces. Avoid them unless explicitly required by a project brief.

### 1. `side-tab`
* **Name**: Side-tab accent border
* **Category**: Slop
* **The Tell**: A thick colored border (3px to 5px) attached to one side of a card (usually left or top). It is a primary signature of AI-generated dashboards.
* **Bad**: `border-l-4 border-indigo-500` or `border-left: 4px solid var(--accent)`.
* **Fix**: Remove the colored accent stripe. Use subtle surface tinting, typography weight, or an inline badge to distinguish card priority.

### 2. `border-accent-on-rounded`
* **Name**: Border accent on rounded element
* **Category**: Slop
* **The Tell**: A thick one-sided border placed on a container with rounded corners (`rounded-xl` or `border-radius: 12px`), creating an awkward clipping seam where the border meets the corner curve.
* **Bad**: `rounded-xl border-l-4 border-blue-500`.
* **Fix**: Either remove the one-sided border or keep the container corners square (`border-radius: 0`).

### 3. `overused-font`
* **Name**: Overused font family
* **Category**: Slop
* **The Tell**: Relying on Inter, Roboto, Fraunces, Geist, Plus Jakarta Sans, or Space Grotesk by default. Every wave of AI models defaults to these same typefaces.
* **Bad**: `font-family: 'Inter', sans-serif;` on a new project without deliberate brand rationale.
* **Fix**: Select a typeface that reflects the specific product domain (such as Newsreader, Outfit, Instrument Sans, Archivo, Satoshi, or General Sans).

### 4. `flat-type-hierarchy`
* **Name**: Flat typography hierarchy
* **Category**: Slop
* **The Tell**: Headings, subheads, and body copy separated by less than 1.25x in font size, resulting in a timid hierarchy where nothing commands attention.
* **Bad**: Title at 18px, section heading at 16px, body at 15px.
* **Fix**: Establish a clear typographic scale with at least one bold ratio step (for example: 32px or 40px display, 24px section, 15px body).

### 5. `gradient-text`
* **Name**: Gradient text on headings or metrics
* **Category**: Slop
* **The Tell**: Decorative purple-to-pink or blue-to-cyan gradient text applied to hero headings, big numbers, or keyword callouts (`bg-clip-text text-transparent`).
* **Bad**: `bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent`.
* **Fix**: Use solid foreground ink with high contrast. Reserve emphasis for type size, weight, or a distinct background surface.

### 6. `ai-color-palette`
* **Name**: AI color palette (purple/violet gradients, cyan-on-dark)
* **Category**: Slop
* **The Tell**: Violet gradients (#8b5cf6 to #ec4899), neon cyan text on pitch dark, or radiant teal buttons.
* **Bad**: Deep charcoal page with bright violet buttons and cyan accent icons.
* **Fix**: Build a deliberate color palette rooted in the domain. Ground dark themes with warm or cool slate undertones rather than saturated neon accents.

### 7. `cream-palette`
* **Name**: Cream or beige default background
* **Category**: Slop
* **The Tell**: Warm beige (#fdfbf7 or #faf6f0) used as a safe, generic fallback surface to simulate human taste.
* **Bad**: Generic warm off-white background paired with default serif headings across unrelated products.
* **Fix**: Choose a ground color tailored to the product personality: clean paper white, cool slate, or tinted canvas.

### 8. `nested-cards`
* **Name**: Nested cards
* **Category**: Slop
* **The Tell**: Placing cards inside other cards, creating redundant borders, competing padding, and muddy depth layers.
* **Bad**: A card container holding a grid of smaller cards with identical borders and shadows.
* **Fix**: Flatten the structure. Use subtle divider lines, spacing, or simple typographic grouping instead of nesting containers.

### 9. `monotonous-spacing`
* **Name**: Monotonous spacing
* **Category**: Slop
* **The Tell**: Using the exact same spacing unit (such as 16px or 24px) between every element, giving the page no rhythm.
* **Bad**: `gap-4` applied between tight labels, between form fields, and between major page sections.
* **Fix**: Apply spatial rhythm: tight spacing (4px to 8px) for closely related items, moderate spacing (16px to 24px) for field groups, and generous spacing (48px to 80px) between major sections.

### 10. `bounce-easing`
* **Name**: Bounce or elastic animation easing
* **Category**: Slop
* **The Tell**: CSS transitions or animations using bouncy cubic-bezier curves (`cubic-bezier(0.68, -0.55, 0.27, 1.55)`).
* **Bad**: Modal or tooltip popping in with an exaggerated cartoon bounce.
* **Fix**: Use smooth exponential deceleration (`cubic-bezier(0.16, 1, 0.3, 1)` or `ease-out`) for polished, realistic motion.

### 11. `pulsing-dot`
* **Name**: Decorative pulsing status dot
* **Category**: Slop
* **The Tell**: An animated pulsing green or purple dot next to static text to feign real-time activity.
* **Bad**: A pulsing dot next to a static feature announcement or marketing stat.
* **Fix**: Reserve pulsing animations exclusively for genuine live connections or active background processes.

### 12. `blinking-cursor`
* **Name**: Fake blinking typewriter cursor
* **Category**: Slop
* **The Tell**: A blinking pipe character (`|`) animated in hero headlines to imitate terminal typing.
* **Bad**: A span with `animate-pulse` pretending to type a marketing slogan.
* **Fix**: Present the headline in full. Let crisp copy communicate without artificial typing gimmicks.

### 13. `shape-assembled-illustration`
* **Name**: Shape-assembled SVG illustration
* **Category**: Slop
* **The Tell**: Large inline SVG drawings built out of circles, rounded rectangles, and floating puzzle pieces serving as generic corporate filler.
* **Bad**: Multi-colored floating geometric shapes illustrating collaboration or security.
* **Fix**: Use authentic photography, real UI screenshots, data visualizations, or minimal typography.

### 14. `organic-clip-path`
* **Name**: Organic contour simulated with clip-path
* **Category**: Slop
* **The Tell**: CSS `clip-path: polygon(...)` with dozens of coordinate pairs approximating a torn paper edge, wave, or blob.
* **Bad**: Complex inline polygon masks in CSS attempting organic silhouettes.
* **Fix**: Use clean geometric angles or export proper SVG/WebP assets for complex illustrations.

### 15. `buried-raster`
* **Name**: Raster image buried under heavy tint or low opacity
* **Category**: Slop
* **The Tell**: A photographic background covered by a 90% opacity gradient or reduced to 0.05 opacity so it is barely perceptible.
* **Bad**: Stock photo set to `opacity-10` behind a dark gradient.
* **Fix**: Either let the image be visible with purposeful framing, or remove the file to save bandwidth and visual clutter.

### 16. `dark-glow`
* **Name**: Chromatic glowing shadow accents
* **Category**: Slop
* **The Tell**: Zero-offset colored box-shadows or text-shadows (`0 0 20px rgba(139, 92, 246, 0.6)`) creating an ungrounded neon halo.
* **Bad**: Buttons or cards surrounded by bright glowing colored halos.
* **Fix**: Use natural directional elevation shadows with an explicit Y-offset (`0 8px 24px rgba(0, 0, 0, 0.12)`).

### 17. `radial-halo`
* **Name**: Saturated radial gradient halo background
* **Category**: Slop
* **The Tell**: A circular radial gradient wash floating in the center of a dark page background.
* **Bad**: `background: radial-gradient(circle at center, rgba(120, 50, 255, 0.4), transparent 70%)`.
* **Fix**: Ground dark interfaces with subtle surface shifts, crisp structural dividers, or clean solid neutrals.

### 18. `radial-spotlight-glow`
* **Name**: Decorative radial spotlight behind hero copy
* **Category**: Slop
* **The Tell**: A translucent colored cloud placed directly behind hero typography that causes reading interference.
* **Bad**: Soft blue or purple blur circle positioned behind black or white hero text.
* **Fix**: Maintain high contrast between text and the background surface without floating color clouds.

### 19. `marquee`
* **Name**: Auto-scrolling logo or text marquee
* **Category**: Slop
* **The Tell**: Continuous CSS infinite keyframe animation scrolling company logos or customer quotes sideways.
* **Bad**: `animation: marquee 20s linear infinite` that users cannot pause or control.
* **Fix**: Present logos in a clean, static grid. Let users read testimonials at their own speed.

### 20. `icon-tile-stack`
* **Name**: Rounded icon tile stacked above heading
* **Category**: Slop
* **The Tell**: A square container with rounded corners and a colored background holding a 20px icon placed directly above a heading on every card.
* **Bad**: Three-column card grid where every card has a 48x48px purple square icon tile at the top.
* **Fix**: Place the icon inline with the heading, integrate it into content flow, or let the typography lead.

### 21. `italic-serif-display`
* **Name**: Oversized italic serif display headline
* **Category**: Slop
* **The Tell**: Using an italic serif (such as Playfair, Fraunces, or Recoleta italic) for a single buzzword in a B2B SaaS landing page headline.
* **Bad**: "The all-in-one platform for *modern* engineering teams".
* **Fix**: Keep display headlines roman and unified, or use a serif face consistently across the whole identity rather than as a decorative one-word gimmick.

### 22. `identical-card-grids`
* **Name**: Monotonous grid of identical feature cards
* **Category**: Slop
* **The Tell**: Building an entire page out of three-column grids of identical cards (icon, H3, two-line paragraph).
* **Bad**: Twelve consecutive cards sharing identical dimensions, weights, and layouts.
* **Fix**: Vary information density. Use hero feature callouts, side-by-side walkthroughs, data tables, and interactive demonstrations.

### 23. `hero-metric-template`
* **Name**: Boilerplate hero metric stack
* **Category**: Slop
* **The Tell**: Stacking a giant bold number above a tiny muted label in an isolated card row without context.
* **Bad**: Row of three boxes: "99.9% Uptime", "10M+ Requests", "500k Users".
* **Fix**: Integrate metrics into authentic customer stories, interactive graphs, or inline proof points.

### 24. `kicker-above-heading`
* **Name**: Kicker or eyebrow label above heading
* **Category**: Slop
* **The Tell**: Placing a small uppercase category label or pill chip directly above a section heading or hero title. The heading should carry its own weight; kickers read as generated boilerplate.
* **Bad**: Pill chip "PLATFORM OVERVIEW" sitting above "Real-Time Collaboration for Engineering Teams".
* **Fix**: Delete the kicker entirely. Let the primary heading lead directly.

### 25. `numbered-section-labels`
* **Name**: Decorative section numbers
* **Category**: Slop
* **The Tell**: Numbering sections with "01", "02", "03" when the sequence does not represent ordered steps.
* **Bad**: Numbering feature cards "01 Analytics", "02 Integrations", "03 Permissions".
* **Fix**: Remove the decorative numbers. Reserve numbering for genuine instructional steps or chronological sequences.

### 26. `decorative-grid-background`
* **Name**: Decorative grid-line background
* **Category**: Slop
* **The Tell**: Hairline linear-gradient grid lines tiling the page background without an underlying blueprint, map, or canvas domain.
* **Bad**: `background-image: linear-gradient(to right, #202020 1px, transparent 1px)`.
* **Fix**: Use clean, solid surface shifts or structural dividers rather than artificial grid-line wallpaper.

### 27. `repeating-stripes-gradient`
* **Name**: Repeating-gradient stripes
* **Category**: Slop
* **The Tell**: Using `repeating-linear-gradient` stripes as background decoration on cards or banners.
* **Bad**: Angled warning-stripe or barber-pole pattern filling a card header.
* **Fix**: Use purposeful solid color fills, authentic border lines, or clean typography.

---

---

## 2. Copy and Voice

### 28. `em-dash-overuse`
* **Name**: Overuse of em-dashes in copy
* **Category**: Copy
* **The Tell**: Peppered em-dashes throughout marketing and interface copy, a common AI cadence signature.
* **Bad**: Stringing em-dashes across clauses: "Fast &mdash; reliable &mdash; built for scale &mdash; with modern security."
* **Fix**: Rewrite using commas, colons, parentheses, or periods. This repository enforces zero em-dashes across all prose.

### 29. `marketing-buzzword`
* **Name**: Generic marketing buzzwords
* **Category**: Copy
* **The Tell**: Using empty corporate filler terms like "seamlessly", "revolutionize", "supercharge", "next-generation", or "paradigm shift".
* **Bad**: "Supercharge your workflow with our seamless next-generation platform."
* **Fix**: State concrete capabilities: "Run tests in parallel across four worker threads."

### 30. `aphoristic-cadence`
* **Name**: Synthetic aphoristic-cadence copy
* **Category**: Copy
* **The Tell**: Writing in short, punchy, pseudo-philosophical sentences mimicking AI marketing aphorisms.
* **Bad**: "Complexity tamed. Software reimagined. Code that speaks."
* **Fix**: Write plain, informative prose explaining what the software does.

### 31. `theater-slop-phrase`
* **Name**: Theater framing copy
* **Category**: Copy
* **The Tell**: Cynically dismissing alternative methods as "security theater" or "productivity theater" to prop up a feature claim.
* **Bad**: "Stop practicing compliance theater."
* **Fix**: Describe positive advantages and measurable improvements directly.

### 32. `vague-button-copy`
* **Name**: Vague button action copy
* **Category**: Copy
* **The Tell**: Labeling primary action buttons with ambiguous text like "Click Here", "Submit", or "Continue".
* **Bad**: A button labeled "Proceed" in a payment flow.
* **Fix**: Name the specific action and target: "Complete Purchase", "Create Account", "Download Invoice".

### 33. `repeated-container-text`
* **Name**: Identical text repeated inside one container
* **Category**: Copy
* **The Tell**: Repeating the identical heading, title, or label inside both the parent header and child body of a card.
* **Bad**: A card titled "API Keys" containing a sub-heading "API Keys" and a paragraph starting with "API Keys allow...".
* **Fix**: Consolidate redundant copy so each phrase conveys distinct information.

### 34. `fake-button-link`
* **Name**: Semantically invalid button or link
* **Category**: Copy & Semantics
* **The Tell**: Using a `<div>` with an onClick handler instead of a `<button>`, or using an anchor tag without an `href` for an action.
* **Bad**: `<div onClick={handleClick}>Submit</div>`.
* **Fix**: Use semantic `<button>` for actions and `<a>` with valid `href` for navigation.

---

---

## 3. Layout and Composition

### 35. `inconsistent-border-radii`
* **Name**: Inconsistent border radii in a single module
* **Category**: Layout & Space
* **The Tell**: Combining disparate corner radii (such as sharp 0px inputs, 8px cards, and 24px buttons) in the same component cluster.
* **Bad**: An 8px container holding a 24px pill button and 2px input fields.
* **Fix**: Establish a harmonious radius scale (for example: 6px for controls, 12px for containers, 16px for modals).

### 36. `ghost-card-border-shadow`
* **Name**: Hairline border with oversized diffuse shadow (ghost card)
* **Category**: Layout & Depth
* **The Tell**: A 1px light gray border paired with a wide, soft diffuse shadow. Declare elevation once: commit to either a defined edge or a soft elevation, not both.
* **Bad**: `border border-gray-200 shadow-2xl` on small interface cards.
* **Fix**: Use either a crisp border alone or a subtle directional shadow alone.

### 37. `hard-offset-shadow`
* **Name**: Hard offset shadow outside neobrutalism
* **Category**: Layout & Depth
* **The Tell**: Applying zero-blur block shadows (`box-shadow: 4px 4px 0 #000`) on an interface that does not follow a genuine neobrutalist aesthetic.
* **Bad**: Card in a clean modern SaaS app styled with `box-shadow: 3px 3px 0 #000`.
* **Fix**: Use soft directional elevation shadows with appropriate blur radius.

### 38. `harsh-box-shadow`
* **Name**: Harsh, high-opacity box shadow
* **Category**: Layout & Depth
* **The Tell**: Box shadows using heavy black opacity (`rgba(0, 0, 0, 0.4)`) with short blur radii, producing dirty, muddy borders.
* **Bad**: `box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4)`.
* **Fix**: Layer soft, low-opacity shadows with realistic diffusion (for example: `0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)`).

### 39. `flat-depth-stacking`
* **Name**: Missing elevation on overlapping layers
* **Category**: Layout & Depth
* **The Tell**: Dropdowns, floating action bars, or sticky headers sharing the identical background color and border as the canvas beneath them.
* **Bad**: Sticky navigation blending into page body without border, shadow, or backdrop blur.
* **Fix**: Separate layered surfaces using elevation shadow, distinct background tint, or crisp boundary lines.

### 40. `cramped-padding`
* **Name**: Cramped container padding
* **Category**: Layout & Space
* **The Tell**: Providing card or section padding smaller than the font size of the primary heading inside it.
* **Bad**: A card with 24px heading wrapped in `p-2` (8px padding).
* **Fix**: Provide generous container padding: at least 16px to 24px for cards, and 48px to 64px for page sections.

### 41. `edge-flush-cards`
* **Name**: Cards flush against scroller or viewport edge
* **Category**: Layout & Space
* **The Tell**: Horizontal scrollers or mobile cards touching the viewport edges with zero margin or padding.
* **Bad**: Card list touching mobile screen edges without breathing room.
* **Fix**: Add scroll padding (`px-4` or `scroll-pl-4`) so items maintain offset from viewport edges.

### 42. `body-text-viewport-edge`
* **Name**: Body text touching viewport edge on mobile
* **Category**: Layout & Space
* **The Tell**: Paragraph text running flush against the mobile device screen border without horizontal margin.
* **Bad**: Main container lacking horizontal padding on mobile screens (<640px).
* **Fix**: Add at least 16px horizontal padding (`px-4`) to main page wrappers.

### 43. `first-viewport-column-overflow`
* **Name**: One column stretching the first viewport
* **Category**: Layout & Space
* **The Tell**: A secondary sidebar or illustration pushing primary above-the-fold content below the bottom of the viewport on initial load.
* **Bad**: Hero section with massive vertical illustration forcing CTA below the screen fold.
* **Fix**: Keep above-the-fold compositions compact and balanced, ensuring core value propositions and actions are visible without scrolling.

### 44. `clipped-overflow-container`
* **Name**: Positioned child clipped by overflow container
* **Category**: Layout & Space
* **The Tell**: Placing an absolutely positioned dropdown, tooltip, or modal inside an ancestor container that has `overflow: hidden`.
* **Bad**: Datepicker popup cut off by table card boundary.
* **Fix**: Use fixed positioning, a portal attached to document body, or remove unnecessary `overflow: hidden`.

### 45. `unresponsive-flex-wrap`
* **Name**: Non-wrapping horizontal flex row
* **Category**: Layout & Responsive
* **The Tell**: Placing multiple buttons or tags in a `flex-row` without `flex-wrap`, causing horizontal overflow on mobile screens.
* **Bad**: `flex gap-4` containing four action buttons without wrap or responsive stacking.
* **Fix**: Add `flex-wrap` or switch to vertical stacking on mobile (`flex-col sm:flex-row`).

### 46. `unresponsive-table`
* **Name**: Data table without mobile adaptation
* **Category**: Layout & Responsive
* **The Tell**: Multi-column `<table>` placed inside a fixed-width container, clipping or breaking layout on mobile viewports.
* **Bad**: Seven-column data table overflowing viewport with no scroll affordance.
* **Fix**: Wrap table in an `overflow-x-auto` container with scroll padding, or transform table rows into mobile cards on small screens.

---

---

## 4. Color and Contrast

### 47. `gray-on-color`
* **Name**: Gray ink on chromatic background
* **Category**: Color & Contrast
* **The Tell**: Using neutral gray (#6b7280) for secondary text on a blue, green, or purple surface, creating a muddy appearance.
* **Bad**: `text-gray-400` placed inside a `bg-indigo-900` card.
* **Fix**: Tint secondary text using the background surface hue (for example: light lavender on deep violet, soft slate-blue on navy).

### 48. `text-contrast`
* **Name**: Insufficient text contrast
* **Category**: Color & Contrast
* **The Tell**: Body or input placeholder text failing WCAG AA (4.5:1 for body copy, 3:1 for large text).
* **Bad**: Light gray text (#9ca3af) on white background (contrast ratio 2.8:1).
* **Fix**: Ensure all body text meets or exceeds 4.5:1 contrast against its rendered surface.

### 49. `pure-black`
* **Name**: Untinted pure black
* **Category**: Color & Contrast
* **The Tell**: Using #000000 for backgrounds or text without subtle chromatic tinting, resulting in harsh, high-fatigue contrast.
* **Bad**: `background-color: #000000; color: #ffffff;` with zero warmth or undertone.
* **Fix**: Tint dark surfaces with subtle hue (for example: #090d16 for cool tech, #12100e for warm editorial).

### 50. `hover-contrast`
* **Name**: Insufficient hover state contrast
* **Category**: Color & Contrast
* **The Tell**: Hover state changing background or text by less than 5% luminance, making interactive feedback imperceptible.
* **Bad**: Button background shifting from `#3b82f6` to `#3880f0` on hover.
* **Fix**: Provide clear interactive feedback: shift surface tone by at least 10% to 15%, adjust border contrast, or update elevation.

### 51. `overly-saturated-background`
* **Name**: Overly saturated background surface
* **Category**: Color & Contrast
* **The Tell**: Covering large content areas in pure primary saturation (such as raw #3b82f6 or #ef4444), causing severe eye strain.
* **Bad**: Full-page background filled with 100% saturated primary blue.
* **Fix**: Use muted, desaturated surface backgrounds (such as 3% to 6% saturation), reserving vibrant chroma for focal actions and status accents.

### 52. `design-system-color`
* **Name**: Color outside declared design palette
* **Category**: Color & Contrast
* **The Tell**: Introducing arbitrary one-off hex colors that drift outside the project's token palette.
* **Bad**: Using `#3a7bd5` in one component while the design system uses `--color-primary-500: #2563eb`.
* **Fix**: Use defined color tokens or update the central palette if adding a deliberate brand hue.

### 53. `unthemed-browser-surfaces`
* **Name**: Unthemed browser native surfaces
* **Category**: Color & Contrast
* **The Tell**: Leaving native browser defaults (selection background, scrollbars, text carets) un-styled when the rest of the application has a distinct palette.
* **Bad**: Deep dark-theme interface with default neon blue OS text selection and bright white browser scrollbar.
* **Fix**: Theme native surfaces to match the palette using `::selection`, `caret-color`, and `scrollbar-color`.

---

---

## 5. Typography

### 54. `tight-leading`
* **Name**: Crowded body line-height
* **Category**: Typography
* **The Tell**: Multiline paragraph text with line-height set under 1.4, causing text lines to collide and impairing readability.
* **Bad**: Body text at 16px with `line-height: 1.15`.
* **Fix**: Set body line-height between 1.5 and 1.65 (`leading-relaxed` or `line-height: 1.55`). Reserve tight leading (1.1 to 1.25) for display headings.

### 55. `oversized-h1`
* **Name**: Oversized heading without mobile scaling
* **Category**: Typography
* **The Tell**: Setting H1 font size above 4rem (64px) using static units without responsive clamp, breaking smaller screens.
* **Bad**: `h1 { font-size: 72px; }` without media query or clamp.
* **Fix**: Use fluid typography: `font-size: clamp(2.25rem, 5vw + 1rem, 4.5rem);`.

### 56. `unconstrained-measure`
* **Name**: Unconstrained paragraph line length
* **Category**: Typography
* **The Tell**: Body paragraphs spanning the entire width of a wide container, exceeding 80 characters per line.
* **Bad**: Text container at `max-w-full` on an ultrawide monitor with 150 characters per line.
* **Fix**: Constrain reading line length between 55 and 75 characters using `max-w-prose` or `max-width: 65ch`.

### 57. `extreme-negative-tracking`
* **Name**: Crushed letter spacing
* **Category**: Typography
* **The Tell**: Setting negative tracking tighter than -0.04em (`letter-spacing: -0.06em`), crushing glyphs together and impairing legibility.
* **Bad**: `letter-spacing: -0.05em` on display headings.
* **Fix**: Cap negative tracking at -0.04em maximum. Values between -0.01em and -0.03em usually read best.

### 58. `wide-tracking`
* **Name**: Wide letter spacing on body text
* **Category**: Typography
* **The Tell**: Applying uppercase tracking (>0.05em) to standard lowercase body copy, breaking word cohesion.
* **Bad**: `p { letter-spacing: 0.1em; }`.
* **Fix**: Keep body tracking at normal (0em). Reserve wide tracking exclusively for small, all-caps metadata labels.

### 59. `all-caps-body`
* **Name**: All-caps body text
* **Category**: Typography
* **The Tell**: Setting paragraphs or multi-sentence descriptions in uppercase characters.
* **Bad**: `<p className="uppercase">We help teams build scalable software...</p>`.
* **Fix**: Use normal sentence casing for readable body text. Reserve uppercase for short, one- or two-word badges.

### 60. `tiny-text`
* **Name**: Tiny body text
* **Category**: Typography
* **The Tell**: Setting body or reading copy below 12px font size.
* **Bad**: Article body copy set to 10px.
* **Fix**: Maintain a minimum font size of 14px to 16px for body paragraphs, with 12px reserved for secondary metadata.

### 61. `undersized-ui-text`
* **Name**: Undersized functional text
* **Category**: Typography
* **The Tell**: Setting buttons, input labels, or dropdown items under 11px font size.
* **Bad**: Form field label rendered at 9px.
* **Fix**: Keep functional form labels and control text at 12px to 14px minimum.

### 62. `justified-text`
* **Name**: Justified text on web layouts
* **Category**: Typography
* **The Tell**: Applying `text-align: justify` to responsive text columns, creating uneven word spacing rivers.
* **Bad**: `text-align: justify` in a fluid web container.
* **Fix**: Use left-aligned text (`text-align: left`).

### 63. `straggler`
* **Name**: Single-word trailing line (orphan)
* **Category**: Typography
* **The Tell**: A body paragraph wrapping such that the final line contains only a single short word.
* **Bad**: Paragraph ending with "application." isolated on its own line.
* **Fix**: Adjust container width, rephrase slightly, or set `text-wrap: pretty`.

### 64. `unbalanced-headings`
* **Name**: Orphaned words in multiline headings
* **Category**: Typography
* **The Tell**: A large multiline heading wrapping such that the final line contains a solitary short word.
* **Bad**: "Deliver world-class software to your entire engineering" wrapping to "team".
* **Fix**: Apply `text-wrap: balance` in CSS to balance line lengths evenly.

### 65. `raw-tabular-numbers`
* **Name**: Missing tabular figures in numeric columns
* **Category**: Typography
* **The Tell**: Financial data, counters, or timers set in proportional figures, causing jitter during updates and misaligned columns.
* **Bad**: Price column in a table where digit widths vary.
* **Fix**: Apply `font-variant-numeric: tabular-nums` or `tabular-nums` in Tailwind.

### 66. `skipped-heading`
* **Name**: Skipped heading hierarchy level
* **Category**: Typography & Accessibility
* **The Tell**: Jumping from an H1 directly to an H3 or H4 without an intervening H2.
* **Bad**: `<h1>Dashboard</h1>` immediately followed by `<h3>Recent Activity</h3>`.
* **Fix**: Maintain sequential heading levels: H1 -> H2 -> H3. Use CSS classes for visual size rather than skipping semantic tags.

### 67. `heading-rhythm`
* **Name**: Heading crowded against preceding block
* **Category**: Typography & Spacing
* **The Tell**: A section heading having equal or less space above it than below it, visually detaching it from the section it introduces.
* **Bad**: Heading with `margin-top: 12px; margin-bottom: 24px;`.
* **Fix**: Ensure heading top margin is 2x to 3x the bottom margin (`mt-12 mb-4`), attaching the heading to its content.

---

---

## 6. Components and Interactions

### 68. `content-hidden-at-rest`
* **Name**: Critical information or action hidden behind hover
* **Category**: Interaction
* **The Tell**: Hiding important action buttons (such as edit, delete, or copy) or status tags completely until the user hovers over a row.
* **Bad**: Table row where the action menu is `opacity-0 group-hover:opacity-100` with no touch affordance.
* **Fix**: Keep primary actions accessible at all times, especially for mobile and keyboard users. Use subtle opacity reduction (such as 0.7) rather than hiding entirely.

### 69. `missing-focus-ring`
* **Name**: Stripped focus ring without accessible replacement
* **Category**: Interaction & Accessibility
* **The Tell**: Setting `outline: none` or `outline: 0` on buttons, links, or form controls without adding a visible custom focus ring.
* **Bad**: `button:focus { outline: none; }`.
* **Fix**: Implement a visible, high-contrast focus ring: `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2`.

### 70. `unreachable-touch-target`
* **Name**: Touch target under 44x44px
* **Category**: Interaction & Ergonomics
* **The Tell**: Interactive buttons, icons, or links with click areas smaller than 44x44px on mobile devices.
* **Bad**: Close button with 16x16px bounding box on touch screen.
* **Fix**: Ensure interactive elements have an effective tap target of at least 44x44px using padding or pseudo-elements.

### 71. `low-tap-target-spacing`
* **Name**: Tightly packed touch targets
* **Category**: Interaction & Ergonomics
* **The Tell**: Placing touch targets closer than 8px apart, leading to accidental mis-taps on mobile.
* **Bad**: Mobile pagination links spaced 2px apart.
* **Fix**: Maintain at least 8px to 12px of spacing between adjacent touch targets.

### 72. `missing-component-states`
* **Name**: Missing interactive and async component states
* **Category**: States & Reliability
* **The Tell**: Components lacking dedicated states for hover, active, loading, disabled, error, or empty views.
* **Bad**: Button without loading spinner during API request; form field failing silently without inline error indicator; blank void on zero results.
* **Fix**: Implement distinct visual presentations for hover, active, focus, disabled, loading, empty, and inline validation error states.

### 73. `broken-image`
* **Name**: Broken or placeholder image without fallback
* **Category**: Media & Reliability
* **The Tell**: Images failing to load or displaying broken image icons without an accessible error fallback.
* **Bad**: `<img src="/avatar.jpg" />` leaving an empty missing-image box when missing.
* **Fix**: Handle image loading failures gracefully with fallback avatars, background placeholders, and error handlers.

### 74. `missing-alt-text`
* **Name**: Missing or redundant image alt text
* **Category**: Accessibility
* **The Tell**: `<img>` tags missing the `alt` attribute, or using redundant placeholder text like `alt="image"` or `alt="screenshot"`.
* **Bad**: `<img src="/team.jpg" />` or `<img src="/team.jpg" alt="photo" />`.
* **Fix**: Provide descriptive, informative alt text describing the image content, or set `alt=""` with `aria-hidden="true"` if purely decorative.

### 75. `icon-without-label`
* **Name**: Icon-only button lacking accessible name
* **Category**: Accessibility
* **The Tell**: An interactive button containing only an SVG icon with no text content, aria-label, or title.
* **Bad**: `<button><svg>...</svg></button>`.
* **Fix**: Provide an accessible label: `<button aria-label="Close dialog"><svg>...</svg></button>`.
