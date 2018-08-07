function serial(args) {
  let result = Promise.resolve();

  args.forEach((arg) => {
    result = result.then(() => arg());
  });

  return result;
}

module.exports = { serial };