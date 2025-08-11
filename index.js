"use strict";

const { start } = require("./src/server");

require("dotenv").config();

const port = process.env.PORT || 2020; // fallback for local dev

start(port);
