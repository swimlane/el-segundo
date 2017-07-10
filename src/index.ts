
const SEP = '/';
const REF = '#';
const NULL = Symbol('null');

/**
 * Returns true if its arguments are identical, false otherwise. Values are
 * identical if they reference the same memory. `NaN` is identical to `NaN`;
 * `0` and `-0` are not identical.
 *
 * from: https://github.com/ramda/ramda/blob/v0.24.1/src/identical.js
 *
 */

function identical(a: any, b: any): boolean {
  if (a === b) { // Steps 1-5, 7-10
    return true;
  }
  // NaN == NaN
  return a !== a && b !== b;
}

function matchesSnapshot(subject: any, snapshot: any, ignore: (key: string, value: any) => boolean): boolean {
  const seen = new WeakMap();
  return recurse(subject, REF);

  function recurse(s: any, path: string) {

    if (typeof s !== 'object') {
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

function generateSnapshot(subject: any, ignore?: (key: string, value: any) => boolean) {
  const seen = new WeakMap();
  const map = {};
  return recurse(subject, REF);

  function recurse(s: any, path: string) {
    if (typeof s !== 'object') {
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

function snapshotDiff(lhs, rhs): any[] {
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

const defultIgnore = (key: string, value: any) => value === undefined || key[0] === '$';

export class ElSegundo {
  /* istanbul ignore next  */
  static generateSnapshot(subject, _ignore = defultIgnore) {
    return generateSnapshot(subject, _ignore);
  }

  /* istanbul ignore next  */
  static matchesSnapshot(subject, snapshot, _ignore = defultIgnore) {
    return matchesSnapshot(subject, snapshot, _ignore);
  }

  private _snapshot: any;

  get map() {
    return this._snapshot;
  }

  constructor(map: any, opts?: any) {
    this._ignore = (opts && typeof opts.ignore !== 'undefined') ? opts.ignore : this._ignore;
    this.resetSnapshot(map);
  }

  resetSnapshot(map: any): void {
    this._snapshot = this.generateSnapshot(map);
  }

  generateSnapshot(subject): any {
    return generateSnapshot(subject, this._ignore);
  }

  matchesSnapshot(subject): boolean {
    return matchesSnapshot(subject, this._snapshot, this._ignore);
  }

  check(subject): boolean {
    return !this.matchesSnapshot(subject);
  }

  diff(subject): any[] {
    const snap = this.generateSnapshot(subject);
    return snapshotDiff(snap, this._snapshot);
  }

  private _ignore(key: string, value: any): boolean {
    return value === undefined || key[0] === '$';
  }
}
