function parseTokens(tokens) {
  const ast = [];
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].type === "NEWLINE") {
      i++;
      continue;
    }
    const node = {};

    if (tokens[i] && tokens[i].type === "IDENTIFIER") {
      node.key = tokens[i].value;
      i++;
    }
    if (tokens[i] && tokens[i].type === "TYPE") {
      node.type = tokens[i].value;
      i++;
    }
    if (tokens[i] && tokens[i].type === "EQUAL") {
      i++;
    }
    if (tokens[i] && tokens[i].type === "VALUE") {
      node.value = tokens[i].value;
      i++;
    }
    if (tokens[i] && tokens[i].type === "NEWLINE") {
      i++;
    }
    ast.push(node);
  }
  return ast;
}

module.exports = { parseTokens };
