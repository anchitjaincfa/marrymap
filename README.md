# Marrymap

A calm, approval-first planning cockpit for couples coordinating a wedding without a full-service planner.

**Live app:** deployment link will be added after Vercel completes the remote build.

## What this prototype does

- Turns a wedding plan into a focused weekly task board
- Tracks manual category commitments against a total budget
- Shows quote-comparison tradeoffs without claiming unsupported price verdicts
- Creates reviewable vendor-email drafts that require explicit approval
- Persists demo interactions in the current browser only

This is intentionally a front-end MVP. It stores no credentials, does not connect bank accounts or Gmail, does not upload contracts, and never sends email.

## Product wedge

Marrymap should not compete as a broad wedding checklist, registry, guest-list, website, or vendor marketplace. The first paid job is narrower:

> Turn existing vendor quotes, contracts, and scattered decisions into an approved, source-linked execution plan for a DIY wedding.

The demo represents the 90/10 version of that value: weekly coordination, budget commitments, decision comparison, and human-reviewed communication in one surface.

## Remote-only delivery

This repository was created and populated through the GitHub API. The application source was not cloned or built on the developer machine. Vercel will build from the public GitHub repository.

## Production path

See [the build strategy](docs/BUILD_STRATEGY.md) for the YC validation plan, multi-agent architecture, safety model, deployment phases, and sources.

## Validation

A GitHub Actions workflow verifies JavaScript syntax on every push and pull request. The application has no package dependencies or local build step.
