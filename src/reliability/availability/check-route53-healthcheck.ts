import { ListHealthChecksCommand } from '@aws-sdk/client-route-53';
import { getPillarFromPath } from '../../utils';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { route53Client } from '../../shared/aws-client';

/**
 * Route 53 ヘルスチェックが定義されているかをチェック
 */
export async function checkRoute53HealthChecks(): Promise<CheckResult[]> {
  console.log('🔍 [信頼性] Route53 のヘルスチェック設定をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '可用性';
  const checkName = 'Route53ヘルスチェックが設定されているか';

  const res = await route53Client.send(new ListHealthChecksCommand({}));
  const checks = res.HealthChecks ?? [];

  const results: CheckResult[] =
    checks.length === 0
      ? [
          {
            pillar,
            category,
            checkName,
            resource: '(全体)',
            status: 'NG',
            detail: 'ヘルスチェックが1件も設定されていません',
          },
        ]
      : checks.map(({ Id, HealthCheckConfig }) => {
          const id = Id;
          const name = HealthCheckConfig?.FullyQualifiedDomainName ?? '(ドメイン未設定)';
          const type = HealthCheckConfig?.Type;
          const status: CheckStatus = 'OK';

          return {
            pillar,
            category,
            checkName,
            resource: `${name} (${id})`,
            status,
            detail: `タイプ: ${type}`,
          };
        });

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
