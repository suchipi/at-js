const fs = require("fs");
const child_process = require("child_process");
const kleur = require("kleur");

/** @type {Omit<typeof kleur, "enabled">} */
const kleurWithoutEnabled = { ...kleur };
// @ts-ignore
delete kleurWithoutEnabled.enabled;

/**
 * @param  {...any} commandPartsOrOptions strings, numbers, or booleans (command parts), or an options argument (only option is { async: true })
 */
const exec = (...commandPartsOrOptions) => {
  /** @type {string | undefined} */
  let command = undefined;
  /** @type {{ async?: boolean } | undefined} */
  let options = undefined;
  for (const arg of commandPartsOrOptions) {
    if (
      typeof arg === "string" ||
      typeof arg === "number" ||
      typeof arg === "boolean"
    ) {
      if (typeof command === "undefined") {
        command = String(arg);
      } else {
        command = command + " " + arg;
      }
    } else if (typeof options === "undefined") {
      options = arg;
    } else {
      throw Object.assign(new Error("Invalid or unexpected argument"), {
        argument: arg,
      });
    }
  }

  if (typeof command !== "string") {
    // not reachable but makes TS happy
    throw new Error("Invalid or unexpected argument");
  }

  let result;
  if (options?.async) {
    child_process.spawn(command, {
      shell: true,
      stdio: "inherit",
      detached: true,
    });
    result = { detached: true };
  } else {
    result = Object.assign(
      child_process.spawnSync(command, {
        encoding: "utf-8",
        shell: true,
      }),
      { detached: false }
    );
  }

  if (result.error) {
    throw Object.assign(result.error, result, { code: result.status });
  }

  if (!result.detached && result.status !== 0) {
    const err = new Error(`${command} failed: ` + result.stderr);
    throw Object.assign(err, result, { code: result.status });
  }

  if (result.detached) {
    return result;
  } else {
    const output = new String(result.stdout);
    Object.defineProperties(output, {
      stdout: { value: result.stdout, enumerable: true, writable: true },
      stderr: { value: result.stderr, enumerable: true, writable: true },
      code: { value: result.status, enumerable: true, writable: true },
    });

    return output;
  }
};

/**
 * @param {string} filePath
 */
const isFile = (filePath) => {
  return fs.statSync(filePath).isFile();
};

/**
 * @param {string} filePath
 */
const isDirectory = (filePath) => {
  return fs.statSync(filePath).isDirectory();
};

/** @type {(value: string) => string} */
const quote = JSON.stringify.bind(JSON);

const globalHelpers = {
  exec,
  quote,
  isFile,
  isDirectory,
  isFolder: isDirectory,
  ...kleurWithoutEnabled,
};

module.exports = globalHelpers;
