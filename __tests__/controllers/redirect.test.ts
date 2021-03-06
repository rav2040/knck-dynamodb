import type { TuftContext } from 'tuft';

import { redirect } from '../../src/controllers/redirect';
import {
  badRequestResponse,
  notFoundResponse,
  serverErrorResponse,
} from '../../src/error-responses';

const MOCK_URL = 'https://www.example.com';

const mockDbClient = {
  get: async (urlId: string) => {
    if (urlId === 'aaaaaa') {
      return { url: MOCK_URL };
    }

    if (urlId === 'cccccc') {
      throw Error('mock error');
    }
  },
};

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => { });

beforeEach(() => {
  mockConsoleError.mockClear();
});

afterAll(() => {
  mockConsoleError.mockRestore();
});

describe('When passed a context with an existing hash', () => {
  test('returns an object containing the expected URL', async () => {
    const mockTuftContext = {
      request: {
        params: { urlId: 'aaaaaa' },
      },
    } as unknown as TuftContext;

    const result = redirect(
      //@ts-expect-error
      mockDbClient,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual({ redirect: MOCK_URL });
  });
});

describe('When passed a context with a non-existing hash', () => {
  test('returns an object containing the expected error response', async () => {
    const mockTuftContext = {
      request: {
        params: { urlId: 'bbbbbb' },
      },
    } as unknown as TuftContext;

    const result = redirect(
      //@ts-expect-error
      mockDbClient,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual(notFoundResponse);
  });
});

describe('When passed a context with a hash of invalid length', () => {
  test('returns an object containing the expected error response', async () => {
    const mockTuftContext = {
      request: {
        params: { urlId: 'aaaaa' },
      },
    } as unknown as TuftContext;

    const result = redirect(
      //@ts-expect-error
      mockDbClient,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual(badRequestResponse);
  });
});

describe('When the database query throws an error', () => {
  test('returns an object containing the expected error response', async () => {
    const mockTuftContext = {
      request: {
        params: { urlId: 'cccccc' },
      },
    } as unknown as TuftContext;

    const result = redirect(
      //@ts-expect-error
      mockDbClient,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual(serverErrorResponse);
    expect(mockConsoleError).toHaveBeenCalledWith(Error('mock error'));
  });
});
