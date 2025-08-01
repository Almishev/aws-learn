import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AwsStack } from '../lib/aws-stack';

describe('Radio Playlist Infrastructure Tests', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new AwsStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('DynamoDB Table Created', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'radio-songs',
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'PK',
          AttributeType: 'S'
        },
        {
          AttributeName: 'SK',
          AttributeType: 'S'
        },
        {
          AttributeName: 'artist',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'PK',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'SK',
          KeyType: 'RANGE'
        }
      ]
    });
  });

  test('DynamoDB Table Has GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'Artist-Index',
          KeySchema: [
            {
              AttributeName: 'artist',
              KeyType: 'HASH'
            }
          ],
          Projection: { ProjectionType: 'ALL' }
        }
      ]
    });
  });

  test('AddSong Lambda Function Created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          SONGS_TABLE: { Ref: 'SongsTable64F8B317' },
          COVER_IMAGES_BUCKET: { Ref: 'CoverImagesBucketD372E963' }
        }
      }
    });
  });

  test('PlaySong Lambda Function Created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs18.x',
      Environment: {
        Variables: {
          SONGS_TABLE: { Ref: 'SongsTable64F8B317' },
          NOTIFICATION_TOPIC_ARN: { Ref: 'RadioNotificationTopicF1F411BB' }
        }
      }
    });
  });

  test('API Gateway Created', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'Radio Playlist API'
    });
  });

  test('S3 Bucket Created', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'radio-cover-images'
    });
  });

  test('SNS Topic Created', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'radio-notifications'
    });
  });

  test('EventBridge Rule Created', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'rate(1 minute)',
      State: 'ENABLED'
    });
  });
});
