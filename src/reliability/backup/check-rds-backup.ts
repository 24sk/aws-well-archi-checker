import { DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { rdsClient } from '../../shared/aws-client';

/**
 * RDSインスタンスの自動バックアップ設定をチェック
 */
export async function checkRdsBackup(): Promise<CheckResult[]> {
  console.log('🔍 [信頼性] RDS の自動バックアップ設定をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'バックアップ';
  const checkName = 'RDSの自動バックアップが有効か';

  const results: CheckResult[] = [];

  const res = await rdsClient.send(new DescribeDBInstancesCommand({}));
  const instances = res.DBInstances ?? [];

  for (const db of instances) {
    const id = db.DBInstanceIdentifier ?? '(ID不明)';
    const backupRetentionPeriod = db.BackupRetentionPeriod ?? 0;
    const isEnabled = backupRetentionPeriod > 0;

    const status: CheckStatus = isEnabled ? 'OK' : 'NG';
    const detail = isEnabled
      ? `自動バックアップ保持日数: ${backupRetentionPeriod}日`
      : '自動バックアップが無効です';

    results.push({
      pillar,
      category,
      checkName,
      resource: id,
      status,
      detail,
    });
  }

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
