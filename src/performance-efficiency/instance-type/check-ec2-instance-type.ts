import { DescribeInstancesCommand, Instance } from '@aws-sdk/client-ec2';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { ec2Client } from '../../shared/aws-client';

/**
 * EC2インスタンスが推奨スペック（例: t系や旧世代）で構成されていないかをチェック
 */
export async function checkEc2InstanceType(): Promise<CheckResult[]> {
  console.log('🔍 [パフォーマンス効率] EC2 インスタンスタイプの適正性をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'インスタンスタイプ';
  const checkName = '適切なスペックで構成されているか';

  const results: CheckResult[] = [];
  const res = await ec2Client.send(new DescribeInstancesCommand({}));

  const instances: Instance[] = (res.Reservations ?? []).flatMap((r) => r.Instances ?? []);

  // 非推奨や低パフォーマンスな旧世代インスタンスファミリー（例）
  const deprecatedTypes = [/^t2\./, /^m1\./, /^c1\./];

  for (const instance of instances) {
    const id = instance.InstanceId ?? '(ID不明)';
    const type = instance.InstanceType ?? '(不明なタイプ)';
    const name = instance.Tags?.find((t) => t.Key === 'Name')?.Value ?? '(no name)';

    const isDeprecated = deprecatedTypes.some((regex) => regex.test(type));
    const status: CheckStatus = isDeprecated ? 'NG' : 'OK';
    const detail = isDeprecated
      ? `${type} は旧世代インスタンスタイプの可能性があります`
      : `${type} はパフォーマンス効率的に適切です`;

    results.push({
      pillar,
      category,
      checkName,
      resource: `${name} (${id})`,
      status,
      detail,
    });
  }

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
