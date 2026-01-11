#!/usr/bin/env node

import { program } from 'commander';
import { configCommand } from '../src/commands/config.js';
import { boardsCommand } from '../src/commands/boards.js';
import { columnsCommand } from '../src/commands/columns.js';
import { cardsCommand } from '../src/commands/cards.js';
import { identityCommand } from '../src/commands/identity.js';

program
  .name('fizzy')
  .description('CLI tool for interacting with Fizzy API')
  .version('1.0.0');

// Register commands
configCommand(program);
identityCommand(program);
boardsCommand(program);
columnsCommand(program);
cardsCommand(program);

program.parse();
