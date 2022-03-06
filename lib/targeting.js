const toPath = require("lodash/toPath");

function applyToTarget(target, targetPathString, transformFn) {
  const targetPath = toPath(targetPathString.replace(/^\./, ""));

  let foundTarget = false;

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
    const error = new Error(
      `Your target string didn't match anything: ${JSON.stringify(
        targetPathString
      )}`
    );
    error.target = targetPathString;
    error.parsedTargetPath = targetPath;
    error.input = target;
    throw error;
  }

  return result;
}

module.exports = {
  applyToTarget,
};
