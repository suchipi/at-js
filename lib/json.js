function isObject(input) {
  return Object.prototype.toString.call(input) === "[object Object]";
}

function isRepresentableAsJSON(input) {
  if (
    input == null ||
    typeof input === "boolean" ||
    typeof input === "number" ||
    typeof input === "string"
  ) {
    return true;
  }

  if (isObject(input)) {
    return (
      Object.values(input).every(isRepresentableAsJSON) &&
      Object.keys(input).every(isRepresentableAsJSON)
    );
  } else if (Array.isArray(input)) {
    return input.every(isRepresentableAsJSON);
  } else {
    return false;
  }
}

module.exports = {
  isObject,
  isRepresentableAsJSON,
};
