# Prompt for Claude Code: Agent Studio "Sky" redesign

You're redesigning the Agent Studio frontend (`frontend/`). The full spec, assets and clickable reference pages are in `docs/design/`. Read `docs/design/README.md` first, then open the files in `docs/design/reference/` as you build each part.

## 0. Branches (do this first, stop and tell me if anything goes wrong)

1. Make sure the current branch `fix/agent-loop` has no uncommitted changes. If it does, stop and ask me whether to commit or stash them.
2. `git fetch origin`
3. `git checkout main && git pull origin main`
4. `git checkout -b staging`
5. `git merge fix/agent-loop` (no fast-forward needed; a normal merge is fine). If there are conflicts, stop and show them to me. Don't resolve them on your own.
6. `git push -u origin staging`
7. `git checkout -b feat/sky-redesign`
8. Work only on `feat/sky-redesign` from here on.

## 1. Look before you build

- Find out the frontend stack: framework and router, Tailwind version (v3 config file or v4 `@theme`), whether shadcn/ui is set up (`components.json`), the icon library, and how toasts work.
- If shadcn isn't set up, set it up so the `npx shadcn@latest add "https://21st.dev/r/..."` commands in the README work.
- List the existing pages and shared components you'll replace, and tell me your plan (short) before writing code.

## 2. Foundations

- Copy `docs/design/assets/*` into the frontend's public/static folder.
- Add the fonts: Inter, Inter Tight, Instrument Serif (italic).
- Add `docs/design/tokens.css` to the global styles and map the tokens into Tailwind's theme so components use names, not raw hex values.
- The Sky design is dark only.

## 3. Components

Install each 21st.dev component listed in the README's component table, then restyle it to the Sky rules (pills, white or glass buttons, liquid glass with a thin white outline, color only from the photos). Put shared pieces in one place so pages reuse them. Match the behavior in `reference/design-system.dc.html` (timings, hover states, the integrations icon rotation, the FAQ auto-advance, the expandable thinking trace).

## 4. Pages, in this order

1. Landing (`/` and `/builder` when logged out)
2. Sign in, then the other auth pages using the same shell
3. Your agents (`/agents`)
4. Agent chat (`/chat/:id`): wire the thinking-orbs trace to the real agent loop events and the approval card to the real approval flow
5. Integrations (`/integrations`)
6. Then the rest of the app (workflows, settings, modals, public chat, error and loading pages) using the same parts

Keep every page's existing data fetching, API calls and logic. This is a visual redesign: don't change backend code or the agent loop.

## Rules

- Follow `docs/design/README.md`. When the README and a reference page disagree, the README wins.
- No white text on white buttons. No numbering on steps, features or FAQ. Liquid metal button: frame only, at most once per page.
- Leave `[NUMBER]`, `[MONTHLY CREDITS]`, `[PRICE]`, `[PRO DETAILS]` as visible TODOs. Don't invent numbers.
- Every animation respects `prefers-reduced-motion`. Keep keyboard focus visible, and give icon-only buttons labels.
- Works on mobile (375px) and desktop.
- Commit after each component group and each page with clear messages. Run the build and linter before each commit.
- When a page is done, compare it with its reference file (screenshots if you can) and fix the differences before moving on.
- At the end, push `feat/sky-redesign` and give me a short summary: what's done, what's left, and any decisions you made.
