---
name: git-ritual
description: 'Git workflow ritual: create a feature/fix branch, then commit changes in small, atomic, logically grouped bits. Use when starting work on a new feature, bug fix, refactor, or any change that should be versioned. Triggers: "git ritual", "new branch", "commit my changes", "start a feature", "stage and commit".'
argument-hint: 'Optional: describe what you are building (e.g. "add dark mode toggle")'
---

# Git Ritual

Opinionated workflow for structured, readable Git history:
one branch per feature/fix, commits grouped by logical concern.

## When to Use

- Starting any new feature, fix, or refactor
- When told to "commit the changes" or "apply the git ritual"
- Before opening a PR or merging into main

## Procedure

### 1. Name the Branch

Determine the branch name from the work at hand:
- `feat/<short-description>` — new capability or UI change
- `fix/<short-description>` — bug fix or regression
- `refactor/<short-description>` — internal restructure, no behaviour change
- `chore/<short-description>` — tooling, deps, config

Rules: lowercase, hyphens only, ≤ 40 chars. Example: `feat/dark-mode-toggle`.

Create the branch:

```bash
git checkout -b <branch-name>
```

### 2. Survey the Changes

Run `git status` and `git diff` to understand what has changed.
Group the changed files into **logical commits** — each commit should represent one coherent unit of work (e.g. "add model", "add route", "update frontend component").

Never stage everything as one blob commit unless the entire diff is genuinely one atomic unit.

### 3. Commit by Relevant Bits

For each logical group:

```bash
git add <file1> <file2> ...   # stage only the relevant files
git commit -m "<type>(<scope>): <imperative summary>"
```

Commit message conventions:
- Type: `feat`, `fix`, `refactor`, `style`, `test`, `chore`, `docs`
- Scope (optional): the module or layer affected, e.g. `(api)`, `(ui)`, `(db)`
- Summary: imperative mood, ≤ 72 chars, no trailing period
- Example: `feat(tickets): add priority field to ticket schema`

Repeat until `git status` shows nothing unstaged.

### 4. Verify

```bash
git log --oneline -10
```

Confirm the commits tell a clear story: each one self-contained and meaningful.

### 5. Stop — Do NOT Push

Leave pushing to the user. Never run `git push`.

## Decision Points

| Situation | Action |
|-----------|--------|
| Change touches two unrelated areas | Split into two commits |
| Trivial rename / formatting mixed with logic | Separate commit for each |
| Work is incomplete / in-progress | Commit with `wip:` prefix, note it |
| Already on a feature branch | Skip step 1, continue from step 2 |

## Quality Checks

- [ ] Branch follows `feat/`, `fix/`, `refactor/`, or `chore/` prefix
- [ ] No single commit contains unrelated changes
- [ ] Each commit message is imperative and descriptive
- [ ] `git status` is clean after all commits
- [ ] No `git push` was run
