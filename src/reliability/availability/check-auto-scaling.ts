import { DescribeAutoScalingInstancesCommand } from '@aws-sdk/client-auto-scaling';
import { DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { autoScalingClient, ec2Client } from '../../shared/aws-client';

/**
 * EC2 インスタンスが Auto Scaling 構成になっているかをチェック
 */
export async function checkEC2AutoScaling(): Promise<CheckResult[]> {
  console.log('🔍 [信頼性] EC2 の Auto Scaling 構成をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '可用性';
  const checkName = 'EC2がAuto Scaling構成になっているか';

  const results: CheckResult[] = [];

  // EC2インスタンス一覧取得
  const ec2Res = await ec2Client.send(new DescribeInstancesCommand({}));
  const instances = (ec2Res.Reservations ?? []).flatMap((r) => r.Instances ?? []);

  // AutoScalingに紐づくインスタンスID一覧を取得
  const asgRes = await autoScalingClient.send(new DescribeAutoScalingInstancesCommand({}));
  const asgInstanceIds = new Set((asgRes.AutoScalingInstances ?? []).map((i) => i.InstanceId));

  for (const instance of instances) {
    const instanceId = instance.InstanceId ?? '(ID不明)';
    const instanceName = instance.Tags?.find((t) => t.Key === 'Name')?.Value ?? '(no name)';

    const inAsg = asgInstanceIds.has(instanceId);
    const status: CheckStatus = inAsg ? 'OK' : 'NG';
    const detail = inAsg ? 'Auto Scalingにより管理されています' : 'Auto Scaling未構成です';

    results.push({
      pillar,
      category,
      checkName,
      resource: `${instanceName} (${instanceId})`,
      status,
      detail,
    });
  }

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);

  return results;
}
