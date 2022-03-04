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

// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
const commonGlobalNames = new Set([
  "Infinity",
  "NaN",
  "undefined",

  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "encodeURI",
  "encodeURIComponent",
  "decodeURI",
  "decodeURIComponent",
  "escape",
  "unescape",
  "uneval",

  "Object",
  "Function",
  "Boolean",
  "Symbol",

  "Error",
  "AggregateError",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError",

  "Number",
  "BigInt",
  "Math",
  "Date",

  "String",
  "RegExp",

  "Array",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Uint16Array",
  "Int32Array",
  "Uint32Array",
  "Float32Array",
  "Float64Array",
  "BigInt64Array",
  "BigUint64Array",

  "Map",
  "Set",
  "WeakMap",
  "WeakSet",

  "ArrayBuffer",
  "SharedArrayBuffer",
  "Atomics",
  "DataView",
  "JSON",

  "Promise",
  "Generator",
  "GeneratorFunction",
  "AsyncFunction",
  "AsyncGenerator",
  "AsyncGeneratorFunction",

  "Reflect",
  "Proxy",

  "Intl",
  "WebAssembly",

  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "setImmediate",
  "clearImmediate",

  "performance",
  "console",
  "FinalizationRegistry",
  "WeakRef",
]);

const exec = (command) => {
  const result = shelljs.exec(command, { silent: true, fatal: true });
  if (result.code !== 0) {
    throw new Error(`${command} failed: ` + result.stderr);
  }
  return result;
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

  const commonGlobals = Array.from(commonGlobalNames).reduce(
    (obj, globalName) => {
      try {
        const value = global[globalName];
        obj[globalName] = value;
      } catch (err) {}

      return obj;
    },
    {}
  );

  const globalNamespaceForCode = {
    ...env,
    exec,
    ...kleurWithoutEnabled,
    ...global,
    ...commonGlobals,
  };

  let context;

  const proxy = new Proxy(globalNamespaceForCode, {
    get(target, propertyName) {
      // special-case handling to make instanceof work on builtin literals
      const specialCases = {
        Array: "[].constructor",
        Object: "({}.constructor)",
        String: "''.constructor",
        Number: "4..constructor",
      };
      if (specialCases[propertyName]) {
        return vm.runInContext(specialCases[propertyName], context);
      }

      // Don't attempt to require eg undefined
      if (commonGlobalNames.has(propertyName)) {
        return target[propertyName];
      }

      const normalGlobal = target[propertyName];
      if (normalGlobal != null) return normalGlobal;

      try {
        const result = env.require(propertyName);
        target[propertyName] = result;
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
          target[propertyName] = result;
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
            target[propertyName] = result;
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

  context = vm.createContext(proxy);
  context.global = context;
  context.globalThis = context;

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
