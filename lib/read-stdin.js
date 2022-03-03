const path = require("path");

async function read(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

module.exports = async function readStdin() {
  if (process.stdin.isTTY) {
    throw new Error(
      `Pipe into ${path.relative(
        path.resolve(__dirname, "..", "bin"),
        process.argv[1]
      )} instead of calling it interactively`
    );
  }

  return read(process.stdin);
};
