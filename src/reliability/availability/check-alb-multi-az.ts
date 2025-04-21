import { DescribeLoadBalancersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { elbv2Client } from '../../shared/aws-client';

/**
 * ALB が複数AZにまたがって配置されているかをチェック
 */
export async function checkAlbMultiAz(): Promise<CheckResult[]> {
  console.log('🔍 [パフォーマンス効率] ALB のマルチAZ構成をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '可用性';
  const checkName = 'ALBが複数AZにまたがって構成されているか';

  const res = await elbv2Client.send(new DescribeLoadBalancersCommand({}));
  const albs = res.LoadBalancers ?? [];

  const results: CheckResult[] = albs.map((alb) => {
    const name = alb.LoadBalancerName ?? '(名前不明)';
    const id = alb.LoadBalancerArn ?? '(ARN不明)';
    const zones = alb.AvailabilityZones ?? [];

    const isMultiAz = zones.length > 1;
    const status: CheckStatus = isMultiAz ? 'OK' : 'NG';
    const detail = isMultiAz
      ? `構成AZ数: ${zones.length}（マルチAZ）`
      : '1つのAZにしか構成されていません';

    return {
      pillar,
      category,
      checkName,
      resource: `${name} (${id})`,
      status,
      detail,
    };
  });

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
