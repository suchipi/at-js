const repl = require("repl");
const path = require("path");
const vm = require("vm");
const makeModuleEnv = require("make-module-env");
const { exec } = require("shelljs");
const kleur = require("kleur");
const changeCase = require("change-case");

const badModules = new Set(["sys"]);

kleur.enabled = true;
const kleurWithoutEnabled = {
  ...kleur,
};
delete kleurWithoutEnabled.enabled;

module.exports = function runExpression(expressionString) {
  if (!expressionString || typeof expressionString !== "string") {
    throw new Error(`Invalid expression string: ${expressionString}.`);
  }

  const env = makeModuleEnv(
    path.join(process.cwd(), "command-line-function.js")
  );

  const builtins = {};
  repl.builtinModules
    .filter((modName) => !badModules.has(modName))
    .forEach((modName) => {
      builtins[modName] = require(modName);
    });

  const inputContext = {
    ...builtins,
    ...env,
    ...global,
    ...kleurWithoutEnabled,
    exec,
  };

  const proxy = new Proxy(inputContext, {
    get(target, propertyName) {
      const normalGlobal = global[propertyName] || target[propertyName];
      if (normalGlobal != null) return normalGlobal;

      try {
        return env.require(propertyName);
      } catch (err) {
        try {
          return env.require(changeCase.paramCase(propertyName));
        } catch (err) {
          return undefined;
        }
      }
    },
  });

  const context = vm.createContext(proxy);
  context.global = context;

  const fn = vm.runInContext("(" + expressionString + ")", context);

  return fn;
};
