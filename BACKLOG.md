# Backlog

## Safe AI Signal Rebuild

- Add a server-side rebuild command for production, for example `pnpm rebuild:signals`, so long-running signal regeneration does not depend on browser, nginx, or HTTP timeouts.
- Add a rebuild lock/job status to prevent two rebuilds from deleting and recreating automatic signals at the same time.
- Show progress and final counts in the UI by reading job status instead of keeping a single long HTTP request open.
- Keep the current Settings script page as an admin trigger, but make it start a background job and clearly show running/failed/completed states.
