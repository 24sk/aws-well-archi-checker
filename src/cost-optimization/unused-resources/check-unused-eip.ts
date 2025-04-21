import { DescribeAddressesCommand } from '@aws-sdk/client-ec2';
import { type CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { ec2Client } from '../../shared/aws-client';

/**
 * Elastic IP が未アタッチ状態で割り当てられていないかをチェック
 */
export async function checkUnusedElasticIps(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] 未使用の Elastic IP をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '未使用リソース';
  const checkName = '不要なElastic IPが割り当てられていないか';

  const res = await ec2Client.send(new DescribeAddressesCommand({}));
  const addresses = res.Addresses ?? [];

  const unusedIps = addresses.filter(
    ({ InstanceId, NetworkInterfaceId }) => !InstanceId && !NetworkInterfaceId
  );

  const results: CheckResult[] =
    unusedIps.length > 0
      ? unusedIps.map(({ PublicIp }) => ({
          pillar,
          category,
          checkName,
          resource: `Elastic IP: ${PublicIp ?? '(IP不明)'}`,
          status: 'NG' as CheckStatus,
          detail: '未アタッチのElastic IPが存在します。不要であれば解放を検討してください',
        }))
      : [
          {
            pillar,
            category,
            checkName,
            resource: '(全体)',
            status: 'OK',
            detail: '未アタッチのElastic IPは存在しません',
          },
        ];

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
