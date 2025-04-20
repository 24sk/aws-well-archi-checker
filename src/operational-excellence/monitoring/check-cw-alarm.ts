import { DescribeAlarmsCommand, DescribeAlarmsCommandOutput } from '@aws-sdk/client-cloudwatch';
import { DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { cloudWatchClient, ec2Client } from '../../shared/aws-client';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

export async function checkCloudWatchAlarms(): Promise<CheckResult[]> {
  console.log('🔍 CloudWatch アラーム設定状況をチェック中...');

  const pillar = getPillarFromPath(__dirname);

  const category = 'モニタリング';
  const checkName = 'CloudWatch Alarmが重要リソースに設定されているか';

  // EC2 インスタンス一覧取得
  const instancesResponse = await ec2Client.send(new DescribeInstancesCommand({}));
  const instances = (instancesResponse.Reservations ?? []).flatMap((res) =>
    (res.Instances ?? []).map((inst) => ({
      id: inst.InstanceId ?? '',
      name: inst.Tags?.find((tag) => tag.Key === 'Name')?.Value ?? '(no name)',
    }))
  );

  // CloudWatch アラーム一覧取得
  const alarmsResponse: DescribeAlarmsCommandOutput = await cloudWatchClient.send(
    new DescribeAlarmsCommand({})
  );

  const alarmedInstanceIds = new Set<string>();
  for (const alarm of alarmsResponse.MetricAlarms ?? []) {
    for (const dim of alarm.Dimensions ?? []) {
      if (dim.Name === 'InstanceId' && dim.Value) {
        alarmedInstanceIds.add(dim.Value);
      }
    }
  }

  const results: CheckResult[] = instances.map(({ id, name }) => {
    const hasAlarm = alarmedInstanceIds.has(id);
    const status: CheckStatus = hasAlarm ? 'OK' : 'NG';

    return {
      pillar,
      category,
      checkName,
      resource: `${name} (${id})`,
      status,
      detail: hasAlarm ? 'アラーム設定済み' : 'アラーム未設定',
    };
  });

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
