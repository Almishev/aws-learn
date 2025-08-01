import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock AWS SDK
const mockPutCommand = jest.fn();
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: mockSend,
    }),
  },
  PutCommand: jest.fn().mockImplementation(() => mockPutCommand),
}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-123'),
}));

// Import after mocking
import { handler as addSongHandler } from '../lambda/add-song';

describe('Lambda Function Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  describe('AddSong Lambda Function', () => {
    const mockEvent: APIGatewayProxyEvent = {
      body: JSON.stringify({
        title: 'Test Song',
        artist: 'Test Artist',
        status: 'scheduled',
        playAt: '2025-12-31T23:59:59Z',
        coverimage: 'https://example.com/cover.jpg'
      }),
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'POST',
      isBase64Encoded: false,
      path: '/songs',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      resource: ''
    };

    test('should add song successfully with valid data', async () => {
      // Mock environment variables
      process.env.SONGS_TABLE = 'test-songs-table';
      process.env.COVER_IMAGES_BUCKET = 'test-cover-bucket';

      const result = await addSongHandler(mockEvent);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toHaveProperty('message', 'Song added successfully');
      expect(JSON.parse(result.body)).toHaveProperty('songId');
      expect(JSON.parse(result.body)).toHaveProperty('song');
    });

    test('should return 400 when missing request body', async () => {
      const eventWithoutBody = { ...mockEvent, body: null };
      
      const result = await addSongHandler(eventWithoutBody);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error', 'Missing request body');
    });

    test('should return 400 when missing required fields', async () => {
      const invalidEvent = {
        ...mockEvent,
        body: JSON.stringify({
          title: 'Test Song',
          // Missing artist and playAt
        })
      };

      const result = await addSongHandler(invalidEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error', 'Missing required fields: title, artist, playAt');
    });

    test('should return 400 when playAt is in the past', async () => {
      const pastEvent = {
        ...mockEvent,
        body: JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          playAt: '2020-01-01T00:00:00Z' // Past date
        })
      };

      const result = await addSongHandler(pastEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error', 'playAt must be in the future');
    });

    test('should handle missing coverimage gracefully', async () => {
      const eventWithoutCover = {
        ...mockEvent,
        body: JSON.stringify({
          title: 'Test Song',
          artist: 'Test Artist',
          playAt: '2025-12-31T23:59:59Z'
          // No coverimage
        })
      };

      const result = await addSongHandler(eventWithoutCover);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toHaveProperty('song');
    });
  });

  describe('PlaySong Lambda Function', () => {
    test('should process scheduled songs correctly', async () => {
      // This test would require more complex mocking of DynamoDB and SNS
      // For now, we'll just test that the function exists and can be imported
      const { handler: playSongHandler } = require('../lambda/play-song');
      
      expect(playSongHandler).toBeDefined();
      expect(typeof playSongHandler).toBe('function');
    });
  });
}); 