const path = require("path");

module.exports = function binaryName() {
  return path.basename(process.argv[1]);
};
