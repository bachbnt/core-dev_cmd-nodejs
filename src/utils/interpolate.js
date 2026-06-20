// Copyright (c) 2026 bachbnt

function interpolate(value, context, label) {
  return value.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (match, key) => {
    if (context[key] === undefined) throw new Error(`Unknown ${label}: ${key}`);
    return String(context[key]);
  });
}

module.exports = { interpolate };
