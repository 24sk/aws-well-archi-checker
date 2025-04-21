import {
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { autoScalingClient } from '../../shared/aws-client';

/**
 * Auto Scaling Group にスケーリングポリシーが設定されているかチェック
 */
export async function checkAutoScaling(): Promise<CheckResult[]> {
  console.log('🔍 [パフォーマンス効率] Auto Scaling ポリシーの存在をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'モニタリング';
  const checkName = '負荷傾向に応じたリソーススケーリング設定が存在しているか';

  const results: CheckResult[] = [];

  const groupRes = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({}));
  const groups = groupRes.AutoScalingGroups ?? [];

  for (const group of groups) {
    const name = group.AutoScalingGroupName ?? '(名前不明)';

    const policyRes = await autoScalingClient.send(
      new DescribePoliciesCommand({ AutoScalingGroupName: name })
    );
    const policies = policyRes.ScalingPolicies ?? [];

    const status: CheckStatus = policies.length > 0 ? 'OK' : 'NG';
    const detail =
      status === 'OK'
        ? `スケーリングポリシーが ${policies.length} 件設定されています`
        : 'スケーリングポリシーが未設定です';

    results.push({
      pillar,
      category,
      checkName,
      resource: name,
      status,
      detail,
    });
  }

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
