#!/usr/bin/env node

/**
 * @author qinyueshang
 * @date 2019-12-03 16:37:38
 * @Description: Do not modify
 */

"use strict";

const currentNodeVersion = process.versions.node;
const semver = currentNodeVersion.split(".");
const major = semver[0];

if (major < 8) {
  console.error(
    "You are running Node " +
      currentNodeVersion +
      ".\n" +
      "Create React App requires Node 8 or higher. \n" +
      "Please update your version of Node."
  );
  process.exit(1);
}

require("./createReactApp");
