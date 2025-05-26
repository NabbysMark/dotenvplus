function lex(content) {
  const tokens = [];
  const lines = content.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    i++;
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Z0-9_]+)(?::\s*(\w+))?\s*=\s*(.+)$/i);
    if (!match) continue;
    tokens.push({ type: "IDENTIFIER", value: match[1] });
    if (match[2]) {
      tokens.push({ type: "TYPE", value: match[2].toLowerCase() });
    }
    tokens.push({ type: "EQUAL", value: "=" });
    let valuePart = match[3].trim();
    if (
      (valuePart.startsWith("{") && !valuePart.trim().endsWith("}")) ||
      (valuePart.startsWith("[") && !valuePart.trim().endsWith("]"))
    ) {
      const opening = valuePart[0];
      const closing = opening === "{" ? "}" : "]";
      const multiline = [valuePart];
      while (i < lines.length) {
        const nextLine = lines[i];
        multiline.push(nextLine);
        i++;
        if (nextLine.trim().endsWith(closing)) break;
      }
      valuePart = multiline.join("\n");
    }
    tokens.push({ type: "VALUE", value: valuePart });
    tokens.push({ type: "NEWLINE", value: "\n" });
  }
  return tokens;
}

module.exports = { lex };
