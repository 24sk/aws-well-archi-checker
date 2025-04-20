import { ListFunctionsCommand, FunctionConfiguration } from '@aws-sdk/client-lambda';
import { DescribeLogGroupsCommand, LogGroup } from '@aws-sdk/client-cloudwatch-logs';
import { cloudWatchLogsClient, lambdaClient } from '../../shared/aws-client';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

/**
 * Lambda の CloudWatch Logs 出力設定をチェックします。
 */
export async function checkLambdaLogging(): Promise<CheckResult[]> {
  console.log('🔍 [運用上の優秀性] Lambda の CloudWatch Logs 出力設定をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'ログ収集';
  const checkName = 'Lambda関数がCloudWatch Logsに出力されているか';

  const lambdaRes = await lambdaClient.send(new ListFunctionsCommand({}));
  const functions: FunctionConfiguration[] = lambdaRes.Functions ?? [];

  const logsRes = await cloudWatchLogsClient.send(
    new DescribeLogGroupsCommand({
      logGroupNamePrefix: '/aws/lambda/',
    })
  );

  const logGroups: LogGroup[] = logsRes.logGroups ?? [];
  const existingLogGroupNames = new Set(logGroups.map((lg) => lg.logGroupName));

  const results: CheckResult[] = functions.map(({ FunctionName }) => {
    const name = FunctionName ?? '(unnamed)';
    const expectedLogGroup = `/aws/lambda/${name}`;
    const hasLogGroup = existingLogGroupNames.has(expectedLogGroup);
    const status: CheckStatus = hasLogGroup ? 'OK' : 'NG';

    return {
      pillar,
      category,
      checkName,
      resource: name,
      status,
      detail: hasLogGroup ? 'ロググループあり' : 'ロググループが存在しない',
    };
  });

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
