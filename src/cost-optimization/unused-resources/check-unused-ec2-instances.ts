import { DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { ec2Client } from '../../shared/aws-client';

/**
 * 停止中のEC2インスタンスが放置されていないかをチェック
 */
export async function checkUnusedEc2Instances(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] 停止中の EC2 インスタンスの放置をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '未使用リソース';
  const checkName = '停止中のEC2が放置されていないか';

  const res = await ec2Client.send(new DescribeInstancesCommand({}));
  const instances = res.Reservations?.flatMap((r) => r.Instances ?? []) ?? [];

  const stoppedInstances = instances.filter((instance) => instance.State?.Name === 'stopped');

  const results: CheckResult[] =
    stoppedInstances.length > 0
      ? stoppedInstances.map(({ InstanceId, Tags }) => ({
          pillar,
          category,
          checkName,
          resource: `${Tags?.find((t) => t.Key === 'Name')?.Value ?? '(no name)'} (${InstanceId ?? '(ID不明)'})`,
          status: 'NG' as CheckStatus,
          detail: '停止中のインスタンスが存在します。不要であれば削除を検討してください',
        }))
      : [
          {
            pillar,
            category,
            checkName,
            resource: '(全体)',
            status: 'OK',
            detail: '停止中のEC2インスタンスは存在しません',
          },
        ];

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
