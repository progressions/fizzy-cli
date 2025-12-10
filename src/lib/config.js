import Conf from 'conf';

const config = new Conf({
  projectName: 'fizzy-cli',
  schema: {
    token: {
      type: 'string',
      default: '',
    },
    accountSlug: {
      type: 'string',
      default: '',
    },
  },
});

export function getConfig() {
  return {
    token: config.get('token'),
    accountSlug: config.get('accountSlug'),
  };
}

export function setToken(token) {
  config.set('token', token);
}

export function setAccountSlug(accountSlug) {
  config.set('accountSlug', accountSlug);
}

export function clearConfig() {
  config.clear();
}

export function getConfigPath() {
  return config.path;
}
