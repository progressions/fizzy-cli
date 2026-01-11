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

        const goldenIndicator = card.golden ? ' ★' : '';
        console.log(`\n#${card.number}: ${card.title}${goldenIndicator}`);
        console.log(`Status: ${card.closed_at ? 'Closed' : 'Open'}${card.golden ? ' (Golden)' : ''}`);
        console.log(`Board: ${card.board?.name || '-'}`);
        console.log(`Column: ${card.column?.name || '-'}`);
        console.log(`Created: ${formatDate(card.created_at)}`);
        console.log(`Updated: ${formatDate(card.updated_at)}`);

        if (card.assignees && card.assignees.length > 0) {
          console.log(`Assignees: ${card.assignees.map(a => a.name || a.email).join(', ')}`);
        }

        if (card.tags && card.tags.length > 0) {
          console.log(`Tags: ${card.tags.map(t => typeof t === 'string' ? t : t.name).join(', ')}`);
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
          description: options.description,
          column_id: options.column,
        });
        spinner.stop();

        if (options.json) {
          json(card);
          return;
        }

        if (card) {
          success(`Card created: #${card.number} - ${card.title}`);
        } else {
          success(`Card created: "${title}"`);
        }
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
    .option('-s, --status <status>', 'Set status (published, closed, not_now)')
    .option('--tags <ids>', 'Set tag IDs (comma-separated)')
    .option('--json', 'Output as JSON')
    .action(async (number, options) => {
      const data = {};
      if (options.title) data.title = options.title;
      if (options.description) data.description = options.description;
      if (options.tags) data.tag_ids = options.tags.split(',').map(id => id.trim());

      const hasDataUpdates = Object.keys(data).length > 0;
      const hasStatusUpdate = !!options.status;

      if (!hasDataUpdates && !hasStatusUpdate) {
        error('No update options provided. Use --title, --description, --status, or --tags');
        process.exit(1);
      }

      const spinner = ora('Updating card...').start();
      try {
        const api = new FizzyAPI();
        let card;

        // Handle status changes via dedicated endpoints
        if (hasStatusUpdate) {
          const status = options.status.toLowerCase();
          if (status === 'closed') {
            await api.closeCard(number);
          } else if (status === 'not_now') {
            await api.setCardNotNow(number);
          } else if (status === 'published') {
            // Reopen and remove not_now to get back to published
            await api.reopenCard(number).catch(() => {});
            await api.unsetCardNotNow(number).catch(() => {});
          } else {
            spinner.stop();
            error(`Invalid status: ${options.status}. Use: published, closed, or not_now`);
            process.exit(1);
          }
        }

        // Handle field updates via PUT
        if (hasDataUpdates) {
          card = await api.updateCard(number, data);
        } else {
          card = await api.getCard(number);
        }

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
    .command('gild <number>')
    .description('Mark a card as golden (priority)')
    .action(async (number) => {
      const spinner = ora('Marking card as golden...').start();
      try {
        const api = new FizzyAPI();
        await api.gildCard(number);
        spinner.stop();
        success(`Card #${number} marked as golden`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('ungild <number>')
    .description('Remove golden status from a card')
    .action(async (number) => {
      const spinner = ora('Removing golden status...').start();
      try {
        const api = new FizzyAPI();
        await api.ungildCard(number);
        spinner.stop();
        success(`Card #${number} is no longer golden`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('watch <number>')
    .description('Watch a card for notifications')
    .action(async (number) => {
      const spinner = ora('Watching card...').start();
      try {
        const api = new FizzyAPI();
        await api.watchCard(number);
        spinner.stop();
        success(`Now watching card #${number}`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('unwatch <number>')
    .description('Stop watching a card')
    .action(async (number) => {
      const spinner = ora('Unwatching card...').start();
      try {
        const api = new FizzyAPI();
        await api.unwatchCard(number);
        spinner.stop();
        success(`Stopped watching card #${number}`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('move <number> <column>')
    .description('Move a card to a column (by column name or ID)')
    .option('--json', 'Output as JSON')
    .action(async (number, column, options) => {
      const spinner = ora('Moving card...').start();
      try {
        const api = new FizzyAPI();

        // First get the card to find its board
        const card = await api.getCard(number);
        if (!card || !card.board) {
          spinner.stop();
          error(`Card #${number} not found or has no board`);
          process.exit(1);
        }

        // Get the board's columns
        const columns = await api.listColumns(card.board.id);

        // Find the column by ID or name (case-insensitive)
        let targetColumn = columns.find(c => c.id === column);
        if (!targetColumn) {
          const columnLower = column.toLowerCase();
          targetColumn = columns.find(c => c.name?.toLowerCase() === columnLower);
        }

        if (!targetColumn) {
          spinner.stop();
          if (!columns || columns.length === 0) {
            error(`Column "${column}" not found and the board has no available columns.`);
          } else {
            error(`Column "${column}" not found. Available columns: ${columns.map(c => c.name).join(', ')}`);
          }
          process.exit(1);
        }

        // Move the card using triage endpoint
        await api.triageCard(number, targetColumn.id);
        spinner.stop();

        if (options.json) {
          const updatedCard = await api.getCard(number);
          json(updatedCard);
          return;
        }

        success(`Card #${number} moved to "${targetColumn.name}"`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('untriage <number>')
    .description('Send a card back to triage (remove from column)')
    .action(async (number) => {
      const spinner = ora('Sending card to triage...').start();
      try {
        const api = new FizzyAPI();
        await api.untriageCard(number);
        spinner.stop();
        success(`Card #${number} sent back to triage`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('move-board <number> <board>')
    .description('Move a card to a different board (by board name or ID)')
    .option('--json', 'Output as JSON')
    .action(async (number, board, options) => {
      const spinner = ora('Moving card to board...').start();
      try {
        const api = new FizzyAPI();

        // Get list of boards to find target
        const boards = await api.listBoards();

        // Find the board by ID or name (case-insensitive)
        let targetBoard = boards.find(b => b.id === board);
        if (!targetBoard) {
          const boardLower = board.toLowerCase();
          targetBoard = boards.find(b => b.name?.toLowerCase() === boardLower);
        }

        if (!targetBoard) {
          spinner.stop();
          error(`Board "${board}" not found. Available boards: ${boards.map(b => b.name).join(', ')}`);
          process.exit(1);
        }

        // Move the card to the board
        await api.moveCardToBoard(number, targetBoard.id);
        spinner.stop();

        if (options.json) {
          const updatedCard = await api.getCard(number);
          json(updatedCard);
          return;
        }

        success(`Card #${number} moved to board "${targetBoard.name}"`);
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

  // Search command
  cards
    .command('search <query>')
    .alias('find')
    .description('Search cards by title or description')
    .option('--json', 'Output as JSON')
    .action(async (query, options) => {
      const spinner = ora('Searching cards...').start();
      try {
        const api = new FizzyAPI();
        const cardList = await api.listCards();
        spinner.stop();

        const queryLower = query.toLowerCase();
        const matches = cardList.filter(c =>
          c.title?.toLowerCase().includes(queryLower) ||
          c.description?.toLowerCase().includes(queryLower)
        );

        if (options.json) {
          json(matches);
          return;
        }

        if (!matches || matches.length === 0) {
          console.log(`No cards found matching "${query}"`);
          return;
        }

        console.log(`Found ${matches.length} card(s) matching "${query}":\n`);
        matches.forEach(c => {
          console.log(`#${c.number}: ${c.title}`);
          console.log(`  URL: ${c.url}`);
          if (c.description) {
            console.log(`  ${truncate(c.description, 80)}`);
          }
          console.log();
        });
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

  cards
    .command('tag <cardNumber> <tagName>')
    .description('Toggle a tag on a card (adds if not present, removes if present)')
    .action(async (cardNumber, tagName) => {
      const spinner = ora('Toggling tag...').start();
      try {
        const api = new FizzyAPI();
        await api.toggleTag(cardNumber, tagName);
        spinner.stop();
        success(`Tag "${tagName}" toggled on card #${cardNumber}`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });

  cards
    .command('assign <cardNumber> <user>')
    .description('Toggle assignment on a card (by user name, email, or ID)')
    .action(async (cardNumber, user) => {
      const spinner = ora('Toggling assignment...').start();
      try {
        const api = new FizzyAPI();

        // Get list of users to find target
        const users = await api.listUsers();

        // Find the user by ID, name, or email (case-insensitive)
        let targetUser = users.find(u => u.id === user);
        if (!targetUser) {
          const userLower = user.toLowerCase();
          targetUser = users.find(u =>
            u.name?.toLowerCase() === userLower ||
            u.email?.toLowerCase() === userLower ||
            u.email_address?.toLowerCase() === userLower
          );
        }

        if (!targetUser) {
          spinner.stop();
          error(`User "${user}" not found. Available users: ${users.map(u => u.name || u.email || u.email_address).join(', ')}`);
          process.exit(1);
        }

        await api.toggleAssignment(cardNumber, targetUser.id);
        spinner.stop();
        success(`Assignment toggled for "${targetUser.name || targetUser.email || targetUser.email_address}" on card #${cardNumber}`);
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}
