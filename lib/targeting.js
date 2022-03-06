const toPath = require("lodash/toPath");

function pathStringToArray(pathString) {
  return toPath(pathString.replace(/^\./, ""));
}

function applyToTarget(target, targetPath, transformFn) {
  if (targetPath.length === 0) {
    return transformFn(target);
  } else {
    const nextPathComponent = targetPath[0];
    if (nextPathComponent === "*") {
      const targetKeys = Object.keys(target);
      for (const key of targetKeys) {
        const subTarget = target[key];
        target[key] = applyToTarget(
          subTarget,
          targetPath.slice(1),
          transformFn
        );
      }
    } else {
      const key = nextPathComponent;
      const subTarget = target[key];
      target[key] = applyToTarget(subTarget, targetPath.slice(1), transformFn);
    }

    return target;
  }
}

module.exports = {
  pathStringToArray,
  applyToTarget,
};
