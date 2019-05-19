# Create React Typescript
Do you need to start up a React app with the configuration provided by [create-react-app](https://github.com/facebook/create-react-app), but also need TypeScript with linting configured, so you can start working?

Just run:
```
$ npx create-react-typescript <package-name>
```

This command will:
* Use CRA to spin-up a new React app with TypeScript
* Installs ESLint and Prettier
* Adds ESLint configuration for React with Typescript
* Adds a pre-commit to run linting
* Adds a lint script to your package.json
* Adds vscode workspace settings to run ESLint on save
* Installs and sets up Jest and Enzyme

## Options

### `--npm`
Use the option `--npm` if you prefer to use NPM as your package manager instead of Yarn.

### `--commitizen`
Install and setup [commitizen](https://github.com/commitizen/cz-cli).
