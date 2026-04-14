---
name: git-merge
description: 'Git merge ritual: verify the feature branch was pushed by the user, then squash-merge it into main and delete the branch. Use after finishing development and committing all changes. Triggers: "git merge", "merge the branch", "merge into main", "finish the feature", "git ritual 2", "squash merge".'
argument-hint: 'Optional: name of the feature branch to merge (defaults to current branch)'
---

# Git Merge Ritual

Second phase of the git workflow: verify the branch is pushed, then
squash-merge into main so the history stays clean and linear.

`merge` always means `git merge --squash` — never a regular merge.

## When to Use

- Development is done and all commits are in place (git ritual #1 complete)
- The user has pushed the branch (or you need to remind them to)
- Ready to land the feature/fix into `main`

## Procedure

### 1. Confirm You Are on a Feature Branch

```bash
git branch --show-current
```

If the result is `main` (or `master`), stop and ask the user which branch to merge.

### 2. Check Push Status

```bash
git log --oneline origin/main..HEAD
```

- **No output** → branch is fully pushed. Proceed.
- **Commits listed** → branch has unpushed commits. **Stop and inform the user:**

  > "The following commits have not been pushed yet: [list]. Please push the branch before merging (`git push -u origin <branch>`), then re-invoke this skill."

  Do NOT push on behalf of the user. Wait for confirmation before proceeding past this step.

### 3. Record the Branch Name

```bash
BRANCH=$(git branch --show-current)
```

Keep this for the merge command and cleanup step.

### 4. Switch to Main and Pull

```bash
git checkout main
git pull
```

Ensure `main` is up to date before merging.

### 5. Squash Merge

```bash
git merge --squash "$BRANCH"
```

This stages all branch changes as a single set of modifications without committing yet.

### 6. Commit the Squash

Write a single, descriptive commit message that summarises the whole feature:

```bash
git commit -m "<type>(<scope>): <summary of the entire feature>"
```

Message rules:
- Same `feat/fix/refactor/chore` type as the branch prefix
- Imperative mood, ≤ 72 chars
- Example: `feat(tickets): add priority field with filter support`

### 7. Verify

```bash
git log --oneline -5
```

Confirm the squash commit appears on `main` with the correct message.

### 8. Delete the Feature Branch

```bash
git branch -d "$BRANCH"
```

The branch is now merged; delete it locally to keep the repo tidy.
Remote branch cleanup is left to the user.

## Decision Points

| Situation | Action |
|-----------|--------|
| Unpushed commits detected | Stop, list them, ask user to push first |
| Currently on `main` | Stop, ask which branch to merge |
| `wip:` commits found in branch log | Warn user before proceeding — branch may not be ready |
| Merge conflict after `--squash` | Resolve conflicts, then `git commit` manually |
| Branch already deleted remotely | `-d` will still work; skip remote cleanup message |

## Quality Checks

- [ ] Was on a feature/fix branch, not `main`
- [ ] `git log origin/main..HEAD` showed no output before merging
- [ ] Squash commit message is descriptive and typed correctly
- [ ] `git log --oneline -5` shows a clean single commit on `main`
- [ ] Feature branch deleted locally
- [ ] `git push` was NOT run — user handles that
