export function forEachValue(obj, fn) {
  Object.keys(obj).forEach((key) => fn(obj[key], key));
}

export function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}
