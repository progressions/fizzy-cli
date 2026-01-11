import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FizzyAPI } from '../src/lib/api.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('FizzyAPI', () => {
  let api;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new FizzyAPI('test-token', 'test-account');
  });

  describe('constructor', () => {
    it('should use provided token and account', () => {
      expect(api.token).toBe('test-token');
      expect(api.accountSlug).toBe('test-account');
    });
  });

  describe('request', () => {
    it('should throw error if no token configured', async () => {
      const noTokenApi = new FizzyAPI(null, 'test-account');
      noTokenApi.token = null;

      await expect(noTokenApi.request('/test')).rejects.toThrow('No API token configured');
    });

    it('should make request with correct headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: 'test' }),
      });

      await api.request('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should return null for 204 responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      const result = await api.request('/test');
      expect(result).toBeNull();
    });

    it('should throw error for non-ok responses', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(api.request('/test')).rejects.toThrow('API Error 404: Not found');
    });
  });

  describe('listCards', () => {
    it('should fetch cards from correct endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: '1', title: 'Test' }]),
      });

      await api.listCards();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards',
        expect.any(Object)
      );
    });

    it('should include query params for filters', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([]),
      });

      await api.listCards({ board_id: '123', status: 'open' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards?board_id=123&status=open',
        expect.any(Object)
      );
    });
  });

  describe('getCard', () => {
    it('should fetch single card by number', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ number: 1, title: 'Test' }),
      });

      const card = await api.getCard(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1',
        expect.any(Object)
      );
      expect(card.number).toBe(1);
    });
  });

  describe('createCard', () => {
    it('should post card to board endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ number: 1, title: 'New Card' }),
      });

      await api.createCard('board-123', { title: 'New Card' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/boards/board-123/cards',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ card: { title: 'New Card' } }),
        })
      );
    });
  });

  describe('updateCard', () => {
    it('should PUT card data wrapped in card object', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ number: 1, title: 'Updated' }),
      });

      await api.updateCard(1, { title: 'Updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ card: { title: 'Updated' } }),
        })
      );
    });
  });

  describe('deleteCard', () => {
    it('should DELETE card', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.deleteCard(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('moveCardToBoard', () => {
    it('should PUT board_id to board endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.moveCardToBoard(1, 'board-456');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/board',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ board_id: 'board-456' }),
        })
      );
    });
  });

  describe('closeCard', () => {
    it('should POST to closure endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.closeCard(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/closure',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('reopenCard', () => {
    it('should DELETE closure endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.reopenCard(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/closure',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('setCardNotNow', () => {
    it('should POST to not_now endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.setCardNotNow(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/not_now',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('unsetCardNotNow', () => {
    it('should DELETE not_now endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.unsetCardNotNow(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/not_now',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('toggleTag', () => {
    it('should POST tag_title to taggings endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.toggleTag(1, 'feature');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/taggings',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ tag_title: 'feature' }),
        })
      );
    });
  });

  describe('toggleAssignment', () => {
    it('should POST assignee_id to assignments endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.toggleAssignment(1, 'user-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/assignments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ assignee_id: 'user-123' }),
        })
      );
    });
  });

  describe('listBoards', () => {
    it('should fetch boards', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: '1', name: 'Test Board' }]),
      });

      await api.listBoards();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/boards',
        expect.any(Object)
      );
    });
  });

  describe('listComments', () => {
    it('should fetch comments for card', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: '1', content: 'Test' }]),
      });

      await api.listComments(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/comments',
        expect.any(Object)
      );
    });
  });

  describe('createComment', () => {
    it('should POST comment content', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ id: '1', content: 'New comment' }),
      });

      await api.createComment(1, 'New comment');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/comments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ comment: { body: 'New comment' } }),
        })
      );
    });
  });

  describe('listColumns', () => {
    it('should fetch columns for board', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: '1', name: 'To Do' }, { id: '2', name: 'Done' }]),
      });

      await api.listColumns('board-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/boards/board-123/columns',
        expect.any(Object)
      );
    });
  });

  describe('createColumn', () => {
    it('should POST column data to board columns endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ id: '1', name: 'New Column' }),
      });

      await api.createColumn('board-123', { name: 'New Column' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/boards/board-123/columns',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ column: { name: 'New Column' } }),
        })
      );
    });
  });

  describe('updateColumn', () => {
    it('should PUT column data to column endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.updateColumn('board-123', 'col-456', { name: 'Updated' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/boards/board-123/columns/col-456',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ column: { name: 'Updated' } }),
        })
      );
    });
  });

  describe('deleteColumn', () => {
    it('should DELETE column endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.deleteColumn('board-123', 'col-456');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/boards/board-123/columns/col-456',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('triageCard', () => {
    it('should POST column_id to triage endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.triageCard(1, 'column-456');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/triage',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ column_id: 'column-456' }),
        })
      );
    });
  });

  describe('untriageCard', () => {
    it('should DELETE triage endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.untriageCard(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/triage',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('gildCard', () => {
    it('should POST to goldness endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.gildCard(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/goldness',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('ungildCard', () => {
    it('should DELETE goldness endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.ungildCard(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/goldness',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('watchCard', () => {
    it('should POST to watch endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.watchCard(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/watch',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('unwatchCard', () => {
    it('should DELETE watch endpoint', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        text: async () => '',
      });

      await api.unwatchCard(1);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://app.fizzy.do/test-account/cards/1/watch',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('requireAccount', () => {
    it('should throw if no account configured', () => {
      const noAccountApi = new FizzyAPI('token', null);
      noAccountApi.accountSlug = null;

      expect(() => noAccountApi.requireAccount()).toThrow('No account configured');
    });
  });
});
