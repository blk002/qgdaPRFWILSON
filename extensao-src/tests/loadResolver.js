const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadExtensionResolver() {
  const extDir = path.resolve(__dirname, '../../extensao PC');
  const treeMatcherCode = fs.readFileSync(path.join(extDir, 'treeMatcher.js'), 'utf8');
  const resolverCode = fs.readFileSync(path.join(extDir, 'caveiraResolver.js'), 'utf8');
  const treeJson = JSON.parse(fs.readFileSync(path.join(extDir, 'caveira_arvore.json'), 'utf8'));

  const sandbox = { URLSearchParams, console, Math, Set, Map, RegExp, Array, Object, String, Number, Boolean, JSON };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(treeMatcherCode, sandbox, { filename: 'treeMatcher.js' });
  vm.runInContext(resolverCode, sandbox, { filename: 'caveiraResolver.js' });

  return { R: sandbox.QGCaveiraResolver, TM: sandbox.QGCaveiraTreeMatcher, treeJson };
}

module.exports = { loadExtensionResolver };
