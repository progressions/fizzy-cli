import ora from 'ora';
import { FizzyAPI } from '../lib/api.js';
import { success, error, json, printTable, truncate, formatDate } from '../lib/output.js';

export function cardsCommand(program) {
  const cards = program
    .command('cards')
    .description('Manage cards');

  cards
    .command('list')
    .alias('ls')
    .description('List cards')
    .option('-b, --board <id>', 'Filter by board ID')
    .option('-c, --column <id>', 'Filter by column ID')
    .option('-a, --assignee <id>', 'Filter by assignee ID')
    .option('-t, --tag <id>', 'Filter by tag ID')
    .option('-s, --status <status>', 'Filter by status (open, closed)')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching cards...').start();
      try {
        const api = new FizzyAPI();
        const cardList = await api.listCards({
          board_id: options.board,
          column_id: options.column,
          assignee_id: options.assignee,
          tag_id: options.tag,
          status: options.status,
        });
        spinner.stop();

        if (options.json) {
          json(cardList);
          return;
        }

        if (!cardList || cardList.length === 0) {
          console.log('No cards found.');
          return;
        }

        printTable(
          ['#', 'Title', 'Status', 'Column', 'Updated'],
          cardList.map(c => [
            c.number,
            truncate(c.title, 40),
            c.closed_at ? 'closed' : 'open',
            c.column?.name || '-',
            formatDate(c.updated_at),
          ])
        );
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('show <number>')
    .description('Show card details')
    .option('--json', 'Output as JSON')
    .action(async (number, options) => {
      const spinner = ora('Fetching card...').start();
      try {
        const api = new FizzyAPI();
        const card = await api.getCard(number);
        spinner.stop();

        if (options.json) {
          json(card);
          return;
        }

        console.log(`\n#${card.number}: ${card.title}`);
        console.log(`Status: ${card.closed_at ? 'Closed' : 'Open'}`);
        console.log(`Board: ${card.board?.name || '-'}`);
        console.log(`Column: ${card.column?.name || '-'}`);
        console.log(`Created: ${formatDate(card.created_at)}`);
        console.log(`Updated: ${formatDate(card.updated_at)}`);

        if (card.assignees && card.assignees.length > 0) {
          console.log(`Assignees: ${card.assignees.map(a => a.name || a.email).join(', ')}`);
        }

        if (card.tags && card.tags.length > 0) {
          console.log(`Tags: ${card.tags.map(t => t.name).join(', ')}`);
        }

        if (card.content) {
          console.log(`\nContent:\n${card.content}`);
        }
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('create <boardId> <title>')
    .description('Create a new card')
    .option('-d, --description <content>', 'Card content/description')
    .option('-c, --column <id>', 'Column ID')
    .option('--json', 'Output as JSON')
    .action(async (boardId, title, options) => {
      const spinner = ora('Creating card...').start();
      try {
        const api = new FizzyAPI();
        const card = await api.createCard(boardId, {
          title,
          content: options.description,
          column_id: options.column,
        });
        spinner.stop();

        if (options.json) {
          json(card);
          return;
        }

        success(`Card created: #${card.number} - ${card.title}`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('update <number>')
    .description('Update a card')
    .option('-t, --title <title>', 'New title')
    .option('-d, --description <content>', 'New content')
    .option('-c, --column <id>', 'Move to column ID')
    .option('--json', 'Output as JSON')
    .action(async (number, options) => {
      const data = {};
      if (options.title) data.title = options.title;
      if (options.description) data.content = options.description;
      if (options.column) data.column_id = options.column;

      if (Object.keys(data).length === 0) {
        error('No update options provided. Use --title, --description, or --column');
        process.exit(1);
      }

      const spinner = ora('Updating card...').start();
      try {
        const api = new FizzyAPI();
        const card = await api.updateCard(number, data);
        spinner.stop();

        if (options.json) {
          json(card);
          return;
        }

        success(`Card updated: #${card.number}`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('close <number>')
    .description('Close a card')
    .action(async (number) => {
      const spinner = ora('Closing card...').start();
      try {
        const api = new FizzyAPI();
        await api.closeCard(number);
        spinner.stop();
        success(`Card #${number} closed`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('reopen <number>')
    .description('Reopen a closed card')
    .action(async (number) => {
      const spinner = ora('Reopening card...').start();
      try {
        const api = new FizzyAPI();
        await api.reopenCard(number);
        spinner.stop();
        success(`Card #${number} reopened`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('delete <number>')
    .description('Delete a card')
    .action(async (number) => {
      const spinner = ora('Deleting card...').start();
      try {
        const api = new FizzyAPI();
        await api.deleteCard(number);
        spinner.stop();
        success(`Card #${number} deleted`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  // Comments subcommands
  cards
    .command('comments <cardNumber>')
    .description('List comments on a card')
    .option('--json', 'Output as JSON')
    .action(async (cardNumber, options) => {
      const spinner = ora('Fetching comments...').start();
      try {
        const api = new FizzyAPI();
        const comments = await api.listComments(cardNumber);
        spinner.stop();

        if (options.json) {
          json(comments);
          return;
        }

        if (!comments || comments.length === 0) {
          console.log('No comments found.');
          return;
        }

        comments.forEach((c, i) => {
          console.log(`\n--- Comment ${i + 1} (ID: ${c.id}) ---`);
          console.log(`By: ${c.creator?.name || c.creator?.email || 'Unknown'}`);
          console.log(`Date: ${formatDate(c.created_at)}`);
          console.log(`\n${c.content}`);
        });
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('comment <cardNumber> <content>')
    .description('Add a comment to a card')
    .option('--json', 'Output as JSON')
    .action(async (cardNumber, content, options) => {
      const spinner = ora('Adding comment...').start();
      try {
        const api = new FizzyAPI();
        const comment = await api.createComment(cardNumber, content);
        spinner.stop();

        if (options.json) {
          json(comment);
          return;
        }

        success(`Comment added to card #${cardNumber}`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}
