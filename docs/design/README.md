# Agent Studio redesign: "Sky"

This folder is the spec for the new Agent Studio UI. Build from it; when in doubt, open the matching file in `reference/` and copy what it does.

## What's in here

| Path | What it is |
|---|---|
| `README.md` | This spec: look, rules, components, pages, copy. |
| `tokens.css` | Colors, radii, fonts, motion and the liquid-glass recipe as CSS variables. |
| `assets/sky-clouds.*` | Hero photo (blue sky, warm sunset clouds). Hero, pricing "Free" card header, closing banner, sign-in art. |
| `assets/sky-dusk.*` | Dusk gradient photo. Background behind the chat, approval card, FAQ, integrations section, app page headers. |
| `assets/logo-mark.svg` | Temporary logo mark (two nodes joined by a bar). White tile, dark glyph. A real mascot/logo comes later. |
| `reference/design-system.dc.html` | Every component, rendered, with states. The source of truth for look and behavior. |
| `reference/landing.dc.html` and the other `*.dc.html` | The five pages: landing, sign-in, agents, chat, integrations. |
| `reference/sky.css` | All the CSS used by the reference pages. Plain CSS, copy freely. |

**About the `.dc.html` files:** they are prototypes from a design canvas, not React. Markup is normal HTML with a few template bits: `{{name}}` is a value from state, `<sc-for list=...>` is a loop, `<sc-if value=...>` is a conditional, and the `<script type="text/x-dc">` block at the bottom holds the state and timers. Read them for structure, classes, copy, timings and behavior; rebuild them as React components.

## The look in one paragraph

White on night (`#0a0e14`). Liquid glass with a thin white outline on almost everything that floats. Every button, chip, input and badge is a rounded pill. All the warm and blue color comes from the two photos; in the UI those colors only appear as soft glows. Headlines in Inter Tight 500 with tight tracking, and one accent phrase per headline in Instrument Serif italic ("Describe an agent. *Watch it work.*"). Body in Inter. No numbering on steps, features or FAQ items.

## Rules

1. **Buttons are pills.** White pill with dark text (`#0a0e14`), or glass pill with a thin white outline and white text. Never white text on a white button.
2. **Liquid metal is a frame, not a fill.** The liquid-metal button has a metallic animated border only; the inside is dark glass with white text. Use it at most once per page.
3. **Glass needs something behind it.** Put glass on the photos or on blurred photo areas. On flat night backgrounds use the solid panels (`--sky-night-2`).
4. **Color stays in the photos.** No colored buttons, no gradient text, no purple. The only UI accents are the soft warm/blue glow around the prompt box and the halo toggle.
5. **No numbers** on how-it-works steps, features or FAQ questions.
6. **Motion is calm.** Blur-fade on load and on scroll; nothing bounces. Everything respects `prefers-reduced-motion`.
7. **Icons:** lucide-react, 1.7px stroke. Integrations use each service's real brand logo (the references use generic icons as stand-ins).
8. **Placeholders to fill:** `[NUMBER]` (integration count), `[MONTHLY CREDITS]`, `[PRICE]`, `[PRO DETAILS]`. Do not invent these numbers; leave them as obvious TODOs if unknown.

## Components (install the 21st.dev ones, then restyle to the Sky look)

