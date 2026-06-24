# Contributing to Hatch

Hatch is open source and community-driven. The skills are the product -- the better they are, the more useful Hatch becomes.

## What to contribute

### New skills

If there's a contract pattern, audit concern, or deployment step that Hatch doesn't cover, add a skill for it.

Good candidates:
- Contract patterns (lending, perpetuals, prediction markets, etc.)
- Audit patterns (specific vulnerability classes)
- New chains (if Base expands, or L3s on Base)
- New frontend patterns (new Farcaster SDK features, etc.)

### Improve existing skills

The questionnaire, dispatcher, and architecture skills especially benefit from iteration. If you find a case where the questions were wrong, the routing was off, or the output wasn't what a user needed -- fix it and open a PR.

### Bug fixes

If `hatch install` breaks on a specific OS or tool version, a fix is very welcome.

## Skill format

Skills are markdown files. They should:

- State their purpose clearly at the top
- Be written as instructions to an AI, not to a human
- Be specific and actionable (no vague advice)
- Include code examples where relevant
- Be testable (you should be able to follow the skill yourself and get a good result)

## PR checklist

- [ ] Skill file is in the right directory under `skills/`
- [ ] Skill is added to the manifest in `src/installer/install.js`
- [ ] README updated if a new category was added
- [ ] Tested in at least one AI tool (Claude Code, Cursor, or Codex)

## License

By contributing, you agree your contributions are MIT licensed.
