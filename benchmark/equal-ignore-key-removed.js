const suite = require('chuhai');
const test = require('blue-tape');

const clone = require('lodash.clonedeepwith');

const fixture = clone(require('./fixtures/fixture'));
const {replacer} = require('./fixtures/utils');

const { ElSegundo } = require('..');

const deepdiff = require('deep-diff');

const fixtureString = JSON.stringify(fixture, replacer);

const isDirty = new ElSegundo(fixture);

const subject = clone(fixture);
delete subject.$hidden;

test('ignored value removed, dirty check returns false', function (t) {
  return suite('', function (s) {
    s.set('maxTime', 1);
    s.set('minSamples', 10);

    let dirtyResult = null;
    s.cycle(function (e) {
      t.false(e.target.error, e.target.name + ' runs without error');
      t.ok(dirtyResult === false);
      dirtyResult = null;
    });

    s.burn('Theoretical max', () => {
      dirtyResult = 'a' !== 'a';
    });

    s.bench('JSON.stringify', () => {
      dirtyResult = fixtureString !== JSON.stringify(subject, replacer);
    });

    s.bench('El Segundo', () => {
      dirtyResult = isDirty.check(subject);
    });
  });
});
