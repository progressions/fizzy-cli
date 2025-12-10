import { getConfig } from './config.js';

const BASE_URL = 'https://app.fizzy.do';

export class FizzyAPI {
  constructor(token = null, accountSlug = null) {
    const config = getConfig();
    // Priority: explicit token > env var > config file
    this.token = token || process.env.FIZZY_API_TOKEN || config.token;
    this.accountSlug = accountSlug || process.env.FIZZY_ACCOUNT_SLUG || config.accountSlug;
  }

  async request(endpoint, options = {}) {
    if (!this.token) {
      throw new Error('No API token configured. Run: fizzy config set-token <token>');
    }

    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${errorBody}`);
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text) {
      return null;
    }
    return JSON.parse(text);
  }

  // Identity
  async getIdentity() {
    return this.request('/my/identity');
  }

  // Boards
  async listBoards() {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/boards`);
  }

  async getBoard(boardId) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/boards/${boardId}`);
  }

  async createBoard(data) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/boards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBoard(boardId, data) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/boards/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBoard(boardId) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/boards/${boardId}`, {
      method: 'DELETE',
    });
  }

  // Cards
  async listCards(options = {}) {
    this.requireAccount();
    const params = new URLSearchParams();
    if (options.board_id) params.append('board_id', options.board_id);
    if (options.column_id) params.append('column_id', options.column_id);
    if (options.assignee_id) params.append('assignee_id', options.assignee_id);
    if (options.tag_id) params.append('tag_id', options.tag_id);
    if (options.status) params.append('status', options.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/${this.accountSlug}/cards${query}`);
  }

  async getCard(cardNumber) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}`);
  }

  async createCard(boardId, data) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/boards/${boardId}/cards`, {
      method: 'POST',
      body: JSON.stringify({ card: data }),
    });
  }

  async updateCard(cardNumber, data) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}`, {
      method: 'PUT',
      body: JSON.stringify({ card: data }),
    });
  }

  async deleteCard(cardNumber) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}`, {
      method: 'DELETE',
    });
  }

  async closeCard(cardNumber) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}/closure`, {
      method: 'POST',
    });
  }

  async reopenCard(cardNumber) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}/closure`, {
      method: 'DELETE',
    });
  }

  async setCardNotNow(cardNumber) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}/not_now`, {
      method: 'POST',
    });
  }

  async unsetCardNotNow(cardNumber) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}/not_now`, {
      method: 'DELETE',
    });
  }

  // Taggings
  async toggleTag(cardNumber, tagTitle) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}/taggings`, {
      method: 'POST',
      body: JSON.stringify({ tag_title: tagTitle }),
    });
  }

  // Comments
  async listComments(cardNumber) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}/comments`);
  }

  async createComment(cardNumber, content) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(cardNumber, commentId) {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/cards/${cardNumber}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Tags
  async listTags() {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/tags`);
  }

  // Users
  async listUsers() {
    this.requireAccount();
    return this.request(`/${this.accountSlug}/users`);
  }

  // Notifications
  async listNotifications() {
    return this.request('/my/notifications');
  }

  requireAccount() {
    if (!this.accountSlug) {
      throw new Error('No account configured. Run: fizzy config set-account <account-slug>');
    }
  }
}

export const api = new FizzyAPI();
