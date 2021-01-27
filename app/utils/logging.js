const i = (...params) =>
  process.env.NODE_ENV !== "test" ? console.log(...params) : null;

const e = (...params) => console.log(...params);

module.exports = { i, e };
