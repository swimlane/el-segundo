
const SEP = '/';
const REF = '#';
const NULL = Symbol('null');

interface Snapshot {
  [path: string]: any;
}

type IgnoreFunction = (key: string, value: any) => boolean;

/**
 * Returns true if its arguments are identical, false otherwise. Values are
 * identical if they reference the same memory. `NaN` is identical to `NaN`;
 * `0` and `-0` are not identical.
 *
 * from: https://github.com/ramda/ramda/blob/v0.24.1/src/identical.js
 *
 */
function identical(a: any, b: any): boolean {
  if (a === b) return true;

  const dateA = a instanceof Date;
  const dateB = b instanceof Date;
  if (dateA !== dateB) return false;
  if (dateA && dateB) return a.getTime() === b.getTime();

  const regexpA = a instanceof RegExp;
  const regexpB = b instanceof RegExp;
  if (regexpA !== regexpB) return false;
  if (regexpA && regexpB) return a.toString() === b.toString();

  // NaN == NaN
  return a !== a && b !== b;
}

function matchesSnapshot(subject: any, snapshot: any, ignore: IgnoreFunction): boolean {
  const seen = new WeakMap();
  return recurse(subject, REF);

  function recurse(s: any, path: string) {

    if (typeof s !== 'object' || s instanceof Date || s instanceof RegExp) {
      return identical(s, snapshot[path]);
    }

    if (s === null) {
      return NULL === snapshot[path];
    }

    if (seen.has(s)) {
      return seen.get(s) === snapshot[path];
    }

    seen.set(s, path);
    let keys = Object.keys(s);
    if (ignore) {
      keys = keys.filter(key => !ignore(key, s[key]));
    }
    let index = keys.length;
    if (index !== snapshot[path]) return false;
    while (index--) {
      const k = keys[index];
      if (recurse(s[k], path + SEP + k) === false) return false;
    }

    return true;
  }
}

function generateSnapshot(subject: any, ignore?: IgnoreFunction): Snapshot {
  const seen = new WeakMap();
  const map = {};
  return recurse(subject, REF);

  function recurse(s: any, path: string) {
    if (typeof s !== 'object' || s instanceof Date || s instanceof RegExp) {
      return map[path] = s;
    }

    if (s === null) {
      return map[path] = NULL;
    }

    if (seen.has(s)) {
      return map[path] = seen.get(s);
    }

    seen.set(s, path);

    let keys = Object.keys(s);
    if (ignore) {
      keys = keys.filter(key => !ignore(key, s[key]));
    }
    let index = keys.length;
    map[path] = index;
    while (index--) {
      const key = keys[index];
      recurse(s[key], path + SEP + key);
    }
    return map;
  }
}

function snapshotDiff(lhs: object, rhs: object): any[] {
  const lkeys = Object.keys(lhs);
  const rkeys = Object.keys(rhs);
  const changes = Object.create(null);

  lkeys.forEach(k => {
    const other = rkeys.indexOf(k);
    if (other > -1) {
      rkeys.splice(other, 1);
      if (!identical(lhs[k], rhs[k])) {
        changes[k] = {
          is: lhs[k],
          was: rhs[k]
        };
      }
    } else {
      changes[k] = {
        is: lhs[k],
        was: undefined
      };
    }
  });
  rkeys.forEach(k => {
    changes[k] = {
      is: undefined,
      was: rhs[k]
    };
  });

  return changes;
}

const defultIgnore: IgnoreFunction = (key: string, value: any) => value === undefined || key[0] === '$';

export class ElSegundo {
  /* istanbul ignore next  */
  static generateSnapshot(subject: any, _ignore = defultIgnore): Snapshot {
    return generateSnapshot(subject, _ignore);
  }

  /* istanbul ignore next  */
  static matchesSnapshot(subject: any, snapshot: any, _ignore = defultIgnore): boolean {
    return matchesSnapshot(subject, snapshot, _ignore);
  }

  private _snapshot: Snapshot;

  get map(): Snapshot {
    return this._snapshot;
  }

  constructor(map: any, opts?: any) {
    this._ignore = (opts && typeof opts.ignore !== 'undefined') ? opts.ignore : this._ignore;
    this.resetSnapshot(map);
  }

  resetSnapshot(subject: any): void {
    this._snapshot = this.generateSnapshot(subject);
  }

  generateSnapshot(subject: any): Snapshot {
    return generateSnapshot(subject, this._ignore);
  }

  matchesSnapshot(subject: any): boolean {
    return matchesSnapshot(subject, this._snapshot, this._ignore);
  }

  check(subject: any): boolean {
    return !this.matchesSnapshot(subject);
  }

  diff(subject: any): any[] {
    const snap = this.generateSnapshot(subject);
    return snapshotDiff(snap, this._snapshot);
  }

  private _ignore(key: string, value: any): boolean {
    return value === undefined || key[0] === '$';
  }
}
