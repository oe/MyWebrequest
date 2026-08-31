import { compileDnrRule } from '@/domain/rules/compile-dnr';
import type { Rule, StoredState } from '@/domain/rules/model';
import { wildcardToRegExpSource } from '@/domain/rules/test-match';

function hasExtensionRuntime(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.declarativeNetRequest && browser.permissions);
}

type PermissionChangeListener = () => void;

export type RegexSupportResult = {
  isSupported: boolean;
  reason?: string;
};

export async function checkRuleRegexSupport(rule: Rule): Promise<RegexSupportResult> {
  if (rule.condition.url.kind === 'url-filter') return { isSupported: true };
  if (!hasExtensionRuntime() || !browser.declarativeNetRequest.isRegexSupported) {
    return { isSupported: true };
  }

  const regex =
    rule.condition.url.kind === 'wildcard'
      ? wildcardToRegExpSource(rule.condition.url.value)
      : rule.condition.url.value;
  const result = await browser.declarativeNetRequest.isRegexSupported({ regex });
  return result.isSupported
    ? { isSupported: true }
    : { isSupported: false, reason: result.reason ?? 'unsupportedSyntax' };
}

export async function hasRulePermission(rule: Rule): Promise<boolean> {
  if (!hasExtensionRuntime()) return true;
  if (rule.permissionOrigins.length === 0) return true;
  return browser.permissions.contains({ origins: rule.permissionOrigins });
}

export async function requestRulePermission(rule: Rule): Promise<boolean> {
  if (!hasExtensionRuntime()) return true;
  if (rule.permissionOrigins.length === 0) return true;
  return browser.permissions.request({ origins: rule.permissionOrigins });
}

export function subscribeToPermissionChanges(listener: PermissionChangeListener): () => void {
  if (!hasExtensionRuntime()) return () => undefined;

  const handleChange = () => listener();
  browser.permissions.onAdded.addListener(handleChange);
  browser.permissions.onRemoved.addListener(handleChange);

  return () => {
    browser.permissions.onAdded.removeListener(handleChange);
    browser.permissions.onRemoved.removeListener(handleChange);
  };
}

export async function getInstalledDynamicRuleIds(): Promise<Set<number> | null> {
  if (!hasExtensionRuntime()) return null;
  const installedRules = await browser.declarativeNetRequest.getDynamicRules();
  return new Set(installedRules.map((rule) => rule.id));
}

export async function reconcileDynamicRules(state: StoredState): Promise<void> {
  if (!hasExtensionRuntime()) return;

  const installedRules = await browser.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = installedRules.map((rule) => rule.id);
  let addRules: Browser.declarativeNetRequest.Rule[] = [];

  if (!state.settings.globallyPaused) {
    const candidates = state.order.flatMap((id) => {
      const rule = state.rules[id];
      return rule?.enabled && rule.migrationState === 'none' ? [rule] : [];
    });
    const compiled = await Promise.all(
      candidates.map(async (rule) => {
        const regexSupport = await checkRuleRegexSupport(rule);
        if (!regexSupport.isSupported) return null;
        if (!(await hasRulePermission(rule))) return null;
        const result = compileDnrRule(rule);
        return result.ok ? (result.rule as Browser.declarativeNetRequest.Rule) : null;
      }),
    );
    addRules = compiled.filter((rule): rule is Browser.declarativeNetRequest.Rule => rule !== null);
  }

  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });
}
