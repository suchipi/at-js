const path = require("path");
const binaryName = require("./binary-name");

module.exports = function printHelp(
  shortDescription,
  longDescription,
  examples
) {
  const binary = binaryName();

  const pkgJson = require("../package.json");

  const output = `${binary} - ${shortDescription}

Part of ${pkgJson.name} v${pkgJson.version}.

${longDescription
  .split("\n")
  .map((line) => line.trim().replace("@BINARY_NAME@", binary))
  .join("\n")
  .trim()}

Examples:

${examples
  .split("\n")
  .filter(Boolean)
  .map((line) => "  " + line.trim().replace("@BINARY_NAME@", binary))
  .join("\n")}
Other commands from ${pkgJson.name} v${pkgJson.version}:

- @: pass stdin through a JavaScript function
- @call: parse stdin as JSON, then call a method on it
- @for-each: evaluate a function once per item in input JSON array
- @join: join a JSON Array with a delimiter
- @log: run some JavaScript and log the result
- @map: map a JSON array into another JSON array, using a function
- @split: split stdin on a delimiter, and print the resulting strings as a JSON array

To view info about a command run it with \`--help\`, eg \`@call --help\`.
`;

  console.log(output);
  process.exit(0);
};
