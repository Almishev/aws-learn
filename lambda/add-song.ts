import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

interface SongRequest {
  title: string;
  artist: string;
  status: string;
  playAt: string;
  coverimage?: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Проверяваме дали има body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    const songData: SongRequest = JSON.parse(event.body);

    // Валидация на данните
    if (!songData.title || !songData.artist || !songData.playAt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: title, artist, playAt' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Проверяваме дали playAt е в бъдещето
    const playAt = new Date(songData.playAt);
    const now = new Date();
    
    if (playAt <= now) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'playAt must be in the future' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      };
    }

    // Генерираме уникален ID
    const songId = uuidv4();
    
    // Подготвяме данните за съхранение с новия key schema
    const songItem = {
      PK: `SONG#${songId}`, // Primary Key
      SK: `METADATA#${songId}`, // Sort Key - опростено според задачата
      id: songId,
      title: songData.title,
      artist: songData.artist,
      status: songData.status || 'scheduled',
      playAt: songData.playAt,
      coverimage: songData.coverimage || '',
      createdAt: new Date().toISOString(),
    };

    // Запазваме в DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.SONGS_TABLE,
      Item: songItem,
    }));

    // Ако има cover image URL, запазваме я в S3
    if (songData.coverimage) {
      try {
        // Извличаме името на файла от URL
        const urlParts = songData.coverimage.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const s3Key = `covers/${songId}/${fileName}`;

        // Запазваме в S3
        await s3Client.send(new PutObjectCommand({
          Bucket: process.env.COVER_IMAGES_BUCKET,
          Key: s3Key,
          Body: JSON.stringify({ url: songData.coverimage }),
          ContentType: 'application/json',
        }));

        // Обновяваме coverimage полето с S3 ключа
        songItem.coverimage = s3Key;
        
        await docClient.send(new PutCommand({
          TableName: process.env.SONGS_TABLE,
          Item: songItem,
        }));
      } catch (error) {
        console.error('Error saving cover image to S3:', error);
        // Продължаваме без cover image
      }
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Song added successfully',
        songId: songId,
        song: songItem,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };

  } catch (error) {
    console.error('Error adding song:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
}; 