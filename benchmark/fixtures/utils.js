function replacer(key, value) {
  return key[0] === '$' ? undefined : value;
}

function ignoreKeys(objValue, othValue, key) {
  if (key && key[0] === '$') return true;
}

function cloner(value, key, object) {
  return (key && key[0] === '$') ? true : undefined;
}

module.exports = {
  replacer,
  ignoreKeys,
  cloner
}
