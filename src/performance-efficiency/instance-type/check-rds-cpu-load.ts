import { GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { rdsClient, cloudWatchClient } from '../../shared/aws-client';

/**
 * RDS インスタンスの CPU 使用率が過負荷状態かをチェックする（直近1時間の平均で70%以上）
 */
export async function checkRdsCpuLoad(): Promise<CheckResult[]> {
  console.log('🔍 [パフォーマンス効率] RDS の CPU 負荷をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'パフォーマンス';
  const checkName = 'RDSインスタンスが過負荷でないか';

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const results: CheckResult[] = [];

  const res = await rdsClient.send(new DescribeDBInstancesCommand({}));
  const instances = res.DBInstances ?? [];

  for (const db of instances) {
    const id = db.DBInstanceIdentifier ?? '(ID不明)';

    const metric = await cloudWatchClient.send(
      new GetMetricStatisticsCommand({
        Namespace: 'AWS/RDS',
        MetricName: 'CPUUtilization',
        Dimensions: [
          {
            Name: 'DBInstanceIdentifier',
            Value: id,
          },
        ],
        StartTime: twentyFourHoursAgo,
        EndTime: now,
        Period: 300,
        Statistics: ['Average'],
        Unit: 'Percent',
      })
    );

    const dataPoints = metric.Datapoints ?? [];
    const average =
      dataPoints.reduce((sum, dp) => sum + (dp.Average ?? 0), 0) / (dataPoints.length || 1);

    const isHighLoad = average >= 70;
    const status: CheckStatus = isHighLoad ? 'NG' : 'OK';
    const detail = isHighLoad
      ? `CPU使用率が高負荷状態です（平均 ${average.toFixed(1)}%）`
      : `CPU使用率は正常範囲内です（平均 ${average.toFixed(1)}%）`;

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
