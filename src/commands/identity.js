import ora from 'ora';
import { FizzyAPI } from '../lib/api.js';
import { success, error, json, printTable } from '../lib/output.js';

export function identityCommand(program) {
  program
    .command('identity')
    .alias('me')
    .description('Get your identity and accessible accounts')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const spinner = ora('Fetching identity...').start();
      try {
        const api = new FizzyAPI();
        const identity = await api.getIdentity();
        spinner.stop();

        if (options.json) {
          json(identity);
          return;
        }

        // User info is nested inside the first account
        const firstAccount = identity.accounts?.[0];
        const user = firstAccount?.user;
        if (user) {
          success(`Logged in as: ${user.name} (${user.email_address})`);
        }

        if (identity.accounts && identity.accounts.length > 0) {
          console.log('\nAccessible accounts:');
          printTable(
            ['Slug', 'Name', 'Role'],
            identity.accounts.map(acc => [
              acc.slug,
              acc.name,
              acc.user?.role || '-',
            ])
          );
        }
      } catch (err) {
        spinner.stop();
        error(err.message);
        process.exit(1);
      }
    });
}
