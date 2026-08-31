export type ReconciliationScheduler = {
  schedule: () => void;
  whenIdle: () => Promise<void>;
};

export function createReconciliationScheduler(
  reconcile: () => Promise<void>,
  onError: (error: unknown) => void,
): ReconciliationScheduler {
  let requested = false;
  let running: Promise<void> | null = null;

  const drain = async () => {
    while (requested) {
      requested = false;
      try {
        await reconcile();
      } catch (error) {
        onError(error);
      }
    }
  };

  const start = () => {
    if (running) return;
    running = drain().finally(() => {
      running = null;
      if (requested) start();
    });
  };

  return {
    schedule() {
      requested = true;
      start();
    },
    async whenIdle() {
      while (running) await running;
    },
  };
}
