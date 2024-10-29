/**
 * @param {string} expressionString input (command-line) expression string
 * @returns expression string with convenience syntax stuff applied
 */
module.exports = function parseExpression(expressionString) {
  let parsedExpressionString = expressionString;

  if (expressionString.startsWith(".[")) {
    parsedExpressionString = expressionString.replace(/^\./, "$it => $it");
  } else if (expressionString.startsWith(".")) {
    parsedExpressionString = "$it => $it" + expressionString;
  } else if (/\$it\b/.test(parsedExpressionString)) {
    parsedExpressionString = "$it => " + expressionString;
  }

  return parsedExpressionString;
};
