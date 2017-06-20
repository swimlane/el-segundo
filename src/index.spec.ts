import { test } from 'ava';
import { ElSegundo } from '.';
import { fixture, leia, luke } from './fixtures';
import * as deepClone from 'lodash.clonedeep';

const isDirty = new ElSegundo(fixture);

test('can create a new ElSegundo object', t => {
  t.false(isDirty.check(fixture));
});

test('identical', t => {
  t.false(isDirty.check(fixture));
});

test('static methods', t => {
  const snapshot = ElSegundo.generateSnapshot(fixture);
  t.true(ElSegundo.matchesSnapshot(fixture, snapshot));
});

test('shallow clone', t => {
  t.false(isDirty.check({...fixture}));
});

test('deep clone', t => {
  t.false(isDirty.check(deepClone(fixture)));
});

test('not equal', t => {
  t.true(isDirty.check({...fixture, string: 'a different string'}));
});

test('ignores hidden values', t => {
  const o = {...fixture, $hidden: false};
  t.false(isDirty.check(o));
  t.deepEqual(isDirty.map, ElSegundo.generateSnapshot(o));
});

test('key added', t => {
  t.true(isDirty.check({...fixture, string2: 'a different string'}));
});

test('key remove', t => {
  t.true(isDirty.check({...fixture, string: undefined}));
});

test('key order changed', t => {
  const o = deepClone(fixture);
  delete o.string;
  o.string = 'this is a string';
  t.false(isDirty.check(o));
  t.deepEqual(isDirty.map, ElSegundo.generateSnapshot(o));
});

test('deep change', t => {
  const o = deepClone(fixture);
  o.sub.name.first = 'Eddie';
  t.true(isDirty.check(o));
});

test('array equal', t => {
  const o = deepClone(fixture);
  o.array = ['an', 1, 'array', { a: 123, b: 456 }];
  t.false(isDirty.check(o));
  t.deepEqual(isDirty.map, ElSegundo.generateSnapshot(o));
});

test('array change', t => {
  const o = deepClone(fixture);
  o.array[0] = 'the';
  t.true(isDirty.check(o));
});

test('detect changes to null values', t => {
  const o = deepClone(fixture);
  o.trickyValues['null'] = 'not null';
  t.true(isDirty.check(o));
});

test('detect in NaN change', t => {
  const o = deepClone(fixture);
  o.trickyValues.nan = 'not nan';
  t.true(isDirty.check(o));
});

test('detect in equal nan', t => {
  const o = deepClone(fixture);
  o.trickyValues.nan = NaN;
  t.false(isDirty.check(o));
});

test('detect changes in +/-0', t => {
  const o = deepClone(fixture);
  o.trickyValues.pZero = -0;
  t.false(isDirty.check(o));
});

test('detect value becoming null', t => {
  const o = deepClone(fixture);
  o.string = null;
  t.true(isDirty.check(o));
});

test('supports circular structure, detect if removed', t => {
  const o = deepClone(fixture);
  o.characters.leia.siblings = [];
  t.true(isDirty.check(o));
});

test('supports circular structure, detect if changed to another path', t => {
  const o = deepClone(fixture);
  o.characters.leia.siblings[0] = o.characters.leia;
  t.true(isDirty.check(o));
});

test('ignores removed ignored fields', t => {
  const o = deepClone(fixture);
  delete o.$hidden;
  t.false(isDirty.check(o));
});

test('ignores added ignored fields', t => {
  const o = deepClone(fixture);
  o.$removed = false;
  t.false(isDirty.check(o));
});

test('supports custom ignore', t => {
  const isDirty = new ElSegundo(fixture, {ignore: (key) => 'sub'});

  const o = deepClone(fixture);
  o.sub = {};
  t.false(isDirty.check(o));
});

test('supports custom ignore, ignore none', t => {
  const isDirty = new ElSegundo(fixture, {ignore: false});

  const o = deepClone(fixture);
  o.$hidden = false;
  t.true(isDirty.check(o));
});

console.log(ElSegundo.generateSnapshot(fixture.characters.leia));
