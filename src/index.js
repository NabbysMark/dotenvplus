const fs = require("fs");
const path = require("path");
const { lex } = require("./processor/lexer");
const { parseTokens } = require("./processor/parser");
const { interpret } = require("./processor/interpreter");

function loadEnvPlus(customDir) {
  if (!customDir) {
    console.error(
      "Error: Please provide a directory path for the .envit file."
    );
    process.exit(1);
  }

  const envSuffix = process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : "";
  const envFileName = `.envit${envSuffix}`;
  const envFilePath = path.join(customDir, envFileName);

  if (!fs.existsSync(envFilePath)) {
    console.error(`${envFileName} file not found in directory: ${customDir}`);
    process.exit(1);
  }

  let content = fs.readFileSync(envFilePath, "utf8");

  const lines = content.split(/\r?\n/);
  let remainingLines = [];
  const customTypeBlocks = [];
  let currentTypeBlock = null;
  let currentBraceCount = 0;
  const requireEnvTypePaths = [];
  for (let line of lines) {
    if (line.startsWith("REQUIRE_ENVTYPE(")) {
      const match = line.match(/REQUIRE_ENVTYPE\("(.+)"\)/);
      if (match) {
        requireEnvTypePaths.push(match[1]);
      }
      continue;
    }
    if (line.startsWith("type ")) {
      currentTypeBlock = line;
      currentBraceCount =
        (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (currentBraceCount === 0) {
        customTypeBlocks.push(currentTypeBlock);
        currentTypeBlock = null;
      }
      continue;
    } else if (currentTypeBlock) {
      currentTypeBlock += "\n" + line;
      currentBraceCount +=
        (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      if (currentBraceCount === 0) {
        customTypeBlocks.push(currentTypeBlock);
        currentTypeBlock = null;
      }
      continue;
    } else {
      remainingLines.push(line);
    }
  }
  content = remainingLines.join("\n");

  let externalTypeDefs = "";
  requireEnvTypePaths.forEach((relPath) => {
    const extPath = path.join(customDir, relPath);
    if (fs.existsSync(extPath)) {
      externalTypeDefs += "\n" + fs.readFileSync(extPath, "utf8");
    }
  });
  const allTypeDefs = customTypeBlocks.join("\n") + "\n" + externalTypeDefs;
  const customTypes = {};
  if (allTypeDefs.trim()) {
    const typeDefBlocks = allTypeDefs.split(/(?=^type\s+)/m);
    typeDefBlocks.forEach((block) => {
      const match = block.match(/^type\s+([A-Z0-9_]+)\s*=\s*(\{[\s\S]+\})/i);
      if (match) {
        const typeName = match[1].toLowerCase();
        let defStr = match[2];
        defStr = defStr.replace(
          /:\s*(string|number|boolean|date|list|dictionary|any)(\s*[},])/gi,
          ': "$1"$2'
        );
        try {
          const typeDef = JSON.parse(defStr);
          customTypes[typeName] = typeDef;
        } catch (e) {
          console.error("Error parsing type definition for", typeName, e);
        }
      }
    });
  }

  const tokens = lex(content);
  const ast = parseTokens(tokens);
  const envVars = interpret(ast, customTypes);
  process.envp = envVars;

  fs.watchFile(envFilePath, (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) {
      console.log(`${envFileName} changed. Reloading configuration...`);
      loadEnvPlus(customDir);
    }
  });

  return envVars;
}

if (require.main === module) {
  const envVars = loadEnvPlus(__dirname);
  console.log("Parsed .envit:", envVars);
}

module.exports = { loadEnvPlus };
