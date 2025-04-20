import { ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { cloudWatchClient, lambdaClient } from '../../shared/aws-client';

/**
 * Lambda のタイムアウト・メモリエラー頻発状況をチェック
 */
export async function checkLambdaPerformance(): Promise<CheckResult[]> {
  console.log('🔍 [パフォーマンス効率] Lambda のタイムアウト・メモリエラーをチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'インスタンスタイプ';
  const checkName = 'Lambdaのタイムアウトやメモリエラーが頻発していないか';

  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24時間分

  const results: CheckResult[] = [];

  const functionsRes = await lambdaClient.send(new ListFunctionsCommand({}));
  const functions = functionsRes.Functions ?? [];

  for (const fn of functions) {
    const name = fn.FunctionName;
    if (!name) continue;

    const [timeoutMetrics, memMetrics] = await Promise.all([
      cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/Lambda',
          MetricName: 'Duration',
          Dimensions: [{ Name: 'FunctionName', Value: name }],
          StartTime: start,
          EndTime: now,
          Period: 300,
          Statistics: ['Maximum'],
          Unit: 'Milliseconds',
        })
      ),
      cloudWatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/Lambda',
          MetricName: 'MaxMemoryUsed',
          Dimensions: [{ Name: 'FunctionName', Value: name }],
          StartTime: start,
          EndTime: now,
          Period: 300,
          Statistics: ['Maximum'],
          Unit: 'Megabytes',
        })
      ),
    ]);

    const timeout = fn.Timeout ? fn.Timeout * 1000 : 3000;
    const memorySize = fn.MemorySize ?? 128;

    const durationPoints = timeoutMetrics.Datapoints ?? [];
    const memoryPoints = memMetrics.Datapoints ?? [];

    const maxDuration =
      durationPoints.length > 0 ? Math.max(...durationPoints.map((d) => d.Maximum ?? 0)) : 0;

    const maxMemoryUsed =
      memoryPoints.length > 0 ? Math.max(...memoryPoints.map((d) => d.Maximum ?? 0)) : 0;

    const nearTimeout = maxDuration >= timeout * 0.9;
    const nearMemLimit = maxMemoryUsed >= memorySize * 0.9;

    const status: CheckStatus = nearTimeout || nearMemLimit ? 'NG' : 'OK';
    const detail = [
      nearTimeout
        ? `タイムアウト上限に近い実行あり（最大: ${(maxDuration / 1000).toFixed(2)}s）`
        : `実行時間は正常範囲内（最大: ${(maxDuration / 1000).toFixed(2)}s）`,
      nearMemLimit
        ? `メモリ使用量が上限に近い（最大: ${maxMemoryUsed}MB）`
        : `メモリ使用量は正常範囲内（最大: ${maxMemoryUsed}MB）`,
    ].join(' / ');

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
