// A necessary literal prefix only narrows candidates; the original matcher is
// always the final authority. Unanchored patterns stay in the root bucket.
export class PrefixIndex<T> {
  private root: { values: T[]; children: Map<string, PrefixIndex<T>['root']> } = {
    values: [],
    children: new Map(),
  };
  add(prefix: string, value: T): void {
    let node = this.root;
    for (const character of prefix) {
      let child = node.children.get(character);
      if (!child) {
        child = { values: [], children: new Map() };
        node.children.set(character, child);
      }
      node = child;
    }
    node.values.push(value);
  }
  candidates(value: string): T[] {
    let node = this.root;
    const result = [...node.values];
    for (const character of value) {
      const child = node.children.get(character);
      if (!child) break;
      node = child;
      result.push(...node.values);
    }
    return result;
  }
}
