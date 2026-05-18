#!/usr/bin/env node
'use strict';

require('dotenv').config();
require('../src/cli/index').run(process.argv);
