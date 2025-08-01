import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

export const handler = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    
    // Търсим песни, които трябва да се пуснат сега (използваме Scan с filter)
    const response = await docClient.send(new ScanCommand({
      TableName: process.env.SONGS_TABLE,
      FilterExpression: 'status = :status AND playAt <= :now',
      ExpressionAttributeValues: {
        ':status': 'scheduled',
        ':now': now,
      },
    }));

    if (!response.Items || response.Items.length === 0) {
      console.log('No songs to play at this time');
      return;
    }

    console.log(`Found ${response.Items.length} songs to play`);

    // Обработваме всяка песен
    for (const song of response.Items) {
      try {
        // Обновяваме статуса на "played"
        await docClient.send(new UpdateCommand({
          TableName: process.env.SONGS_TABLE,
          Key: {
            PK: song.PK,
            SK: song.SK,
          },
          UpdateExpression: 'SET status = :status, playedAt = :playedAt',
          ExpressionAttributeValues: {
            ':status': 'played',
            ':playedAt': now,
          },
        }));

        // Изпращаме известие чрез SNS
        const message = {
          subject: '🎵 Време е за нова песен!',
          body: `Песен: ${song.title}\nИзпълнител: ${song.artist}\nВреме за пускане: ${song.playAt}`,
        };

        await snsClient.send(new PublishCommand({
          TopicArn: process.env.NOTIFICATION_TOPIC_ARN,
          Subject: message.subject,
          Message: message.body,
        }));

        console.log(`Song "${song.title}" by ${song.artist} marked as played and notification sent`);

      } catch (error) {
        console.error(`Error processing song ${song.id}:`, error);
        // Продължаваме с следващата песен
      }
    }

  } catch (error) {
    console.error('Error in play-song handler:', error);
    throw error;
  }
}; 