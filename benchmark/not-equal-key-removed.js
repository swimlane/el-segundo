const suite = require('chuhai');
const test = require('blue-tape');

const isEqualWith = require('lodash.isequalwith');
const isMatchWith = require('lodash.ismatchwith');
const clone = require('lodash.clonedeepwith');

const fixture = require('./fixtures/fixture');
const {replacer, ignoreKeys, cloner} = require('./fixtures/utils');

const { ElSegundo } = require('..');

const deepdiff = require('deep-diff');

const fixtureString = JSON.stringify(fixture);
const fixtureClone = clone(fixture, cloner);

const isDirty = new ElSegundo(fixture);

const subject = clone(fixture);
delete subject.string;

test('key removed, dirty check returns true', function (t) {
  return suite('', function (s) {
    s.set('maxTime', 1);
    s.set('minSamples', 10);

    let dirtyResult = null;
    s.cycle(function (e) {
      t.false(e.target.error, e.target.name + ' runs without error');
      t.ok(dirtyResult === true);
      dirtyResult = null;
    });

    s.burn('Theoretical max', () => {
      dirtyResult = 'a' !== 'b';
    });

    s.bench('JSON.stringify', () => {
      dirtyResult = fixtureString !== JSON.stringify(subject);
    });

    s.bench('El Segundo', () => {
      dirtyResult = isDirty.check(subject);
    });

    s.bench('deep-diff', () => {
      dirtyResult = typeof deepdiff(fixtureClone, subject) === 'object';
    });

    s.bench('lodash.isEqualWith', () => {
      dirtyResult = !isEqualWith(subject, fixtureClone, ignoreKeys);
    });

    s.bench('lodash.isMatchWith', () => {
      dirtyResult = !isMatchWith(subject, fixtureClone, ignoreKeys);
    });
  });
});
