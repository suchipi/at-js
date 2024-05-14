const path = require("path");
const vm = require("vm");
const makeModuleEnv = require("make-module-env");
const kleur = require("kleur");
const changeCase = require("change-case");
const child_process = require("child_process");

const kleurWithoutEnabled = { ...kleur };
delete kleurWithoutEnabled.enabled;

const EMPTY = Symbol("EMPTY");

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

const exec = (...commandParts) => {
  const command = commandParts.join(" ");

  const result = child_process.spawnSync(command, {
    encoding: "utf-8",
    shell: true,
  });
  if (result.error) {
    throw Object.assign(result.error, result, { code: result.status });
  }

  if (result.status !== 0) {
    const err = new Error(`${command} failed: ` + result.stderr);
    throw Object.assign(err, result, { code: result.status });
  }

  const output = new String(result.stdout);
  Object.defineProperties(output, {
    stdout: { value: result.stdout, enumerable: true, writable: true },
    stderr: { value: result.stderr, enumerable: true, writable: true },
    code: { value: result.status, enumerable: true, writable: true },
  });

  return output;
};

// kinda like xargs but without all its options. just passes each thing to the
// corresponding command, quoted by default
exec.with =
  (program, { quote = true } = {}) =>
  (...argParts) => {
    const args = argParts.join(" ");
    const command = quote
      ? `${program} ${JSON.stringify(args)}`
      : `${program} ${args}`;
    return exec(command);
  };

module.exports = function runExpression(expressionString) {
  if (!expressionString || typeof expressionString !== "string") {
    throw new Error(`Invalid expression string: ${expressionString}.`);
  }

  let parsedExpressionString = expressionString;

  if (expressionString.startsWith(".[")) {
    parsedExpressionString = expressionString.replace(/^\./, "input => input");
  } else if (expressionString.startsWith(".")) {
    parsedExpressionString = "input => input" + expressionString;
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
    quote: JSON.stringify.bind(JSON),
  };

  function readGlobalOrEmpty(globalName) {
    // special-case handling to make instanceof work on builtin literals
    const specialCases = {
      Array: "[].constructor",
      Object: "({}.constructor)",
      String: "''.constructor",
      Number: "4..constructor",
      Boolean: "true.constructor",
    };
    if (specialCases[globalName]) {
      return vm.runInContext(specialCases[globalName], context);
    }

    // Don't attempt to require eg undefined
    if (commonGlobalNames.has(globalName)) {
      return globalNamespaceForCode[globalName];
    }

    if (globalName in globalNamespaceForCode) {
      return globalNamespaceForCode[globalName];
    }

    try {
      const result = env.require(globalName);
      globalNamespaceForCode[globalName] = result;
      console.error(
        kleur.dim(
          `auto-required ${JSON.stringify(globalName)} as ${globalName}`
        )
      );
      return result;
    } catch (err) {
      try {
        const source = changeCase.paramCase(globalName);

        const result = env.require(source);
        globalNamespaceForCode[globalName] = result;
        console.error(
          kleur.dim(`auto-required ${JSON.stringify(source)} as ${globalName}`)
        );
        return result;
      } catch (err) {
        try {
          const source = changeCase
            .paramCase(
              globalName
                .replace(/^__/, "suchipi-at-js-placeholder-at")
                .replace("_", "suchipi-at-js-placeholder-slash")
            )
            .replace("suchipi-at-js-placeholder-at", "@")
            .replace("suchipi-at-js-placeholder-slash", "/");

          const result = env.require(source);
          globalNamespaceForCode[globalName] = result;
          console.error(
            kleur.dim(
              `auto-required ${JSON.stringify(source)} as ${globalName}`
            )
          );
          return result;
        } catch (err) {
          return EMPTY;
        }
      }
    }
  }

  let context;
  let globalThisProxy;
  let bareIdentifierProxy;

  globalThisProxy = new Proxy(globalNamespaceForCode, {
    get(_target, propertyName) {
      const result = readGlobalOrEmpty(propertyName);
      if (result === EMPTY) {
        return undefined;
      } else {
        return result;
      }
    },
  });

  bareIdentifierProxy = new Proxy(globalNamespaceForCode, {
    get(_target, propertyName) {
      const result = readGlobalOrEmpty(propertyName);
      if (result === EMPTY) {
        throw new ReferenceError(`${propertyName} is not defined`);
      } else {
        return result;
      }
    },
  });

  context = vm.createContext(bareIdentifierProxy);
  context.global = globalThisProxy;
  context.globalThis = globalThisProxy;

  kleur.enabled = true;

  const value = vm.runInContext("(" + parsedExpressionString + ")", context);

  return value;
};
