const kleur = require("kleur");
const changeCase = require("change-case");
const EMPTY = require("./empty");

/** returns EMPTY on failure */
module.exports = function autoRequire(env, globalName) {
  try {
    const result = env.require(globalName);
    console.error(
      kleur.dim(`auto-required ${JSON.stringify(globalName)} as ${globalName}`)
    );
    return result;
  } catch (err) {
    try {
      const source = changeCase.paramCase(globalName);

      const result = env.require(source);
      console.error(
        kleur.dim(`auto-required ${JSON.stringify(source)} as ${globalName}`)
      );
      return result;
    } catch (err) {
      try {
        const source = changeCase
          .paramCase(
            globalName
              .replace(/^__/, "suchipi-at-js-placeholder-at")
              .replace("_", "suchipi-at-js-placeholder-slash")
          )
          .replace("suchipi-at-js-placeholder-at", "@")
          .replace("suchipi-at-js-placeholder-slash", "/");

        const result = env.require(source);
        console.error(
          kleur.dim(`auto-required ${JSON.stringify(source)} as ${globalName}`)
        );
        return result;
      } catch (err) {
        return EMPTY;
      }
    }
  }
};
