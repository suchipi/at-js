async function read(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

module.exports = async function readStdin() {
  if (process.stdin.isTTY) {
    return null;
  }

  return read(process.stdin);
};