| UI piece | Install | Sky changes |
|---|---|---|
| Navbar | `npx shadcn@latest add "https://21st.dev/r/larsen66/navigation-menu"` | Glass pill bar. Logo left, links centered (Product dropdown with Builder, Workflows, Integrations, Approvals), Sign in (ghost) + Start free (white pill) right. Dropdown is a glass panel, 2 columns. |
| Hero | custom | Full-bleed `sky-clouds` photo, dark top/bottom fade. Eyebrow, headline, lead, prompt box, chips, all blur-faded in sequence. |
| AI prompt box | `npx shadcn@latest add "https://21st.dev/r/jahed/ai-prompt-box"` | Dark glass box, radius 28. A soft conic glow (warm, blue, ember, white) blurred 30px behind it, slowly rotating (9s). Toggles are outline pills; on = white outline + faint warm glow. Send = white circle. |
| Suggestion chips | custom | Rounded pills, white outline at 70%, liquid glass fill. |
| Browser mockup | custom | Only the frame is glass (10px glass border around a dark screen). |
| How it works | `npx shadcn@latest add "https://21st.dev/r/dillionverma/blur-fade"` + `npx shadcn@latest add "https://21st.dev/r/dillionverma/animated-beam"` | Three step rows, each blur-fades in on scroll and then plays its own animation: (1) Describe it: the prompt types itself; (2) Connect your tools: animated beams from 6 app circles into the agent. Circles are **solid** (`--sky-night-3`) so beams start at their edge and are not visible behind them; (3) Approve: the approval card loops waiting → Approve pressed → "Approved, sending…" → "Sent to Dana". Text and art alternate sides. |
| Feature grid | `npx shadcn@latest add "https://21st.dev/r/manuarora700/feature-section-with-hover-effects"` | 4×2, white text, no numbers. Hover: left bar grows and turns white, title slides 8px, soft gradient fill. |
| Integrations | `npx shadcn@latest add "https://21st.dev/r/meschacirung/integrations-3"` | Keep the component exactly (honeycomb of 7 tiles 2-3-2, center tile raised with our logo, outer tiles fade at the edges; heading, text and white "Get started" pill on the right). Only the icons change: every 2s the six outer icons fade out (scale .8, blur) and the next tools fade in, staggered 60ms, cycling through the full integrations list. |
| Pricing cards | `npx shadcn@latest add "https://21st.dev/r/efferd/pricing-card"` | Glass cards. Free card header shows the `sky-clouds` photo behind "Free / $0". Pro card: "Coming soon", disabled. |
| FAQ | `npx shadcn@latest add "https://21st.dev/r/dhileepkumargm/habit-faq-scroller"` | On the dusk photo. Big questions left (inactive at 45% white), answer in a glass panel right with a progress bar. Auto-advances every 6s; clicking a question jumps and restarts the timer. |
| Closing CTA | custom | Glass frame (12px) around the `sky-clouds` photo blurred 14px. Headline with serif accent, white pill "Create an agent" (dark text) + glass "View on GitHub". |
| Footer | `npx shadcn@latest add "https://21st.dev/r/arihantcodes_1f7b8c4d/stacked-circular-footer"` | Round glass ring with the logo, links row, round social icons, glass email pill with white Subscribe, copyright. |
| Chat window | custom | Glass panel on the dusk photo. User bubbles white with dark text; agent bubbles dark glass. |
| Approval card | custom | Glass. Status dot + "Waiting for your approval", expiry badge, tool row, message preview, Deny (glass) / Approve (white). |
| Segmented control | `npx shadcn@latest add "https://21st.dev/r/cult-ui/halo-toggle-group"` | Glass track; active item has a white outline and a white + warm halo that slides with a slight spring. |
| Buttons | `npx shadcn@latest add "https://21st.dev/r/xubohuah/flow-button"` (most CTAs) and `npx shadcn@latest add "https://21st.dev/r/johuniq/liquid-metal-button"` (once per page, frame only) | See rules 1–2. |
| Thinking indicator | `npx shadcn@latest add "https://21st.dev/r/larsen66/thinking-orbs"` | Small orb (warm, blue, white) + shimmering "Working on it" + step count + chevron. Expands to the agent loop trace: each step with a check (done) or spinner (current) and the tool used ("Gmail: search"). Wire it to real agent loop events. |
| Status dots | `npx shadcn@latest add "https://21st.dev/r/edwinvakayil/status-dot"` | Live (green, pulsing), Needs approval (amber, pulsing), Disconnected (coral), Idle (grey). Inside glass badges. |
| Icon tiles | `npx shadcn@latest add "https://21st.dev/r/shadcnspace/social-icon"` | Round glass icons; hover fills white with dark icon and lifts 3px. |
| Search | `npx shadcn@latest add "https://21st.dev/r/moumensoliman/expanding-search-dock-shadcnui"` | Round glass button that expands to a 420px pill input. |
| Spinner | `npx shadcn@latest add "https://21st.dev/r/theshanelevine/loading-state"` | Use only the ring spinner, no text. |
| Fade in | `npx shadcn@latest add "https://21st.dev/r/dillionverma/blur-fade"` | blur 8px → 0, y 10px → 0, 0.8s, 120ms stagger. |

## Pages

### Landing (`/`, logged out) — `reference/landing.dc.html`
Order: navbar over hero → hero → browser mockup overlapping the hero bottom (agent list sidebar + live chat with thinking trace on the dusk photo) → How it works → Features → Integrations → Pricing → FAQ → Closing CTA → Footer. Section headings: small uppercase eyebrow, 60px Inter Tight headline with an Instrument Serif italic accent.

### Sign in (`/auth/signin`) — `reference/sign-in.dc.html`
Split screen. Left: `sky-clouds` in a rounded frame with logo and a glass quote card. Right: "Welcome *back*", email and password pill inputs (password show/hide), white "Sign in" pill, "Or continue with", Google and GitHub glass pills, "Create an account" link. Apply the same shell to sign up, forgot/reset password, verify email.

### Your agents (`/agents`) — `reference/agents.dc.html`
App top bar (logo, Builder / Agents / Workflows / Integrations pills, expanding search, account button). Header band on the dusk photo with "Your *agents*", halo toggle (All / Active / Scheduled / Drafts) and white "New agent". Grid of glass agent cards (avatar, name, 2-line prompt, date, message count badge, share/delete) plus a dashed "Describe a new agent" card.

### Agent chat (`/chat/:id`) — `reference/chat.dc.html`
Left sidebar (New agent + agent list). Main area on the dusk photo: glass header (agent, status, Gmail connected badge, reset memory, share, settings), thread with bubbles, the expandable thinking trace, the approval card, and a glass composer at the bottom.

### Integrations (`/integrations`) — `reference/integrations.dc.html`
Header band with counts and category chips (active chip = white). "Connected" and "Not connected" groups of glass cards: logo, badge, name, description, View details + Connect (white) or Disconnect (glass).

The rest of the app (workflows, settings, modals, public chat, error pages) follows the same parts: app top bar, dusk header band, glass cards on night, pills everywhere.

## Copy (use as written)
- Hero: eyebrow "Open-source agent builder"; headline "Describe an agent. *Watch it work.*"; lead "Write one sentence. Agent Studio picks the tools, reads your files, runs on a schedule, and asks before it sends anything for you."
- Chips: "Summarize my inbox every morning", "Plan my week from my calendar", "Answer customers on WhatsApp".
- How it works: "Describe it", "Connect your tools", "Approve and let it run" (body text in the reference).
- Closing: "Your first agent is *one sentence away.*"
- FAQ questions and answers: in `reference/landing.dc.html`.
