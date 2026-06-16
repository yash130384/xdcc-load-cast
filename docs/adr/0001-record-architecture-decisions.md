# ADR-0001: Record Architecture Decisions

**Status:** Accepted  
**Date:** 2026-06-16  
**Deciders:** Project maintainer

## Context

Architecture decisions have been made informally. As the codebase grows, future contributors (including AI agents) need to understand why certain choices were made without re-litigating them.

## Decision

We will use Architecture Decision Records (ADRs) to document all significant architecture decisions, following the format described by Michael Nygard (http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions).

Each ADR will include:
- **Title** and unique number
- **Status** (Proposed, Accepted, Deprecated, Superseded)
- **Context** — the forces at play and the problem being solved
- **Decision** — the choice made
- **Consequences** — trade-offs and implications

## Consequences

- Positive: Decisions are documented and searchable
- Positive: New contributors can understand past trade-offs quickly
- Positive: AI agents can respect previously made decisions
- Negative: Maintenance overhead of keeping ADRs current