import { ListHealthChecksCommand } from '@aws-sdk/client-route-53';
import { getPillarFromPath } from '../../utils';
import { CheckResult } from '../../shared/types/check-result';
import { route53Client } from '../../shared/aws-client';

/**
 * Route 53 ヘルスチェックが定義されているかをチェック
 */
export async function checkRoute53HealthChecks(): Promise<CheckResult[]> {
  console.log('🔍 [信頼性] Route53 のヘルスチェック設定をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '可用性';
  const checkName = 'Route53ヘルスチェックが設定されているか';

  const results: CheckResult[] = [];

  const res = await route53Client.send(new ListHealthChecksCommand({}));
  const checks = res.HealthChecks ?? [];

  if (checks.length === 0) {
    results.push({
      pillar,
      category,
      checkName,
      resource: '(全体)',
      status: 'NG',
      detail: 'ヘルスチェックが1件も設定されていません',
    });
  } else {
    for (const check of checks) {
      const id = check.Id;
      const name = check.HealthCheckConfig?.FullyQualifiedDomainName ?? '(ドメイン未設定)';
      const type = check.HealthCheckConfig?.Type;

      results.push({
        pillar,
        category,
        checkName,
        resource: `${name} (${id})`,
        status: 'OK',
        detail: `タイプ: ${type}`,
      });
    }
  }

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
