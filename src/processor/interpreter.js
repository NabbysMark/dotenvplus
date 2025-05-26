function parseWithCustomType(val, typeDef) {
  let obj = JSON.parse(val);
  for (let key in typeDef) {
    const expected = typeDef[key].toLowerCase();
    if (expected === "number") {
      obj[key] = Number(obj[key]);
    } else if (expected === "boolean") {
      obj[key] = String(obj[key]).toLowerCase() === "true";
    } else if (expected === "date") {
      obj[key] = new Date(obj[key]);
    }
  }
  return obj;
}

function interpolate(str, mapping) {
  return str.replace(
    /\$\{(ENV:)?([A-Z0-9_]+)(:-([^}]+))?\}/g,
    (match, envPrefix, key, _fallbackPart, fallback) => {
      let value;
      if (envPrefix) {
        value = process.env[key];
      } else {
        value = mapping[key];
      }
      return value !== undefined && value !== null
        ? value
        : fallback !== undefined
        ? fallback
        : "";
    }
  );
}

function interpret(ast, customTypes = {}) {
  const env = {};
  for (const node of ast) {
    let parsed;
    try {
      if (node.type) {
        if (node.type === "number") {
          parsed = Number(node.value);
        } else if (node.type === "boolean") {
          parsed = node.value.toLowerCase() === "true";
        } else if (node.type === "list" || node.type === "dictionary") {
          parsed = JSON.parse(node.value);
        } else if (node.type === "date") {
          if (node.value.trim().toUpperCase() === "TODAY") {
            parsed = new Date();
          } else {
            parsed = new Date(node.value);
          }
        } else if (node.type === "string") {
          parsed = node.value;
        } else if (customTypes[node.type.toLowerCase()]) {
          parsed = parseWithCustomType(
            node.value,
            customTypes[node.type.toLowerCase()]
          );
        } else {
          console.error(
            `Error: Type "${node.type}" for key ${node.key} is not recognized.`
          );
          process.exit(1);
        }
      } else {
        parsed = node.value;
      }
    } catch (e) {
      console.error(`Error interpreting key ${node.key}:`, e);
      parsed = node.value;
    }
    env[node.key] = { value: parsed, type: node.type || "string" };
  }

  const mapping = {};
  for (const key in env) {
    mapping[key] =
      typeof env[key].value === "string"
        ? env[key].value
        : String(env[key].value);
  }

  for (const key in env) {
    if (env[key].type === "string" && env[key].value.includes("${")) {
      let interpolated = env[key].value;
      let prev;
      do {
        prev = interpolated;
        interpolated = interpolate(prev, mapping);
      } while (interpolated !== prev);
      env[key].value = interpolated;
      mapping[key] = interpolated;
    }
  }
  return env;
}

module.exports = { interpret };
