import { useEffect, useState } from 'react';

import type { Rule } from '@/domain/rules/model';
import type { MatchResult } from '@/domain/rules/test-match';
import type { SuggestedTestUrls } from '@/ui/rules/match-kind';

type Preview =
  | { status: 'pending' | 'timeout' | 'error' }
  | { status: 'ready'; result: MatchResult; suggestions: SuggestedTestUrls };

export function useMatchPreview(rule: Rule, url: string): Preview {
  const key = JSON.stringify([rule, url]);
  const [snapshot, setSnapshot] = useState<{ key: string; preview: Preview } | null>(null);
  useEffect(() => {
    let worker: Worker | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const delay = setTimeout(() => {
      const finish = (preview: Preview) => {
        clearTimeout(deadline);
        worker?.terminate();
        setSnapshot({ key, preview });
      };
      try {
        worker = new Worker(new URL('../workers/match-preview.worker.ts', import.meta.url), {
          type: 'module',
        });
        worker.onmessage = (event: MessageEvent<{ result: MatchResult; suggestions: SuggestedTestUrls }>) => {
          finish({ status: 'ready', ...event.data });
        };
        worker.onerror = () => finish({ status: 'error' });
        deadline = setTimeout(() => finish({ status: 'timeout' }), 1_500);
        worker.postMessage({ rule, url });
      } catch {
        finish({ status: 'error' });
      }
    }, 120);
    return () => {
      clearTimeout(delay);
      clearTimeout(deadline);
      worker?.terminate();
    };
  }, [key, rule, url]);
  // Never present the previous URL's result while the next calculation runs.
  return snapshot?.key === key ? snapshot.preview : { status: 'pending' };
}
