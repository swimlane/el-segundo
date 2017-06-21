
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

function identical (a, b) {
  if (a === b) { // Steps 1-5, 7-10
    return true;
  }
  // NaN == NaN
  return a !== a && b !== b;
}

function matchesSnapshot (subject: any, snapshot: any, ignore: Function): boolean {
  const seen = new WeakMap();
  return recurse(subject, REF);

  function recurse (subject: any, path: string) {

    if (typeof subject !== 'object') {
      return identical(subject, snapshot[path]);
    }

    if (subject === null) {
      return NULL === snapshot[path];
    }

    if (seen.has(subject)) {
      return seen.get(subject) === snapshot[path];
    }

    seen.set(subject, path);
    let keys = Object.keys(subject);
    if (ignore) {
      keys = keys.filter(key => !ignore(key));
    }
    let index = keys.length;
    if (index !== snapshot[path]) return false;
    while (index--) {
      let key = keys[index];
      if (recurse(subject[key], path + SEP + key) === false) return false;
    }

    return true;
  }
}

function generateSnapshot (subject, ignore?) {
  const seen = new WeakMap();
  const map = {};
  return recurse(subject, REF);

  function recurse (subject: any, path: string) {
    if (typeof subject !== 'object') {
      return map[path] = subject;
    }

    if (subject === null) {
      return map[path] = NULL;
    }

    if (seen.has(subject)) {
      return map[path] = seen.get(subject);
    }

    seen.set(subject, path);
    let keys = Object.keys(subject);
    if (ignore) {
      keys = keys.filter(key => !ignore(key));
    }
    let index = keys.length;
    map[path] = index;
    while (index--) {
      let key = keys[index];
      recurse(subject[key], path + SEP + key);
    }
    return map;
  }
}

function snapshotDiff (lhs, rhs): Object[] {
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

export class ElSegundo {
  private _snapshot: any;

  get map () {
    return this._snapshot;
  }

  constructor (map: any, opts?: any) {
    this._ignore = (opts && typeof opts.ignore !== 'undefined') ? opts.ignore : this._ignore;
    this.resetSnapshot(map);
  }

  static generateSnapshot (subject, _ignore = key => key[0] === '$') {
    return generateSnapshot(subject, _ignore);
  }

  static matchesSnapshot (subject, snapshot, _ignore = key => key[0] === '$') {
    return matchesSnapshot(subject, snapshot, _ignore);
  }

  resetSnapshot (map: any): void {
    this._snapshot = this.generateSnapshot(map);
  }

  generateSnapshot (subject): Object {
    return generateSnapshot(subject, this._ignore);
  }

  matchesSnapshot (subject): boolean {
    return matchesSnapshot(subject, this._snapshot, this._ignore);
  }

  check (subject): boolean {
    return !this.matchesSnapshot(subject);
  }

  diff (subject): Object[] {
    const snap = this.generateSnapshot(subject);
    return snapshotDiff(snap, this._snapshot);
  }

  private _ignore (key) {
    return key[0] === '$';
  }
}
