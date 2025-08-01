#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsStack } from '../lib/aws-stack';

const app = new cdk.App();

// Конфигурация за Radio Playlist система
new AwsStack(app, 'RadioPlaylistStack', {
  // Използваме AWS CLI конфигурация за development
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
  
  // Описание на stack-а
  description: 'Radio Playlist Management System - AWS CDK Stack',
  
  // Tags за организация
  tags: {
    Project: 'RadioPlaylist',
    Environment: 'Development',
    Owner: 'DJ Boyko'
  }
});