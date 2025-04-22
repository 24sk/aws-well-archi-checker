import { exportToCsv } from './utils/export-result';
import { CheckResult } from './shared/types/check-result';
import { checkCloudWatchAlarms } from './operational-excellence/monitoring/check-cw-alarm';
import {
  checkCloudTrail,
  checkLambdaLogging,
  checkS3AccessLogs,
  checkVPCFlowLogs,
} from './operational-excellence/log-collection';
import { checkIamUserAttachedPolicies } from './security/iam';
import { checkS3Encryption } from './security/s3-bucket';
import {
  checkGuardDutyEnabled,
  checkSecurityGroupOpenPorts,
  checkSecurityHubEnabled,
} from './security';
import { checkKmsKeyRotation } from './security/kms';

async function main() {
  console.log('🚀 well-archi-checker 開始');

  const results: CheckResult[] = [];

  // 1. 運用上の優秀性
  results.push(...(await checkCloudWatchAlarms()));
  results.push(...(await checkCloudTrail()));
  results.push(...(await checkLambdaLogging()));
  results.push(...(await checkS3AccessLogs()));
  results.push(...(await checkVPCFlowLogs()));

  // 2. セキュリティ
  results.push(...(await checkGuardDutyEnabled()));
  results.push(...(await checkSecurityHubEnabled()));
  results.push(...(await checkIamUserAttachedPolicies()));
  results.push(...(await checkS3Encryption()));
  results.push(...(await checkKmsKeyRotation()));
  results.push(...(await checkSecurityGroupOpenPorts()));
  results.push(...(await checkSecurityHubEnabled()));

  exportToCsv(results, 'output/well-archi-report.csv');

  console.log('✅ 全チェック完了');
}

main().catch((err) => {
  console.error('❌ 実行中にエラーが発生しました:', err);
  process.exit(1);
});
