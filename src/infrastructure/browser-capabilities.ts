export function supportsLegacyMigration(targetBrowser = import.meta.env.BROWSER): boolean {
  return targetBrowser === 'chrome';
}
