import { DescribeFlowLogsCommand, DescribeSubnetsCommand, Subnet } from '@aws-sdk/client-ec2';
import { ec2Client } from '../../shared/aws-client';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

/**
 * VPC Flow Logs の有効化状況をチェックします。
 */
export async function checkVPCFlowLogs(): Promise<CheckResult[]> {
  console.log('🔍 [運用上の優秀性] 全サブネットに対する VPC Flow Logs の有効化状況をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'ログ収集';
  const checkName = 'VPC Flow LogsがサブネットまたはVPC単位で設定されているか';

  // Flow Logs 一覧取得
  const flowLogsRes = await ec2Client.send(new DescribeFlowLogsCommand({}));
  const flowLogs = flowLogsRes.FlowLogs ?? [];

  // サブネット一覧取得
  const subnetsRes = await ec2Client.send(new DescribeSubnetsCommand({}));
  const subnets: Subnet[] = subnetsRes.Subnets ?? [];

  const results: CheckResult[] = subnets.map((subnet) => {
    const subnetId = subnet.SubnetId ?? '(ID不明)';
    const vpcId = subnet.VpcId;
    const name = subnet.Tags?.find((tag) => tag.Key === 'Name')?.Value ?? '(no name)';

    const hasFlowLog = flowLogs.some(
      (log) => log.ResourceId === subnetId || log.ResourceId === vpcId
    );

    const status: CheckStatus = hasFlowLog ? 'OK' : 'NG';

    return {
      pillar,
      category,
      checkName,
      resource: `${name} (${subnetId})`,
      status,
      detail: hasFlowLog ? 'Flow Logs 有効' : 'Flow Logs が未設定（サブネットまたはVPC）',
    };
  });

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(JSON.stringify(results, null, 2));
  return results;
}
