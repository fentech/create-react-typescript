# Create React Typescript
Do you need to start up a React app with the configuration provided by [create-react-app](https://github.com/facebook/create-react-app), but also need TypeScript with linting configured, so you can start working?

Just run:
```
$ npx create-react-typescript <package-name>
```

This command will use CRA to spin-up a new React app with TypeScript, install ESLint and Prettier, add ESLint configuration for React with Typescript, add a pre-commit to run linting, add a lint script to your package.json, and add vscode workspace settings to run ESLint on save.

Use the option flag `--npm` if you prefer to use NPM as your package manager instead of Yarn.
