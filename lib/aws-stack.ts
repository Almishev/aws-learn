import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as path from 'path';
import { Construct } from 'constructs';

export class AwsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB таблица за съхранение на песните
    const songsTable = new dynamodb.Table(this, 'SongsTable', {
      tableName: 'radio-songs',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // За development
    });

    // GSI за търсене по artist (като в примера)
    songsTable.addGlobalSecondaryIndex({
      indexName: 'Artist-Index',
      partitionKey: { name: 'artist', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // S3 bucket за cover images
    const coverImagesBucket = new s3.Bucket(this, 'CoverImagesBucket', {
      bucketName: 'radio-cover-images',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // За development
    });

    // Lambda функция за добавяне на песни
    const addSongLambda = new lambdaNodejs.NodejsFunction(this, 'AddSongLambda', {
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda/add-song.ts'),
      environment: {
        SONGS_TABLE: songsTable.tableName,
        COVER_IMAGES_BUCKET: coverImagesBucket.bucketName,
      },
    });

    // Даваме права на Lambda да чете/пише в DynamoDB
    songsTable.grantReadWriteData(addSongLambda);
    coverImagesBucket.grantReadWrite(addSongLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'RadioApi', {
      restApiName: 'Radio Playlist API',
      description: 'API за управление на плейлист',
    });

    // Добавяме endpoint за добавяне на песни
    const songs = api.root.addResource('songs');
    songs.addMethod('POST', new apigateway.LambdaIntegration(addSongLambda));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'URL на API Gateway',
    });

    new cdk.CfnOutput(this, 'SongsTableName', {
      value: songsTable.tableName,
      description: 'Име на DynamoDB таблицата',
    });

    // SNS Topic за известия за DJ Boyko
    const notificationTopic = new sns.Topic(this, 'RadioNotificationTopic', {
      topicName: 'radio-notifications',
      displayName: 'Radio Playlist Notifications',
    });

    // SNS Subscription за email известия към DJ Boyko
    new sns.Subscription(this, 'BoykoEmailSubscription', {
      protocol: sns.SubscriptionProtocol.EMAIL,
      endpoint: process.env.DJ_EMAIL || 'boyko@radio.com', // Email на DJ Boyko
      topic: notificationTopic,
    });

    // Lambda функция за обработка на планирани песни
    const playSongLambda = new lambdaNodejs.NodejsFunction(this, 'PlaySongLambda', {
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda/play-song.ts'),
      environment: {
        SONGS_TABLE: songsTable.tableName,
        NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
      },
    });

    // Даваме права на Lambda да чете/пише в DynamoDB и да публикува в SNS
    songsTable.grantReadWriteData(playSongLambda);
    notificationTopic.grantPublish(playSongLambda);

    // EventBridge правило за планиране на изпълнение
    const playSongRule = new events.Rule(this, 'PlaySongRule', {
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)), // Проверява на всяка минута
    });

    playSongRule.addTarget(new targets.LambdaFunction(playSongLambda));

    new cdk.CfnOutput(this, 'CoverImagesBucketName', {
      value: coverImagesBucket.bucketName,
      description: 'Име на S3 bucket за cover images',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: notificationTopic.topicArn,
      description: 'ARN на SNS Topic за известия',
    });

    new cdk.CfnOutput(this, 'DJEmailSubscription', {
      value: 'boyko@radio.com',
      description: 'Email адрес на DJ Boyko за известия',
    });
  }
}
