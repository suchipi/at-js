const path = require("path");

module.exports = function binaryName() {
  return path.relative(path.resolve(__dirname, "..", "bin"), process.argv[1]);
};
