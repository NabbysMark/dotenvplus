# Envitect

Envitect is a flexible environment configuration loader and processor for Node.js projects. It allows you to define your environment in a custom `.envit` file with type-checking, custom type definitions (both inline and external), and variable interpolation.

For full documentation, visit [Envitect Documentation](https://envitect.glitch.me/).

## Features

- **Type Checking:** Define types such as `number`, `boolean`, `string`, `date`, `list`, and `dictionary`.
- **Custom Types:** Create your own types inline or via external `.envtype` files.
- **Variable Interpolation:** Reference other variables (with fallback values) and system environment variables.

## Usage

### Loading Environment Variables

Create an environment file (e.g. `.envit`) with your configuration. For example:

```conf
PORT: number = 3000
DEBUG: boolean = true

type database = {
    host: string,
    port: number,
    user: string,
    password: any
}

DBINFO: database = {
    "host": "localhost",
    "port": 5432,
    "user": "admin",
    "password": "secret"
}

WELCOME_MSG: string = "Server running on port ${PORT}"
```

Then, load the environment variables by providing the directory containing the file:

```javascript
const { loadEnvPlus } = require("envitect");
loadEnvPlus(__dirname); // Pass the directory where your .envit file resides
console.log(process.envp);
```

### Defining Custom Types

Define custom types inline in your environment file, or load them externally using:

```conf
REQUIRE_ENVTYPE("relative/path/to/types.envtype")
```

An external custom type file might look like:

```conf
// filepath: types.envtype
type database = {
    host: string,
    port: number,
    user: string,
    password: any
}
```
