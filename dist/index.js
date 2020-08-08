#!/usr/bin/env node
'use strict';

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

/**
 * @author qinyueshang
 * @date 2019-12-03 16:37:38
 * @Description: Do not modify
 */

function _empty() {}

var run = _async(function (root, appName, useVue, version, verbose, originalDirectory, useYarn) {
  var packageToInstall = getInstallPackage(useVue, version, originalDirectory); // const packageName = getPackageInfo(packageToInstall);
  // console.log(`Installing ${chalk.cyan(packageName)} ...`);

  var templateName = "react-template";

  if (useVue) {
    templateName = "vue-template";
  }

  console.log("Installing ".concat(chalk.cyan(process.cwd()), " ..."));
  return _continue(_catch(function () {
    return _awaitIgnored(install(root, useYarn, [packageToInstall], verbose));
  }, function (e) {
    console.log(e);
  }), function () {
    var scriptsPath = path.resolve(process.cwd(), "node_modules", templateName, "scripts", "init.js");

    var init = require(scriptsPath);

    init(root, appName, verbose, originalDirectory, useYarn);
  });
});

function _call(body, then, direct) {
  if (direct) {
    return then ? then(body()) : body();
  }

  try {
    var result = Promise.resolve(body());
    return then ? result.then(then) : result;
  } catch (e) {
    return Promise.reject(e);
  }
}

var createApp = _async(function (name, useVue, verbose, version, useNpm) {
  var root = path.resolve(name);
  var appName = path.basename(root);
  checkAppName(appName); //checkGit();

  fs.ensureDirSync(name); //checkingDirectoryExists(root, name);

  console.log("Installing ".concat(chalk.cyan(useVue), " ..."));
  var useYarn = useNpm ? false : shouldUseYarn();

  if (!useYarn && !checkThatNpmCanReadCwd()) {
    process.exit(1);
  }

  if (useNpm) {
    checkNpmVersion();
  }

  return _continue(_catch(function () {
    return _callIgnored(checkIsOnline);
  }, function () {
    console.warn("\n            ".concat(chalk.yellow("You appear to be offline."), "\n            Please check the network.\n        "));
    process.exit(1);
  }), function () {
    console.log("Creating a new app in ".concat(chalk.green(root), "."));
    var packageJson = {
      name: appName,
      version: "0.0.1",
      "private": true
    };
    fs.writeFileSync(path.join(root, "package.json"), JSON.stringify(packageJson, null, 2) + os.EOL);
    var originalDirectory = process.cwd();
    process.chdir(root);
    run(root, appName, useVue, version, verbose, originalDirectory, useYarn);
  });
});

function _callIgnored(body, direct) {
  return _call(body, _empty, direct);
}

var chalk = require("chalk");

function _catch(body, recover) {
  try {
    var result = body();
  } catch (e) {
    return recover(e);
  }

  if (result && result.then) {
    return result.then(void 0, recover);
  }

  return result;
}

var commander = require("commander");

function _continue(value, then) {
  return value && value.then ? value.then(then) : then(value);
}

var dns = require("dns");

