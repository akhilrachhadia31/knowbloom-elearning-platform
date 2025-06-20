export function log(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

export function error(...args) {
  console.error(...args);
}
