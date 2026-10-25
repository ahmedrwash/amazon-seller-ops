// Auth notifications run under the SDK session lock. Defer database hydration.
export function createAuthEventScheduler(hydrate, onError) {
  let active = true, revision = 0, timer;
  return {
    enqueue(session) {
      const current = ++revision;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const isCurrent = () => active && current === revision;
        if (isCurrent()) Promise.resolve().then(() => hydrate(session, isCurrent)).catch(error => { if (isCurrent()) onError(error); });
      }, 0);
    },
    dispose() { active = false; revision++; clearTimeout(timer); },
  };
}
