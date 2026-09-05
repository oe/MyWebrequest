import type { Rule } from '@/domain/rules/model';
import { matchRule } from '@/domain/rules/test-match';
import { suggestedTestUrls } from '@/ui/rules/match-kind';

self.addEventListener('message', (event: MessageEvent<{ rule: Rule; url: string }>) => {
  const { rule, url } = event.data;
  self.postMessage({
    result: matchRule(rule, url),
    suggestions: suggestedTestUrls(rule.condition.url.kind, rule.condition.url.value, url),
  });
});
