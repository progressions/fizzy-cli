import { setToken, setAccountSlug, getConfig, clearConfig, getConfigPath } from '../lib/config.js';
import { success, info, error, printTable } from '../lib/output.js';

export function configCommand(program) {
  const config = program
    .command('config')
    .description('Manage CLI configuration');

  config
    .command('set-token <token>')
    .description('Set your Fizzy API token')
    .action((token) => {
      setToken(token);
      success('API token saved successfully');
    });

  config
    .command('set-account <slug>')
    .description('Set the default account slug')
    .action((slug) => {
      setAccountSlug(slug);
      success(`Default account set to: ${slug}`);
    });

  config
    .command('show')
    .description('Show current configuration')
    .action(() => {
      const cfg = getConfig();
      const envToken = process.env.FIZZY_API_TOKEN;
      const envAccount = process.env.FIZZY_ACCOUNT_SLUG;

      info(`Config file: ${getConfigPath()}`);
      printTable(
        ['Setting', 'Value', 'Source'],
        [
          [
            'Token',
            envToken ? '***' + envToken.slice(-4) : (cfg.token ? '***' + cfg.token.slice(-4) : '(not set)'),
            envToken ? 'FIZZY_API_TOKEN env' : (cfg.token ? 'config file' : '-'),
          ],
          [
            'Account Slug',
            envAccount || cfg.accountSlug || '(not set)',
            envAccount ? 'FIZZY_ACCOUNT_SLUG env' : (cfg.accountSlug ? 'config file' : '-'),
          ],
        ]
      );
    });

  config
    .command('clear')
    .description('Clear all configuration')
    .action(() => {
      clearConfig();
      success('Configuration cleared');
    });

  config
    .command('path')
    .description('Show config file path')
    .action(() => {
      console.log(getConfigPath());
    });
}
