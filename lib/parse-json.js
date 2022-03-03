function object(input) {
  let obj;
  try {
    obj = JSON.parse(input);
  } catch (err) {
    throw new Error("Failed to parse input as JSON:\n" + input);
  }

  if (!Object.prototype.toString.call(obj) !== "[object Object]") {
    throw new Error("Input wasn't a JSON object:\n" + input);
  }

  return obj;
}

function array(input) {
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

module.exports = {
  object,
  array,
};
