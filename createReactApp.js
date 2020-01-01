/**
 * @author qinyueshang
 * @date 2019-12-03 16:37:38
 * @Description: Do not modify
 */

"use strict";

const chalk = require("chalk");
const commander = require("commander");
const dns = require("dns");
const envinfo = require("envinfo");
const execSync = require("child_process").execSync;
const fs = require("fs-extra");

const os = require("os");
const path = require("path");
const semver = require("semver");
const spawn = require("cross-spawn");
const validateProjectName = require("validate-npm-package-name");
const packageJson = require("./package.json");

let projectName;

const program = new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments("<project-directory>")
  .usage(`${chalk.green("<project-directory>")} [options]`)
  .action(name => {
    projectName = name;
  })
  .option("--verbose", "print additional logs")
  .option("--info", "print environment debug info")
  .option("--use-npm", "mandatory use of NPM initial app")
  .option("--scripts-version", "template version")
  .allowUnknownOption()
  .parse(process.argv);

if (program.info) {
  console.log(chalk.bold("\nEnvironment Info:"));
  return envinfo
    .run(
      {
        System: ["OS", "CPU"],
        Binaries: ["Node", "npm", "Yarn"],
        Browsers: ["Chrome", "Edge", "Internet Explorer", "Firefox", "Safari"],
        npmGlobalPackages: ["app-create"]
      },
      {
        duplicates: true,
        showNotFound: true
      }
    )
    .then(console.log);
}

if (typeof projectName === "undefined") {
  console.error("Please specify the project directory:");
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green("<project-directory>")}`
  );
  console.log();
  console.log("For example:");
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green("my-react-app")}`);
  console.log();
  console.log(
    `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
  );
  process.exit(1);
}

createApp(projectName, program.verbose, program.scriptsVersion, program.useNpm);

async function createApp(name, verbose, version, useNpm) {
  const root = path.resolve(name);
  const appName = path.basename(root);

  checkAppName(appName);
  //checkGit();
  fs.ensureDirSync(name);
  //checkingDirectoryExists(root, name);

  const useYarn = useNpm ? false : shouldUseYarn();
  if (!useYarn && !checkThatNpmCanReadCwd()) {
    process.exit(1);
  }
  if (!useYarn) {
    checkNpmVersion();
  }
  try {
    await checkIsOnline();
  } catch (e) {
    console.warn(`
            ${chalk.yellow("You appear to be offline.")}
            Please check the network.
        `);
    process.exit(1);
  }
  console.log(`Creating a new app in ${chalk.green(root)}.`);
  const packageJson = {
    name: appName,
    version: "0.0.1",
    private: true
  };
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );
  const originalDirectory = process.cwd();
  process.chdir(root);
  run(root, appName, version, verbose, originalDirectory, useYarn);
}

async function run(
  root,
  appName,
  version,
  verbose,
  originalDirectory,
  useYarn
) {
  const packageToInstall = getInstallPackage(version, originalDirectory);
  const packageName = getPackageInfo(packageToInstall);
  console.log(`Installing ${chalk.cyan(packageName)} ...`);
  console.log(`Installing ${chalk.cyan(process.cwd())} ...`);
  try {
    await install(root, useYarn, [packageToInstall], verbose);
  } catch (e) {
    console.log(e);
  }
  const scriptsPath = path.resolve(
    process.cwd(),
    "node_modules",
    "template",
    "scripts",
    "init.js"
  );
  const init = require(scriptsPath);
  init(root, appName, verbose, originalDirectory, useYarn);
}

function getInstallPackage(version, originalDirectory) {
  let packageToInstall = "https://github.com/qinyueshang/template.git";
  const validSemver = semver.valid(version);
  if (validSemver) {
    packageToInstall += `@${validSemver}`;
  } else if (version) {
    if (version[0] === "@" && version.indexOf("/") === -1) {
      packageToInstall += version;
    } else if (version.match(/^file:/)) {
      packageToInstall = `file:${path.resolve(
        originalDirectory,
        version.match(/^file:(.*)?$/)[1]
      )}`;
    } else {
      process.exit(1);
    }
  }
  return packageToInstall;
}
function getPackageInfo(installPackage) {
  if (installPackage.indexOf("git+") === 0) {
    // Pull package name out of git urls
    return installPackage.match(/([^/]+)\.git(#.*)?$/)[1];
  } else if (installPackage.match(/.+@/)) {
    // Do not match @scope/ when stripping off @version or @tag
    return installPackage.charAt(0) + installPackage.substr(1).split("@")[0];
  } else if (installPackage.match(/^file:/)) {
    const installPackagePath = installPackage.match(/^file:(.*)?$/)[1];
    const installPackageJson = require(path.join(
      installPackagePath,
      "package.json"
    ));
    return installPackageJson;
  }
  return installPackage;
}
function install(root, useYarn, dependencies, verbose) {
  return new Promise((resolve, reject) => {
    let command;
    let args;
    if (useYarn) {
      command = "yarnpkg";
      args = ["add", ...dependencies];
      args.push("--cwd");
      args.push(root);
    } else {
      command = "npm";
      args = [
        "install",
        "--save",
        "--save-exact",
        "--loglevel",
        "error"
      ].concat(dependencies);
    }

    if (verbose) {
      args.push("--verbose");
    }

    const child = spawn(command, args, { stdio: "inherit" });
    child.on("close", code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(" ")}`
        });
        return;
      }
      resolve();
    });
  });
}

