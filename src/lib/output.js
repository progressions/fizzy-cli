import chalk from 'chalk';
import { table } from 'table';

export function success(message) {
  console.log(chalk.green('✓'), message);
}

export function error(message) {
  console.error(chalk.red('✗'), message);
}

export function info(message) {
  console.log(chalk.blue('ℹ'), message);
}

export function warn(message) {
  console.log(chalk.yellow('⚠'), message);
}

export function json(data) {
  console.log(JSON.stringify(data, null, 2));
}

export function printTable(headers, rows) {
  const data = [headers.map(h => chalk.bold(h)), ...rows];
  console.log(table(data, {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼',
    },
  }));
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

export function truncate(str, length = 50) {
  if (!str) return '-';
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
}
