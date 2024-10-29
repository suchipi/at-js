const toPath = require("lodash/toPath");

/**
 * @param {any} target
 * @param {string} targetPathString
 * @param {(value: any) => any} transformFn
 * @returns the whole `target` (ie. not just the targeted part)
 */
function applyToTarget(target, targetPathString, transformFn) {
  const targetPath = toPath(targetPathString.replace(/^\./, ""));

  let foundTarget = false;

  /**
   * @param {any} target
   * @param {Array<string>} targetPath
   * @param {(value: any) => any} transformFn
   */
  function innerApply(target, targetPath, transformFn) {
    if (targetPath.length === 0) {
      foundTarget = true;
      return transformFn(target);
    } else {
      const nextPathComponent = targetPath[0];
      if (nextPathComponent === "*") {
        const targetKeys = Object.keys(target);
        for (const key of targetKeys) {
          const subTarget = target[key];
          target[key] = innerApply(subTarget, targetPath.slice(1), transformFn);
        }
      } else {
        const key = nextPathComponent;
        if ({}.hasOwnProperty.call(target, key)) {
          const subTarget = target[key];
          target[key] = innerApply(subTarget, targetPath.slice(1), transformFn);
        }
      }

      return target;
    }
  }

  const result = innerApply(target, targetPath, transformFn);

  if (!foundTarget) {
    throw Object.assign(
      new Error(
        `Your target string didn't match anything: ${JSON.stringify(
          targetPathString
        )}`
      ),
      {
        target: targetPathString,
        parsedTargetPath: targetPath,
        input: target,
      }
    );
  }

  return result;
}

module.exports = {
  applyToTarget,
};
