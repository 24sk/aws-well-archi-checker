import 'dotenv-flow/config';

import { CloudWatchClient, CloudWatchClientConfig } from '@aws-sdk/client-cloudwatch';
import { EC2Client } from '@aws-sdk/client-ec2';
import { RDSClient } from '@aws-sdk/client-rds';
import { S3Client } from '@aws-sdk/client-s3';
import { IAMClient } from '@aws-sdk/client-iam';
import { CloudTrailClient } from '@aws-sdk/client-cloudtrail';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { KMSClient } from '@aws-sdk/client-kms';
import { ConfigServiceClient } from '@aws-sdk/client-config-service';
import { SecurityHubClient } from '@aws-sdk/client-securityhub';
import { GuardDutyClient } from '@aws-sdk/client-guardduty';
import { AutoScalingClient } from '@aws-sdk/client-auto-scaling';
import { Route53Client } from '@aws-sdk/client-route-53';
import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { CostExplorerClient } from '@aws-sdk/client-cost-explorer';
import { BudgetsClient } from '@aws-sdk/client-budgets';

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || 'ap-northeast-1';

if (!accessKeyId || !secretAccessKey) {
  console.error(
    '\x1b[31m%s\x1b[0m',
    '[ERROR] AWS_ACCESS_KEY_ID または AWS_SECRET_ACCESS_KEY が未設定です。`.env` または `.env.*` ファイルを確認してください。'
  );
  process.exit(1);
}

const config = {
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
} satisfies CloudWatchClientConfig;

export const cloudWatchClient = new CloudWatchClient(config);
export const ec2Client = new EC2Client(config);
export const rdsClient = new RDSClient(config);
export const s3Client = new S3Client(config);
export const iamClient = new IAMClient(config);
export const cloudTrailClient = new CloudTrailClient(config);
export const lambdaClient = new LambdaClient(config);
export const cloudWatchLogsClient = new CloudWatchLogsClient(config);
export const kmsClient = new KMSClient(config);
export const configClient = new ConfigServiceClient(config);
export const securityHubClient = new SecurityHubClient(config);
export const guardDutyClient = new GuardDutyClient(config);
export const autoScalingClient = new AutoScalingClient(config);
export const route53Client = new Route53Client(config);
export const cloudFrontClient = new CloudFrontClient(config);
export const elbv2Client = new ElasticLoadBalancingV2Client(config);
export const costExplorerClient = new CostExplorerClient(config);
export const budgetsClient = new BudgetsClient(config);
