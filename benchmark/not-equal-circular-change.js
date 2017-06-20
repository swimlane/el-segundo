const suite = require('chuhai');
const test = require('blue-tape');

const isEqualWith = require('lodash.isequalwith');
const isMatchWith = require('lodash.ismatchwith');
const clone = require('lodash.clonedeepwith');

const fixture = clone(require('./fixtures/fixture'));
const {replacer, ignoreKeys, cloner} = require('./fixtures/utils');

const { ElSegundo } = require('..');

const deepdiff = require('deep-diff');

fixture.sub.self = fixture;
const fixtureClone = clone(fixture, cloner);

const isDirty = new ElSegundo(fixture);

const subject = clone(fixture);
subject.sub.self = subject.sub;

test('circular reference changed, dirty check returns true', function (t) {
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

    /*
    Not supported
    s.bench('JSON.stringify', () => {
      dirtyResult = fixtureString !== JSON.stringify(b);
    }); */

    s.bench('El Segundo', () => {
      dirtyResult = isDirty.check(subject);
    });

    /*
    Not supported
    s.bench('deep-diff', () => {
      dirtyResult = typeof deepdiff(fixtureClone, b) === 'object';
    });
    */

    s.bench('lodash.isEqualWith', () => {
      dirtyResult = !isEqualWith(subject, fixtureClone, ignoreKeys);
    });

    s.bench('lodash.isMatchWith', () => {
      dirtyResult = !isMatchWith(subject, fixtureClone, ignoreKeys);
    });
  });
});
