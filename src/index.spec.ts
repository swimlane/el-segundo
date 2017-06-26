import { test } from 'ava';
import { ElSegundo } from '.';
import { fixture, leia, luke } from './fixtures';
import * as deepClone from 'lodash.clonedeep';

const isDirty = new ElSegundo(fixture);

test('#check should create a new ElSegundo object', t => {
  t.false(isDirty.check(fixture));
});

test('#check should return false with identical objects', t => {
  t.false(isDirty.check(fixture));
});

test('#generateSnapshot should generate snapshot', t => {
  const snapshot = isDirty.generateSnapshot(fixture);
  t.true(ElSegundo.matchesSnapshot(fixture, snapshot));
});

test('#check should return false with a shallow clone', t => {
  t.false(isDirty.check({...fixture}));
});

test('#check should return false with a deep clone', t => {
  t.false(isDirty.check(deepClone(fixture)));
});

test('#check should return true with when not equal', t => {
  t.true(isDirty.check({...fixture, string: 'a different string'}));
});

test('#check should ignore hidden values', t => {
  const o = {...fixture, $hidden: false};
  t.false(isDirty.check(o));
  t.deepEqual(isDirty.map, ElSegundo.generateSnapshot(o));
});

test('#check should return true when a key is added', t => {
  t.true(isDirty.check({...fixture, string2: 'a different string'}));
});

test('#check should return true key removed', t => {
  t.true(isDirty.check({...fixture, string: undefined}));
});

test('#check should return false key order changed', t => {
  const o = deepClone(fixture);
  delete o.string;
  o.string = 'this is a string';
  t.false(isDirty.check(o));
  t.deepEqual(isDirty.map, ElSegundo.generateSnapshot(o));
});

test('#check should return true on a deep change', t => {
  const o = deepClone(fixture);
  o.sub.name.first = 'Eddie';
  t.true(isDirty.check(o));
});

test('#check should return false when array are equal', t => {
  const o = deepClone(fixture);
  o.array = ['an', 1, 'array', { a: 123, b: 456 }];
  t.false(isDirty.check(o));
  t.deepEqual(isDirty.map, ElSegundo.generateSnapshot(o));
});

test('#check should return true when arrays change', t => {
  const o = deepClone(fixture);
  o.array[0] = 'the';
  t.true(isDirty.check(o));
});

test('#check should return true when null values become not null', t => {
  const o = deepClone(fixture);
  o.trickyValues['null'] = 'not null';
  t.true(isDirty.check(o));
});

test('#check should return true when NaN values become not NaN', t => {
  const o = deepClone(fixture);
  o.trickyValues.nan = 'not nan';
  t.true(isDirty.check(o));
});

test('#check should return true when NaN value remains NaN', t => {
  const o = deepClone(fixture);
  o.trickyValues.nan = NaN;
  t.false(isDirty.check(o));
});

test('#check should return false when sign of zero value changes (+/-0)', t => {
  const o = deepClone(fixture);
  o.trickyValues.pZero = -0;
  t.false(isDirty.check(o));
});

test('#check should return false when value becomes null', t => {
  const o = deepClone(fixture);
  o.string = null;
  t.true(isDirty.check(o));
});

test('#check should return true if circular reference is removed', t => {
  const o = deepClone(fixture);
  o.characters.leia.siblings = [];
  t.true(isDirty.check(o));
});

test('#check should return true if circular reference is changed to another path', t => {
  const o = deepClone(fixture);
  o.characters.leia.siblings[0] = o.characters.leia;
  t.true(isDirty.check(o));
});

test('#check should return false if ignored field is removed', t => {
  const o = deepClone(fixture);
  delete o.$hidden;
  t.false(isDirty.check(o));
});

test('#check should return false id ignored field is added', t => {
  const o = deepClone(fixture);
  o.$removed = false;
  t.false(isDirty.check(o));
});

test('ElSegundo supports custom ignore', t => {
  const _isDirty = new ElSegundo(fixture, {ignore: (key) => 'sub'});

  const o = deepClone(fixture);
  o.sub = {};
  t.false(_isDirty.check(o));
});

test('ElSegundo supports ignoring none', t => {
  const _isDirty = new ElSegundo(fixture, {ignore: false});

  const o = deepClone(fixture);
  o.$hidden = false;
  t.true(_isDirty.check(o));
});

test('#diff should return the differences when a value has changed', t => {
  const o = deepClone(fixture);
  o.sub.name.first = 'Eddie';
  t.deepEqual(isDirty.diff(o), {
    '#/sub/name/first': { is: 'Eddie', was: 'Gomez' }
  } as any);
});

test('#diff should return the differences when a value is added', t => {
  const o = deepClone(fixture);
  o.sub.name.middle = 'M';
  t.deepEqual(isDirty.diff(o), {
    '#/sub/name': { is: 3, was: 2 },
    '#/sub/name/middle': { is: 'M', was: undefined }
  } as any);
});

test('#diff should return the differences when a value is removed', t => {
  const o = deepClone(fixture);
  delete o.sub.name.first;
  t.deepEqual(isDirty.diff(o), {
    '#/sub/name': { is: 1, was: 2 },
    '#/sub/name/first': { is: undefined, was: 'Gomez'}
  } as any);
});

// console.log(isDirty.generateSnapshot(fixture.characters.leia));
