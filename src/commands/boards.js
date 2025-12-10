import ora from 'ora';
import { FizzyAPI } from '../lib/api.js';
import { success, error, json, printTable, truncate } from '../lib/output.js';

export function boardsCommand(program) {
  const boards = program
    .command('boards')
    .description('Manage boards');

  boards
    .command('list')
    .alias('ls')
    .description('List all boards')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching boards...').start();
      try {
        const api = new FizzyAPI();
        const boardList = await api.listBoards();
        spinner.stop();

        if (options.json) {
          json(boardList);
          return;
        }

        if (!boardList || boardList.length === 0) {
          console.log('No boards found.');
          return;
        }

        printTable(
          ['ID', 'Name', 'Description', 'Cards'],
          boardList.map(b => [
            b.id,
            b.name,
            truncate(b.description, 40),
            b.cards_count || '-',
          ])
        );
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  boards
    .command('show <id>')
    .description('Show board details')
    .option('--json', 'Output as JSON')
    .action(async (id, options) => {
      const spinner = ora('Fetching board...').start();
      try {
        const api = new FizzyAPI();
        const board = await api.getBoard(id);
        spinner.stop();

        if (options.json) {
          json(board);
          return;
        }

        console.log(`\nBoard: ${board.name}`);
        console.log(`ID: ${board.id}`);
        if (board.description) {
          console.log(`Description: ${board.description}`);
        }

        if (board.columns && board.columns.length > 0) {
          console.log('\nColumns:');
          printTable(
            ['ID', 'Name', 'Position'],
            board.columns.map(c => [c.id, c.name, c.position])
          );
        }
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  boards
    .command('create <name>')
    .description('Create a new board')
    .option('-d, --description <description>', 'Board description')
    .option('--json', 'Output as JSON')
    .action(async (name, options) => {
      const spinner = ora('Creating board...').start();
      try {
        const api = new FizzyAPI();
        const board = await api.createBoard({
          name,
          description: options.description,
        });
        spinner.stop();

        if (options.json) {
          json(board);
          return;
        }

        success(`Board created: ${board.name} (ID: ${board.id})`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  boards
    .command('update <id>')
    .description('Update a board')
    .option('-n, --name <name>', 'New name')
    .option('-d, --description <description>', 'New description')
    .option('--json', 'Output as JSON')
    .action(async (id, options) => {
      const data = {};
      if (options.name) data.name = options.name;
      if (options.description) data.description = options.description;

      if (Object.keys(data).length === 0) {
        error('No update options provided. Use --name or --description');
        process.exit(1);
      }

      const spinner = ora('Updating board...').start();
      try {
        const api = new FizzyAPI();
        const board = await api.updateBoard(id, data);
        spinner.stop();

        if (options.json) {
          json(board);
          return;
        }

        success(`Board updated: ${board.name}`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  boards
    .command('delete <id>')
    .description('Delete a board')
    .action(async (id) => {
      const spinner = ora('Deleting board...').start();
      try {
        const api = new FizzyAPI();
        await api.deleteBoard(id);
        spinner.stop();
        success('Board deleted');
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}
