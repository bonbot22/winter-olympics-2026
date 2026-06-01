# CLAUDE.md

## Working style
- Do not explain what you're about to do — just do it
- Do not summarise what you just did after completing a task
- Do not ask clarifying questions unless something is genuinely ambiguous
- Do not add comments to code unless logic is non-obvious
- Prefer editing existing files over creating new ones
- When a task is complete, output only the file path(s) changed

## This project
- Spec is in WINTER_OLYMPICS_2026_SPEC.md — treat it as source of truth
- Stack: React + Vite + Firebase Firestore + plain CSS (no component libraries)
- Fonts: Bebas Neue (headings) + DM Sans (body) via Google Fonts
- No TypeScript, no tests, no Storybook
- Do not install dependencies not listed in the spec

## Code style
- Functional components only
- No default exports wrapped in extra named exports
- Keep components under 200 lines — split if longer
- CSS in index.css using CSS variables from the spec
