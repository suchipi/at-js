const repl = require("repl");
const path = require("path");
const vm = require("vm");
const makeModuleEnv = require("make-module-env");
const { exec } = require("shelljs");
const binaryName = require("./binary-name");

const badModules = new Set(["sys"]);

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

  const context = vm.createContext({
    ...builtins,
    ...env,
    ...global,
    exec,
  });
  context.global = context;

  const fn = vm.runInContext("(" + expressionString + ")", context);

  return fn;
};
