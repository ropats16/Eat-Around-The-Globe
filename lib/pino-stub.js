// Stub for pino logger - used in browser environment
// WalletConnect uses pino for logging, but we don't need it in the browser
const noop = () => {};
const noopLogger = {
  trace: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  fatal: noop,
  silent: noop,
  child: () => noopLogger,
  level: 'silent',
};

module.exports = () => noopLogger;
module.exports.default = () => noopLogger;
module.exports.pino = () => noopLogger;

