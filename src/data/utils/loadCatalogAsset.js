/**
 * Runtime detection for shared catalog modules.
 * @returns {boolean}
 */
export function isNodeRuntime() {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}
