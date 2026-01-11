import ora from 'ora';
import { FizzyAPI } from '../lib/api.js';
import { success, error, json, printTable } from '../lib/output.js';

export function columnsCommand(program) {
  const columns = program
    .command('columns')
    .description('Manage board columns');

  columns
    .command('list <boardId>')
    .alias('ls')
    .description('List columns for a board')
    .option('--json', 'Output as JSON')
    .action(async (boardId, options) => {
      const spinner = ora('Fetching columns...').start();
      try {
        const api = new FizzyAPI();
        const columnList = await api.listColumns(boardId);
        spinner.stop();

        if (options.json) {
          json(columnList);
          return;
        }

        if (!columnList || columnList.length === 0) {
          console.log('No columns found.');
          return;
        }

        printTable(
          ['ID', 'Name', 'Color'],
          columnList.map(c => [
            c.id,
            c.name,
            c.color?.name || '-',
          ])
        );
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  columns
    .command('create <boardId> <name>')
    .description('Create a new column')
    .option('-c, --color <color>', 'Column color')
    .option('--json', 'Output as JSON')
    .action(async (boardId, name, options) => {
      const spinner = ora('Creating column...').start();
      try {
        const api = new FizzyAPI();
        const data = { name };
        if (options.color) data.color = options.color;

        const column = await api.createColumn(boardId, data);
        spinner.stop();

        if (options.json) {
          json(column);
          return;
        }

        success(`Column created: ${name}`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  columns
    .command('update <boardId> <columnId>')
    .description('Update a column')
    .option('-n, --name <name>', 'New name')
    .option('-c, --color <color>', 'New color')
    .option('--json', 'Output as JSON')
    .action(async (boardId, columnId, options) => {
      const data = {};
      if (options.name) data.name = options.name;
      if (options.color) data.color = options.color;

      if (Object.keys(data).length === 0) {
        error('No update options provided. Use --name or --color');
        process.exit(1);
      }

      const spinner = ora('Updating column...').start();
      try {
        const api = new FizzyAPI();
        await api.updateColumn(boardId, columnId, data);
        spinner.stop();

        if (options.json) {
          const columnList = await api.listColumns(boardId);
          const updated = columnList.find(c => c.id === columnId);
          json(updated);
          return;
        }

        success('Column updated');
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  columns
    .command('delete <boardId> <columnId>')
    .description('Delete a column')
    .action(async (boardId, columnId) => {
      const spinner = ora('Deleting column...').start();
      try {
        const api = new FizzyAPI();
        await api.deleteColumn(boardId, columnId);
        spinner.stop();
        success('Column deleted');
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}
