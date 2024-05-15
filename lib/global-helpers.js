const child_process = require("child_process");
const kleur = require("kleur");

const kleurWithoutEnabled = { ...kleur };
delete kleurWithoutEnabled.enabled;

const exec = (...commandPartsOrOptions) => {
  let command;
  let options;
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
      throw Object.assign(
        new Error("Invalid or unexpected second options argument"),
        { argument: arg }
      );
    }
  }

  let result;
  if (options?.async) {
    child_process.spawn(command, {
      encoding: "utf-8",
      shell: true,
      stdio: "inherit",
      detached: true,
    });
    result = { detached: true };
  } else {
    result = child_process.spawnSync(command, {
      encoding: "utf-8",
      shell: true,
    });
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

const globalHelpers = {
  exec,
  quote: JSON.stringify.bind(JSON),
  ...kleurWithoutEnabled,
};

module.exports = globalHelpers;
