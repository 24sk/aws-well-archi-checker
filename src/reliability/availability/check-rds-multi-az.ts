import { DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { rdsClient } from '../../shared/aws-client';

/**
 * RDSインスタンスがマルチAZ構成になっているかをチェックする
 */
export async function checkRdsMultiAz(): Promise<CheckResult[]> {
  console.log('🔍 [信頼性] RDS のマルチAZ構成をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '可用性';
  const checkName = 'RDSがマルチAZ構成になっているか';

  const res = await rdsClient.send(new DescribeDBInstancesCommand({}));
  const instances = res.DBInstances ?? [];

  const results: CheckResult[] = instances.map((db) => {
    const id = db.DBInstanceIdentifier ?? '(ID不明)';
    const isMultiAz = db.MultiAZ === true;
    const status: CheckStatus = isMultiAz ? 'OK' : 'NG';
    const detail = isMultiAz ? 'マルチAZ構成になっています' : '単一AZ構成です';

    return {
      pillar,
      category,
      checkName,
      resource: id,
      status,
      detail,
    };
  });

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
