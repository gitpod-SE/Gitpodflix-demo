import request from 'supertest';

const mockQuery = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: mockQuery
  }))
}));

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

process.env.NODE_ENV = 'test';

import app from '../index';

describe('Index.ts Integration Tests - Health Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('Index.ts Integration Tests - Movies Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all movies ordered by rating', async () => {
    const mockMovies = [
      { id: 1, title: 'Movie A', rating: 9.5 },
      { id: 2, title: 'Movie B', rating: 8.0 }
    ];

    mockQuery.mockResolvedValueOnce({ rows: mockMovies });

    const response = await request(app)
      .get('/api/movies')
      .expect(200);

    expect(response.body).toEqual(mockMovies);
    expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM movies ORDER BY rating DESC');
  });

  it('should handle database errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await request(app)
      .get('/api/movies')
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});

describe('Index.ts Integration Tests - Search Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should search with text query', async () => {
    const mockResults = [{ id: 1, title: 'Batman' }];
    mockQuery
      .mockResolvedValueOnce({ rows: mockResults })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const response = await request(app)
      .get('/api/search?q=Batman')
      .expect(200);

    expect(response.body.results).toEqual(mockResults);
    expect(response.body.pagination.total).toBe(1);
  });

  it('should search with genre filter', async () => {
    const mockResults = [{ id: 1, title: 'Action Movie' }];
    mockQuery
      .mockResolvedValueOnce({ rows: mockResults })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const response = await request(app)
      .get('/api/search?genres=Action,Drama')
      .expect(200);

    expect(response.body.results).toEqual(mockResults);
  });

  it('should search with year range filters', async () => {
    const mockResults = [{ id: 1, title: 'Old Movie' }];
    mockQuery
      .mockResolvedValueOnce({ rows: mockResults })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const response = await request(app)
      .get('/api/search?yearMin=1990&yearMax=2000')
      .expect(200);

    expect(response.body.results).toEqual(mockResults);
  });

  it('should search with rating range filters', async () => {
    const mockResults = [{ id: 1, title: 'Great Movie' }];
    mockQuery
      .mockResolvedValueOnce({ rows: mockResults })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const response = await request(app)
      .get('/api/search?ratingMin=8.0&ratingMax=10.0')
      .expect(200);

    expect(response.body.results).toEqual(mockResults);
  });

  it('should search with duration range filters', async () => {
    const mockResults = [{ id: 1, title: 'Long Movie' }];
    mockQuery
      .mockResolvedValueOnce({ rows: mockResults })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const response = await request(app)
      .get('/api/search?durationMin=120&durationMax=180')
      .expect(200);

    expect(response.body.results).toEqual(mockResults);
  });

  it('should search with all filters combined', async () => {
    const mockResults = [{ id: 1, title: 'Perfect Movie' }];
    mockQuery
      .mockResolvedValueOnce({ rows: mockResults })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const response = await request(app)
      .get('/api/search?q=Batman&genres=Action&yearMin=2000&yearMax=2020&ratingMin=8.0&ratingMax=10.0&durationMin=120&durationMax=180')
      .expect(200);

    expect(response.body.results).toEqual(mockResults);
    expect(response.body.pagination).toBeDefined();
  });

  it('should handle pagination parameters', async () => {
    const mockResults = [{ id: 1, title: 'Movie' }];
    mockQuery
      .mockResolvedValueOnce({ rows: mockResults })
      .mockResolvedValueOnce({ rows: [{ count: '100' }] });

    const response = await request(app)
      .get('/api/search?limit=10&offset=20')
      .expect(200);

    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.pagination.offset).toBe(20);
    expect(response.body.pagination.hasMore).toBe(true);
  });

  it('should handle search errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Search failed'));

    const response = await request(app)
      .get('/api/search?q=Batman')
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });

  it('should handle empty genre list', async () => {
    const mockResults = [{ id: 1, title: 'Movie' }];
    mockQuery
      .mockResolvedValueOnce({ rows: mockResults })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const response = await request(app)
      .get('/api/search?genres=')
      .expect(200);

    expect(response.body.results).toEqual(mockResults);
  });

  it('should handle whitespace-only query', async () => {
    const mockResults = [{ id: 1, title: 'Movie' }];
    mockQuery
      .mockResolvedValueOnce({ rows: mockResults })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const response = await request(app)
      .get('/api/search?q=   ')
      .expect(200);

    expect(response.body.results).toEqual(mockResults);
  });
});

describe('Index.ts Integration Tests - Suggestions Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return suggestions for valid query', async () => {
    const mockSuggestions = [
      { suggestion: 'Batman', type: 'title', frequency: '5' },
      { suggestion: 'Christopher Nolan', type: 'director', frequency: '3' }
    ];

    mockQuery.mockResolvedValueOnce({ rows: mockSuggestions });

    const response = await request(app)
      .get('/api/suggestions?q=Bat')
      .expect(200);

    expect(response.body).toEqual([
      { text: 'Batman', type: 'title', frequency: 5 },
      { text: 'Christopher Nolan', type: 'director', frequency: 3 }
    ]);
  });

  it('should return empty array for short query', async () => {
    const response = await request(app)
      .get('/api/suggestions?q=B')
      .expect(200);

    expect(response.body).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should return empty array for empty query', async () => {
    const response = await request(app)
      .get('/api/suggestions')
      .expect(200);

    expect(response.body).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should return empty array for whitespace query', async () => {
    const response = await request(app)
      .get('/api/suggestions?q=  ')
      .expect(200);

    expect(response.body).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('should handle suggestions errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Suggestions failed'));

    const response = await request(app)
      .get('/api/suggestions?q=Batman')
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});

describe('Index.ts Integration Tests - Seed Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should seed database successfully', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/movies/seed')
      .expect(200);

    expect(response.body).toEqual({ message: 'Database seeded successfully' });
    expect(mockQuery).toHaveBeenCalled();
  });

  it('should handle seed errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Seed failed'));

    const response = await request(app)
      .post('/api/movies/seed')
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});

describe('Index.ts Integration Tests - Clear Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should clear database successfully', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/movies/clear')
      .expect(200);

    expect(response.body).toEqual({ message: 'Database cleared successfully' });
    expect(mockQuery).toHaveBeenCalledWith('TRUNCATE TABLE movies');
  });

  it('should handle clear errors', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Clear failed'));

    const response = await request(app)
      .post('/api/movies/clear')
      .expect(500);

    expect(response.body).toEqual({ error: 'Internal server error' });
  });
});
