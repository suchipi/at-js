function isObject(input) {
  return Object.prototype.toString.call(input) === "[object Object]";
}

function parseObject(input) {
  let obj;
  try {
    obj = JSON.parse(input);
  } catch (err) {
    throw new Error("Failed to parse input as JSON:\n" + input);
  }

  if (!isObject(obj)) {
    throw new Error("Input wasn't a JSON object:\n" + input);
  }

  return obj;
}

function parseArray(input) {
  let array;
  try {
    array = JSON.parse(input);
  } catch (err) {
    throw new Error("Failed to parse input as JSON:\n" + input);
  }

  if (!Array.isArray(array)) {
    throw new Error("Input wasn't a JSON array:\n" + input);
  }

  return array;
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
  parseObject,
  parseArray,
  isRepresentableAsJSON,
};