function _async(f) {
  return function () {
    for (var args = [], i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }

    try {
      return Promise.resolve(f.apply(this, args));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}

var envinfo = require("envinfo");

function _awaitIgnored(value, direct) {
  if (!direct) {
    return value && value.then ? value.then(_empty) : Promise.resolve();
  }
}

var execSync = require("child_process").execSync;

var fs = require("fs-extra");

var os = require("os");

var path = require("path");

var semver = require("semver");

var spawn = require("cross-spawn");

var validateProjectName = require("validate-npm-package-name");

var packageJson = require("./package.json");

var projectName;
var program = new commander.Command(packageJson.name).version(packageJson.version).arguments("<project-directory>").usage("".concat(chalk.green("<project-directory>"), " [options]")).action(function (name) {
  projectName = name;
}).option("--vue", "default react app,could create vue app").option("--verbose", "print additional logs").option("--info", "print environment debug info").option("--use-npm", "mandatory use of NPM initial app").option("--scripts-version", "template version").allowUnknownOption().parse(process.argv);

if (program.info) {
  console.log(chalk.bold("\nEnvironment Info:"));
  envinfo.run({
    System: ["OS", "CPU"],
    Binaries: ["Node", "npm", "Yarn"],
    Browsers: ["Chrome", "Edge", "Internet Explorer", "Firefox", "Safari"],
    npmGlobalPackages: ["app-create"]
  }, {
    duplicates: true,
    showNotFound: true
  }).then(console.log);
}

if (typeof projectName === "undefined") {
  console.error("Please specify the project directory:");
  console.log("  ".concat(chalk.cyan(program.name()), " ").concat(chalk.green("<project-directory>")));
  console.log();
  console.log("For example:");
  console.log("  ".concat(chalk.cyan(program.name()), " ").concat(chalk.green("my-react-app")));
  console.log();
  console.log("Run ".concat(chalk.cyan("".concat(program.name(), " --help")), " to see all options."));
  process.exit(1);
}

createApp(projectName, program.vue, program.verbose, program.scriptsVersion, program.useNpm);

function getInstallPackage(useVue, version, originalDirectory) {
  var packageToInstall = "https://github.com/qinyueshang/react-template.git"; //react template

  if (useVue) {
    packageToInstall = "https://github.com/qinyueshang/vue-template.git";
  }

  var validSemver = semver.valid(version);

  if (validSemver) {
    packageToInstall += "@".concat(validSemver);
  } else if (version) {
    if (version[0] === "@" && version.indexOf("/") === -1) {
      packageToInstall += version;
    } else if (version.match(/^file:/)) {
      packageToInstall = "file:".concat(path.resolve(originalDirectory, version.match(/^file:(.*)?$/)[1]));
    } else {
      process.exit(1);
    }
  }

  return packageToInstall;
}

function install(root, useYarn, dependencies, verbose) {
  return new Promise(function (resolve, reject) {
    var command;
    var args;

    if (useYarn) {
      command = "yarnpkg";
      args = ["add"].concat(_toConsumableArray(dependencies));
      args.push("--cwd");
      args.push(root);
    } else {
      command = "npm";
      args = ["install", "--save", "--save-exact", "--loglevel", "error"].concat(dependencies);
    }

    if (verbose) {
      args.push("--verbose");
    }

    var child = spawn(command, args, {
      stdio: "inherit"
    });
    child.on("close", function (code) {
      if (code !== 0) {
        reject({
          command: "".concat(command, " ").concat(args.join(" "))
        });
        return;
      }

      resolve();
    });
  });
}

function shouldUseYarn() {
  try {
    execSync("yarnpkg --version", {
      stdio: "ignore"
    });
    return true;
  } catch (e) {
    return false;
  }
}

function checkNpmVersion() {
  var hasMinNpm = false;
  var npmVersion = null;

  try {
    npmVersion = execSync("npm --version").toString().trim();
    hasMinNpm = semver.gte(npmVersion, "5.0.0");
    console.log(chalk.yellow("npm version ".concat(npmVersion)));

    if (!hasMinNpm && npmVersion) {
      console.log(chalk.yellow("You are using npm ".concat(npmVersion, " so the project will be bootstrapped with an old unsupported version of tools.\n\n") + "Please update to npm 5 or higher for a better, fully supported experience.\n"));
      process.exit(1);
    }
  } catch (err) {
    console.log(chalk.red("error:Create App require npm.Please install npm first."));
    process.exit(1);
  }
}

function checkIsOnline() {
  return new Promise(function (resolve, reject) {
    dns.lookup("github.com", function (err) {
      var proxy;

      if (err != null && (proxy = getProxy())) {
        // If a proxy is defined, we likely can't resolve external hostnames.
        // Try to resolve the proxy name as an indication of a connection.
        dns.lookup(url.parse(proxy).hostname, function (proxyErr) {
          proxyErr == null ? resolve() : reject(proxyErr);
        });
      } else {
        err == null ? resolve() : reject(err);
      }
    });
  });
}

function checkThatNpmCanReadCwd() {
  var cwd = process.cwd();
  var childOutput = null;

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

  var lines = childOutput.split("\n"); // `npm config list` output includes the following line:
  // "; cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.

  var prefix = "; cwd = ";
  var line = lines.find(function (line) {
    return line.indexOf(prefix) === 0;
  });

  if (typeof line !== "string") {
    // Fail gracefully. They could remove it.
    return true;
  }

  var npmCWD = line.substring(prefix.length);

  if (npmCWD === cwd) {
    return true;
  }

  console.error(chalk.red("Could not start an npm process in the right directory.\n\n" + "The current directory is: ".concat(chalk.bold(cwd), "\n") + "However, a newly started npm process runs in: ".concat(chalk.bold(npmCWD), "\n\n") + "This is probably caused by a misconfigured system terminal shell."));

  if (process.platform === "win32") {
    console.error(chalk.red("On Windows, this can usually be fixed by running:\n\n") + "  ".concat(chalk.cyan("reg"), " delete \"HKCU\\Software\\Microsoft\\Command Processor\" /v AutoRun /f\n") + "  ".concat(chalk.cyan("reg"), " delete \"HKLM\\Software\\Microsoft\\Command Processor\" /v AutoRun /f\n\n") + chalk.red("Try to run the above two lines in the terminal.\n") + chalk.red("To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/"));
  }

  return false;
}

function checkAppName(appName) {
  var validationResult = validateProjectName(appName);

  if (!validationResult.validForNewPackages) {
    console.error("Could not create a project called ".concat(chalk.red("\"".concat(appName, "\"")), " because of npm naming restrictions:"));
    printValidationResults(validationResult.errors);
    printValidationResults(validationResult.warnings);
    process.exit(1);
  } // TODO: there should be a single place that holds the dependencies


  var dependencies = ["react", "react-dom", "react-scripts"].sort();

  if (dependencies.indexOf(appName) >= 0) {
    console.error(chalk.red("We cannot create a project called ".concat(chalk.green(appName), " because a dependency with the same name exists.\n") + "Due to the way npm works, the following names are not allowed:\n\n") + chalk.cyan(dependencies.map(function (depName) {
      return "  ".concat(depName);
    }).join("\n")) + chalk.red("\n\nPlease choose a different project name."));
    process.exit(1);
  }
}

var currentNodeVersion = process.versions.node;
var semver$1 = currentNodeVersion.split(".");
var major = semver$1[0];

if (major < 8) {
  console.error("You are running Node " + currentNodeVersion + ".\n" + "Create React App requires Node 8 or higher. \n" + "Please update your version of Node.");
  process.exit(1);
}
