const SEP = '/';
const REF = '#';
const NULL = Symbol('null');

type Snapshot = Record<string, unknown>;

interface Diff {
  is: unknown;
  was: unknown;
}

type Changes = Record<string, Diff>;

type IgnoreFunction = (key: string, value: unknown) => boolean;

interface ElSegundoOptions {
  ignore: IgnoreFunction | false | null;
}

/**
 * Returns true if its arguments are identical, false otherwise.
 * `NaN` is identical to `NaN`;
 * `0` and `-0` are not identical.
 */
function identical(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    // if constructors are different, objects cannot be identical
    if (a.constructor !== b.constructor) return false;

    // if a is a date, b must be a date, check values
    if (a instanceof Date) return a.valueOf() === b.valueOf();

    // istanbul ignore else
    // if a is a RegExp, b must be a RegExp, check values
    if (a instanceof RegExp) return a.source === (b as RegExp).source && a.flags === (b as RegExp).flags;

    // other objects should not be here
  }

  // NaN == NaN
  return a !== a && b !== b;
}

function matchesSnapshot(subject: unknown, snapshot: Snapshot, ignore: IgnoreFunction | false | null): boolean {
  const seen = new WeakMap();
  return recurse(subject, REF);

  function recurse(s: unknown, path: string): boolean {
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

function generateSnapshot(subject: unknown, ignore?: IgnoreFunction | false | null): Snapshot {
  const seen = new WeakMap();
  const map: Snapshot = {};
  return recurse(subject, REF) as Snapshot;

  function recurse(s: unknown, path: string): unknown {
    if (typeof s !== 'object' || s instanceof Date || s instanceof RegExp) {
      return (map[path] = s);
    }

    if (s === null) {
      return (map[path] = NULL);
    }

    if (seen.has(s)) {
      return (map[path] = seen.get(s));
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

function snapshotDiff(lhs: Snapshot, rhs: Snapshot): Changes {
  const lkeys = Object.keys(lhs);
  const rkeys = Object.keys(rhs);
  const changes: Changes = Object.create(null);

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

const defaultIgnore: IgnoreFunction = (key: string, value: unknown) => value === undefined || key[0] === '$';

export class ElSegundo {
  /* istanbul ignore next  */
  static generateSnapshot(subject: unknown, ignore: IgnoreFunction = defaultIgnore): Snapshot {
    return generateSnapshot(subject, ignore);
  }

  /* istanbul ignore next  */
  static matchesSnapshot(subject: unknown, snapshot: Snapshot, ignore: IgnoreFunction = defaultIgnore): boolean {
    return matchesSnapshot(subject, snapshot, ignore);
  }

  private _snapshot: Snapshot;
  private _ignore: IgnoreFunction | false | null;

  get map(): Snapshot {
    return this._snapshot;
  }

  constructor(subject: unknown, opts?: ElSegundoOptions) {
    this._ignore = opts && typeof opts.ignore !== 'undefined' ? opts.ignore : defaultIgnore;
    this.resetSnapshot(subject);
  }

  resetSnapshot(subject: unknown): void {
    this._snapshot = this.generateSnapshot(subject);
  }

  generateSnapshot(subject: unknown): Snapshot {
    return generateSnapshot(subject, this._ignore);
  }

  matchesSnapshot(subject: unknown): boolean {
    return matchesSnapshot(subject, this._snapshot, this._ignore);
  }

  check(subject: unknown): boolean {
    return !this.matchesSnapshot(subject);
  }

  diff(subject: unknown): Changes {
    return snapshotDiff(this.generateSnapshot(subject), this._snapshot);
  }
}