function shouldUseYarn() {
  try {
    execSync("yarnpkg --version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}
function checkNpmVersion() {
  let hasMinNpm = false;
  let npmVersion = null;
  try {
    npmVersion = execSync("npm --version")
      .toString()
      .trim();
    hasMinNpm = semver.gte(npmVersion, "5.0.0");

    if (!hasMinNpm && npmVersion) {
      console.log(
        chalk.yellow(
          `You are using npm ${npmVersion} so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
            `Please update to npm 5 or higher for a better, fully supported experience.\n`
        )
      );
      process.exit(1);
    }
  } catch (err) {
    console.log(
      chalk.red("error:Create App require npm.Please install npm first.")
    );
    process.exit(1);
  }
}
function checkGit() {
  try {
    let gitVersion = execSync("git --version")
      .toString()
      .trim();
    if (!gitVersion) {
      console.error(
        chalk.red("error:Create App require Git.Please install Git first.")
      );
      process.exit(1);
    }
  } catch (e) {
    process.exit(1);
  }
}
function checkIsOnline() {
  return new Promise((resolve, reject) => {
    dns.lookup("github.com", err => {
      let proxy;
      if (err != null && (proxy = getProxy())) {
        // If a proxy is defined, we likely can't resolve external hostnames.
        // Try to resolve the proxy name as an indication of a connection.
        dns.lookup(url.parse(proxy).hostname, proxyErr => {
          proxyErr == null ? resolve() : reject(proxyErr);
        });
      } else {
        err == null ? resolve() : reject(err);
      }
    });
  });
}
function checkingDirectoryExists(root, name) {
  const conflicts = fs.readdirSync(root);

  if (conflicts.length > 0) {
    console.warn(
      `${chalk.red("error: ")}\nThe directory ${chalk.red(
        name
      )} already exists.\nEither try using a new directory name, or delete the directory and try again.
            `
    );
    process.exit(1);
  }
}
function checkThatNpmCanReadCwd() {
  const cwd = process.cwd();
  let childOutput = null;
  try {
    // Note: intentionally using spawn over exec since
    // the problem doesn't reproduce otherwise.
    // `npm config list` is the only reliable way I could find
    // to reproduce the wrong path. Just printing process.cwd()
    // in a Node process was not enough.
    childOutput = spawn.sync("npm", ["config", "list"]).output.join("");
  } catch (err) {
    // Something went wrong spawning node.
    // Not great, but it means we can't do this check.
    // We might fail later on, but let's continue.
    return true;
  }
  if (typeof childOutput !== "string") {
    return true;
  }
  const lines = childOutput.split("\n");
  // `npm config list` output includes the following line:
  // "; cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.
  const prefix = "; cwd = ";
  const line = lines.find(line => line.indexOf(prefix) === 0);
  if (typeof line !== "string") {
    // Fail gracefully. They could remove it.
    return true;
  }
  const npmCWD = line.substring(prefix.length);
  if (npmCWD === cwd) {
    return true;
  }
  console.error(
    chalk.red(
      `Could not start an npm process in the right directory.\n\n` +
        `The current directory is: ${chalk.bold(cwd)}\n` +
        `However, a newly started npm process runs in: ${chalk.bold(
          npmCWD
        )}\n\n` +
        `This is probably caused by a misconfigured system terminal shell.`
    )
  );
  if (process.platform === "win32") {
    console.error(
      chalk.red(`On Windows, this can usually be fixed by running:\n\n`) +
        `  ${chalk.cyan(
          "reg"
        )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
        `  ${chalk.cyan(
          "reg"
        )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
        chalk.red(`Try to run the above two lines in the terminal.\n`) +
        chalk.red(
          `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
        )
    );
  }
  return false;
}

function checkAppName(appName) {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${appName}"`
      )} because of npm naming restrictions:`
    );
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    process.exit(1);
  }

  // TODO: there should be a single place that holds the dependencies
  const dependencies = ["react", "react-dom", "react-scripts"].sort();
  if (dependencies.indexOf(appName) >= 0) {
    console.error(
      chalk.red(
        `We cannot create a project called ${chalk.green(
          appName
        )} because a dependency with the same name exists.\n` +
          `Due to the way npm works, the following names are not allowed:\n\n`
      ) +
        chalk.cyan(dependencies.map(depName => `  ${depName}`).join("\n")) +
        chalk.red("\n\nPlease choose a different project name.")
    );
    process.exit(1);
  }
}
