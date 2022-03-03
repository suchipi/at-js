const path = require("path");
const vm = require("vm");
const makeModuleEnv = require("make-module-env");
const shelljs = require("shelljs");
const kleur = require("kleur");
const changeCase = require("change-case");

kleur.enabled = true;
const kleurWithoutEnabled = {
  ...kleur,
};
delete kleurWithoutEnabled.enabled;

const exec = (command) => {
  const result = shelljs.exec(command, { silent: true, fatal: true });
  if (result.code !== 0) {
    throw new Error(`${command} failed: ` + result.stderr);
  }
};

module.exports = function runExpression(expressionString) {
  if (!expressionString || typeof expressionString !== "string") {
    throw new Error(`Invalid expression string: ${expressionString}.`);
  }

  let parsedExpressionString = expressionString;

  if (expressionString.startsWith(".[")) {
    parsedExpressionString = expressionString.replace(/^\./, "_ => _");
  } else if (expressionString.startsWith(".")) {
    parsedExpressionString = "_ => _" + expressionString;
  }

  const env = makeModuleEnv(
    path.join(process.cwd(), "command-line-function.js")
  );

  const inputContext = {
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
        const result = env.require(propertyName);
        console.error(
          kleur.dim(
            `auto-required ${JSON.stringify(propertyName)} as ${propertyName}`
          )
        );
        return result;
      } catch (err) {
        try {
          const source = changeCase.paramCase(propertyName);

          const result = env.require(source);
          console.error(
            kleur.dim(
              `auto-required ${JSON.stringify(source)} as ${propertyName}`
            )
          );
          return result;
        } catch (err) {
          try {
            const source = changeCase
              .paramCase(
                propertyName
                  .replace(/^__/, "suchipi-at-js-placeholder-at")
                  .replace("_", "suchipi-at-js-placeholder-slash")
              )
              .replace("suchipi-at-js-placeholder-at", "@")
              .replace("suchipi-at-js-placeholder-slash", "/");

            const result = env.require(source);
            console.error(
              kleur.dim(
                `auto-required ${JSON.stringify(source)} as ${propertyName}`
              )
            );
            return result;
          } catch (err) {
            return undefined;
          }
        }
      }
    },
  });

  const context = vm.createContext(proxy);
  context.global = context;

  if (parsedExpressionString !== expressionString) {
    console.error(
      kleur.dim(
        `parsed ${JSON.stringify(
          expressionString
        )} into ${parsedExpressionString}`
      )
    );
  }

  const value = vm.runInContext("(" + parsedExpressionString + ")", context);

  return value;
};
