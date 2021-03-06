#!/usr/bin/env node

"use strict";

const { execSync } = require("child_process");
const program = require("commander");
const pkg = require("./package.json");
const fs = require("fs");
const path = require("path");

const executeCmd = async cmd => {
  return await new Promise(async (resolve, reject) => {
    try {
      await execSync(cmd, { stdio: "inherit" });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
const escapeQuotes = string => string.replace(/("|')/gm, `\\$1`);
const stringify = string => JSON.stringify(string).replace(/("|')/gm, `\$1`);
const compose = (...functions) => args =>
  functions.reduceRight((arg, fn) => fn(arg), args);
const redConsoleText = string => `\x1b[31m${string}\x1b[0m`;
const greenConsoleText = string => `\x1b[32m${string}\x1b[0m`;
const yellowConsoleText = string => `\x1b[33m${string}\x1b[0m`;
const boldConsoleText = string => `\x1b[1m${string}\x1b[0m`;
let currentStep = 1;
const logStep = async (step, addSpace = true, totalSteps) => {
  if (addSpace) console.log("");
  console.log(
    compose(
      greenConsoleText,
      boldConsoleText
    )(`${currentStep}/${totalSteps} ${step}`)
  );
  console.log("----------------------------");
  currentStep++;
};
const executeStep = async (totalSteps, label, ...cmds) => {
  const { text, addSpace = true } = label;
  logStep(text, addSpace, totalSteps);
  await cmds.forEach(async cmd => {
    if (typeof cmd === "string") return await executeCmd(cmd);
    await cmd();
  });
};
const readFile = async filePath => {
  const file = await fs.readFileSync(
    path.resolve(__dirname + filePath),
    "utf8"
  );

  return escapeQuotes(file);
};

program
  .version(pkg.version)
  .arguments("<appName>")
  .option("--npm", "Use NPM as the package manager.")
  .option("--commitizen", "Install and setup commitizen")
  .action(async function(appName, cmd) {
    const pkgMngr = cmd.npm ? "npm" : "yarn";
    const installCmd = pkgMngr === "yarn" ? `yarn add` : `npm i`;
    const settingsJson = await readFile("/boilerplate/settings.json");
    const eslintrc = await readFile("/boilerplate/.eslintrc.json");
    const jestConfigJs = await readFile("/boilerplate/jest.config.js");
    const eznymeSetup = await readFile("/boilerplate/enzymeSetup.ts");
    const nodeVersionArr = process.version
      .replace(/v([\d\.]+)/, "$1")
      .split(".");
    const nodeVersion = {
      major: Number.parseInt(nodeVersionArr[0]),
      minor: Number.parseInt(nodeVersionArr[1]),
      patch: Number.parseInt(nodeVersionArr[3])
    };

    if (nodeVersion.major < 10)
      return console.error(
        compose(
          boldConsoleText,
          redConsoleText
        )(
          `Your current Node version is ${
            process.version
          }. Your Node version must be 10.* or above.`
        )
      );

    if (fs.existsSync(appName))
      return console.error(
        compose(
          boldConsoleText,
          redConsoleText
        )("That project already exists.")
      );

    if (Number.parseInt(process.version) >= 10)
      return console.error("Node version must be >= 10.*");

    if (cmd.npm)
      console.log(
        yellowConsoleText(
          "Detected --npm flag. NPM will be used as the package manager for this install."
        )
      );

    const steps = [
      [
        {
          text: "Creating your React app with create-react-app",
          addSpace: false
        },
        `npx create-react-app ${appName} --typescript`
      ],
      [
        { text: "Installing linters" },
        () => process.chdir(appName),
        `${installCmd} -D prettier eslint-config-prettier eslint-plugin-prettier eslint-plugin-react @typescript-eslint/eslint-plugin @typescript-eslint/parser`
      ],
      [
        { text: "Setting up linter pre-commit hooks" },
        `npx mrm lint-staged`,
        `npx json -I -f package.json -e "this[\\"lint-staged\\"]={'*.{ts,tsx}': ['eslint --fix','git add'], '*.{scss,js,md,json}': ['prettier --write','git add']}"`
      ],
      [
        { text: "Adding Eslint config" },
        `printf ${stringify(eslintrc)} >> ./.eslintrc.json`
      ],
      [
        { text: "Adding VSCode workspace settings" },
        `mkdir .vscode`,
        `printf ${stringify(settingsJson)} >> ./.vscode/settings.json`,
        async () => {
          if (pkgMngr === "npm")
            await executeCmd(
              `npx json -I -f ./.vscode/settings.json -e "this.eslint.packageManager=\\"npm\\""`
            );
        }
      ],
      [
        { text: "Adding lint script to package.json" },
        `npx json -I -f ./package.json -e "this.scripts.lint=\\"tsc --noEmit && eslint '*/**/*.{js,ts,tsx}' --quiet --fix\\""`
      ],
      [
        { text: "Add Jest & Enzyme" },
        `${installCmd} -D @types/jest ts-jest @types/enzyme enzyme-to-json enzyme-adapter-react-16 @types/enzyme-adapter-react-16 `,
        `printf "${jestConfigJs}" >> jest.config.js`,
        `printf "${eznymeSetup}" >> src/ezymeSetup.ts`
      ]
    ];

    if (cmd.commitizen)
      steps.push([
        { text: `Add commitizen` },
        `yarn add -D commitizen`,
        `npx commitizen init cz-conventional-changelog --save-dev --save-exact`,
        `npx json -I -f ./package.json -e "this.scripts.commit=\\"git-cz\\""`
      ]);

    if (cmd.npm) {
      steps.push([{ text: "Cleaning up" }, `rm yarn.lock`, `npm install`]);
    } else {
      steps.push([{ text: "Cleaning up" }]);
      const lastStepIndex = steps.length - 1;
      if (fs.existsSync(`${appName}/package-lock.json`))
        steps[lastStepIndex].push(`rm package-lock.json`);
      steps[lastStepIndex].push(`yarn install`);
    }

    steps.push([
      { text: `Creating initial commits` },
      `git add .`,
      `git commit -m "initial setup"`
    ]);

    await steps.forEach(async step => {
      await executeStep(steps.length, ...step);
    });

    console.log("");
    console.log(boldConsoleText("Finished!"));
  });

program.parse(process.argv);
