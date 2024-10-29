const path = require("path");
const vm = require("vm");
const { makeModuleEnv } = require("make-module-env");
const globalHelpers = require("./global-helpers");
const parseExpression = require("./parse-expression");
const EMPTY = require("./empty");
const autoRequire = require("./auto-require");

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

/**
 * @param {string} expressionString Input (command-line) expression string
 * @returns the result of evaluating the expression string
 */
module.exports = function runExpression(expressionString) {
  if (!expressionString || typeof expressionString !== "string") {
    throw new Error(`Invalid expression string: ${expressionString}.`);
  }

  const parsedExpressionString = parseExpression(expressionString);

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
    ...globalHelpers,
    ...global,
    ...commonGlobals,
  };

  let context;

  /**
   * @param {PropertyKey} globalName
   */
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
    if (typeof globalName === "string" && commonGlobalNames.has(globalName)) {
      return globalNamespaceForCode[globalName];
    }

    if (globalName in globalNamespaceForCode) {
      return globalNamespaceForCode[globalName];
    }

    if (typeof globalName === "string") {
      const maybeAutoRequired = autoRequire(env, globalName);
      if (maybeAutoRequired !== EMPTY) {
        globalNamespaceForCode[globalName] = maybeAutoRequired;
        return maybeAutoRequired;
      }
    }

    return EMPTY;
  }

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
        throw new ReferenceError(`${String(propertyName)} is not defined`);
      } else {
        return result;
      }
    },
  });

  context = vm.createContext(bareIdentifierProxy);
  context.global = globalThisProxy;
  context.globalThis = globalThisProxy;

  const value = vm.runInContext("(" + parsedExpressionString + ")", context);

  return value;
};
