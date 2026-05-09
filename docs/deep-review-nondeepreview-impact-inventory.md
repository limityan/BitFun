# Deep Review Refactor Non-DeepReview Impact Inventory

## Purpose

This inventory lists the shared areas touched by the current Deep Review work where future refactoring could affect non-DeepReview behavior. It supports the architecture rule that subagent runtime changes must not silently become Deep Review-specific or unexpectedly alter ordinary subagents.

## Current Shared Impact Areas

| Area | Current Deep Review change | Non-DeepReview risk | Required mitigation |
|---|---|---|---|
| `TaskTool` | Deep Review reviewer capacity queueing, effective concurrency learning, provider capacity skip conversion, structured retry admission, packet/cache lookup | Ordinary hidden subagents could accidentally enter queue/retry/cache behavior if context gating is wrong | Keep all Deep Review logic behind explicit agent type/manifest checks; add regression tests for ordinary Task calls. |
| `tool_pipeline.rs` | Propagates Deep Review context variables and records duplicate `Read`/`GetFileDiff` measurements | Generic tool execution can become feature-aware and harder to reuse | Extract propagation and measurement into a Deep Review hook; keep the pipeline generic. |
| `CodeReviewTool` | Deep Review packet metadata fallback, reliability signals, runtime diagnostics, incremental cache write-through | Standard Code Review reports could gain Deep Review-only reliability or cache behavior | Gate enrichments by Deep Review context and add standard Code Review regression tests. |
| `bitfun-events` / agentic events | Adds Deep Review queue state event payload | Event enum becomes increasingly domain-specific | Keep current event stable for compatibility; only design generic subagent queue events after product/API review. |
| Session metadata | Adds Deep Review run manifest and per-session cache fields | Session metadata can accumulate feature-specific blobs | Keep cache per-session, content-bounded, and absent for non-DeepReview sessions. |
| Review action bar store/component | Shared `ReviewActionBar` path now includes Deep Review queue and recovery affordances | Standard Code Review UI can inherit irrelevant Deep Review states | Split queue/recovery panels and render them only for `reviewMode === 'deep'`. |
| Report utilities | Shared code review report helpers render manifest/cache/token-budget sections | Standard Code Review exports can become noisy or show irrelevant Deep Review sections | Keep manifest sections optional and Deep Review-gated. |
| Review settings | Adds Deep Review capacity/retry settings under Review config | Users may confuse Deep Review reviewer concurrency with global subagent concurrency | Label settings as Review Team scoped; keep global `ai.subagent_max_concurrency` out of normal Review settings. |

## Safe Refactor Rules

1. Generic subagent runtime modules must not import Deep Review modules.
2. Deep Review adapters may import generic runtime modules.
3. Shared tools may call Deep Review adapters only after context gating.
4. Standard Code Review must continue to work without a Deep Review manifest.
5. Deep Review queue time must not become a global subagent timeout rule unless explicitly approved.
6. Provider capacity requeue must remain Deep Review-scoped until product confirms broader behavior.
7. Diagnostics must stay aggregate-only and content-free.

## Regression Tests To Keep Or Add

### Backend

- A normal `Task` tool call without `deep_review_run_manifest` does not apply Deep Review queue controls.
- A normal `Task` tool retry does not require Deep Review `retry_coverage`.
- Standard `CodeReviewTool` submission does not emit Deep Review packet metadata, cache hit/miss, or queue reliability signals.
- Deep Review queue events serialize with the existing stable event shape.
- Tool pipeline duplicate-read measurement ignores non-DeepReview `Read` and `GetFileDiff` calls.

### Frontend

- Standard Code Review action bar renders without capacity queue controls.
- Deep Review capacity queue controls render only when the store has Deep Review queue state.
- Standard Code Review markdown export omits Deep Review manifest/cache sections.
- Review settings copy distinguishes Review Team max reviewers from global subagent concurrency.

## Behavior Changes That Need User Confirmation

The following are not safe as pure refactors:

1. Applying Deep Review capacity queueing to all subagents.
2. Making provider transient errors auto-queue for ordinary subagents.
3. Replacing Deep Review-specific queue events with generic subagent queue events.
4. Persisting Deep Review cache at project level.
5. Auto-retrying reviewer packets without explicit structured coverage and budget guards.
6. Making backend strategy recommendations override user-selected strategy.

## Documentation Follow-Up

If any refactor round touches one of the shared areas above, update this document in the same commit with:

- the exact shared file touched;
- whether behavior changed or only ownership changed;
- the regression test that proves non-DeepReview behavior stayed stable;
- any product decision still required.
