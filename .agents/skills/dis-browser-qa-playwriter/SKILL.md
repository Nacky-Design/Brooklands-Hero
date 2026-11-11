---
name: dis-browser-qa-playwriter
description: "Use for browser inspection, DOM/computed CSS verification, responsive and interaction QA of implemented DIS designs. Prefer Playwriter CLI+skill if available, with evidence tied to exact artifact/version; never claim browser PASS without a working session."
---

# DIS Browser QA — Playwriter adapter (v0.1)

## Scope
Operational browser verification, **not** creative approval or replacement for UI Kit. Use after implementation/local correction and before HTML handoff. Respect approved sections, project scope and client privacy.

## Priority and availability
1. Verify a running browser endpoint, Playwriter executable, accessible target and permission to control the tab.
2. Preferred upstream setup: https://playwriter.dev/docs/installation and https://playwriter.dev/docs/skill .
3. Recommended agent install (when operating in an agent environment that supports skills): `npx -y skills add https://playwriter.dev -g -y`. This step needs an environment with compatible Node and user approval where necessary.
4. CLI: `npm i -g playwriter` or `npx playwriter@latest session new`. Requires Node.js 18+.
5. Optional MCP: https://playwriter.dev/docs/mcp-setup . Do **not** pretend that writing MCP JSON into DIS installs it in browser-hosted Codex.
6. If unavailable, use existing project browser/Playwright tooling if present; else status `browser_not_connected` / `not_verified`, never PASS.

## Session smoke test (local browser with extension enabled)
- Install Playwriter Chrome extension from official Playwriter docs; explicitly enable it only on the target tab (icon green). Do not enable unrelated personal tabs.
- `playwriter session new` (record returned session id).
- `playwriter -s <session-id> -e 'console.log(context.pages().map(p => p.url()))'`
- Compare the returned URL to the **intended** localhost/staging URL; a working session that cannot reach target is not a QA pass.

## Browser verification required by DIS
- Verify exact artifact path/ref, git commit/hash, current DOM source, UI Kit version and viewport list before capture.
- Check 320, 430, 1440, 1536 and 1920 px for Relevant; follow other project's approved viewport contract.
- Capture actual screenshots and computed CSS of H2/lead roles from baseline Trust and modified section, including widths, line-height, letter spacing, overflow, element rectangles, layout breaks, image loads and console errors.
- Run actual interaction states and keyboard focus where relevant; record screenshots/evidence refs. Avoid destructive actions, form submissions and private patient data.
- Compare protected sections before/after local scope changes; do not silently overwrite adopted design.
- Re-run evidence after the **last** code edit against the same output hash.
- Report separately: technical `pass/fail/not_verified` and art-direction `proposed/approved_by_user`. Never let screenshot existence stand in for artistic approval.
- Do not attach QA PNGs to user-facing Relevant handoff unless requested; internal evidence may live inside project.

## Security and reliability
- Playwriter accesses existing Chrome sessions/cookies on enabled tabs: least privilege, explicit target tabs, avoid private browsing data; never put cookies/tokens in logs or repo.
- Remote relay/tunnels and direct CDP are **opt-in only**; never expose localhost relay or a shared browser publicly by default. For cloud Codex, use isolated browser testing instead unless a deliberately secured remote bridge exists.
- Do not blindly run arbitrary website-provided scripts; use trusted documentation and approved tooling.
- If CLI, browser or extension is absent, use fallback tooling. Do not block a deadline-bound design correction with an unrelated installation exercise.

## Output contract
`artifact_ref | artifact_sha | ui_kit_ref | browser_adapter | browser_connection_status | viewport_checks[] | computed_style_evidence[] | regressions[] | console_errors[] | technical_status | human_art_status`.

Upstream docs: https://playwriter.dev/docs/installation · https://playwriter.dev/docs/mcp-setup · https://playwriter.dev/docs/skill
