const repl = require("repl");
const path = require("path");
const vm = require("vm");
const makeModuleEnv = require("make-module-env");
const { exec } = require("shelljs");

const badModules = new Set(["sys"]);

module.exports = function loadFunction(fnString) {
  const env = makeModuleEnv(
    path.join(process.cwd(), "command-line-function.js")
  );

  const builtins = {};
  repl.builtinModules
    .filter((modName) => !badModules.has(modName))
    .forEach((modName) => {
      builtins[modName] = require(modName);
    });

  const context = vm.createContext({
    ...builtins,
    ...env,
    ...global,
    exec,
  });
  context.global = context;

  const fn = vm.runInContext(fnString, context);

  return fn;
};
