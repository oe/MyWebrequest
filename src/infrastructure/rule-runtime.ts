import { compileDnrRule } from '@/domain/rules/compile-dnr';
import type { Rule, StoredState } from '@/domain/rules/model';

function hasExtensionRuntime(): boolean {
  return typeof browser !== 'undefined' && Boolean(browser.declarativeNetRequest && browser.permissions);
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

export async function reconcileDynamicRules(state: StoredState): Promise<void> {
  if (!hasExtensionRuntime()) return;

  const managedIds = Object.values(state.rules).map((rule) => rule.dnrId);
  const addRules: Browser.declarativeNetRequest.Rule[] = [];

  if (!state.settings.globallyPaused) {
    for (const id of state.order) {
      const rule = state.rules[id];
      if (!rule?.enabled || rule.migrationState !== 'none') continue;
      if (!(await hasRulePermission(rule))) continue;
      const compiled = compileDnrRule(rule);
      if (compiled.ok) addRules.push(compiled.rule as Browser.declarativeNetRequest.Rule);
    }
  }

  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: managedIds,
    addRules,
  });
}
