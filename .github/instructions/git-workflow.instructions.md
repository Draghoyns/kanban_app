---
description: "Use when developing features, creating branches, committing changes, or merging code. Enforces the review-before-merge git workflow: finish feature on branch, wait for user approval before squash-merging to main."
---
# Git Workflow — Review Before Merge

## Core Rule

**Never squash-merge a branch to main without explicit user approval.**

The user must be able to test each feature on its branch before it lands on main. Merging without being asked is a breaking workflow violation.

## Feature Branch Lifecycle

1. **Create branch** — one branch per feature/fix (`feat/<name>`, `fix/<name>`)
2. **Develop & commit** — atomic commits on the branch (git ritual #1)
3. **Stop** — when the feature is complete, commit it and **stop**. Do not merge.
4. **Inform the user** — state clearly that the branch is ready for review and testing
5. **Wait** — do not touch main, do not merge, do not proceed to the next feature automatically
6. **User approves** — only when the user explicitly says to merge (e.g. "merge", "looks good, merge it", "squash merge") do you run the git-merge skill
7. **Then move on** — after a confirmed merge, you may create the next feature branch if more work remains

## When Multiple Features Are Planned

- Work through them **one at a time**: create branch → develop → commit → stop and present for review
- Do **not** batch-merge at the end of a session without per-feature approval
- Each feature must be individually reviewed and approved before its merge

## What "Complete" Means

A branch is complete when:
- All code changes are committed
- No compile/lint errors (`get_errors` passes)
- `just sync` builds successfully (`tsc && vite build` exits 0) — run it and verify
- `just android` builds successfully — run it and verify
- If either command fails, troubleshoot and fix on the same branch before declaring done
- The user has been told the feature is ready to test

## Merge Command

Only run this when the user explicitly approves:

```bash
git checkout main && git pull
git merge --squash <branch>
git commit -m "<type>(<scope>): <summary>"
git branch -d <branch>
```

## Scope

This rule applies to **all branch types** — features, fixes, refactors, chores. There are no exceptions for "small" or "urgent" changes. Every branch requires explicit approval before merging.

## Anti-Patterns — Never Do These

- Merging a branch immediately after finishing development without asking
- Asking "should I merge?" and treating silence as approval
- Merging multiple branches in one go unless each was individually approved
- Squash-merging from the feature branch directly (always switch to main first)
- Treating a fix as too small to need review — size is irrelevant
