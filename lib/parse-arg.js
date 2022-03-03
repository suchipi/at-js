const runExpression = require("./run-expression");

module.exports = function parseArg(arg) {
  try {
    return runExpression(arg);
  } catch (err) {
    try {
      return JSON.parse(arg);
    } catch (err) {
      return arg;
    }
  }
};
