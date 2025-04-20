import { GetEnabledStandardsCommand } from '@aws-sdk/client-securityhub';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { securityHubClient } from '../../shared/aws-client';

/**
 * Security Hub が有効になっているかをチェックする
 */
export async function checkSecurityHubEnabled(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] Security Hub の有効化状態をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '監査';
  const checkName = 'Security Hubが有効か';

  let status: CheckStatus = 'OK';
  let detail = 'Security Hub は有効です';

  try {
    const res = await securityHubClient.send(new GetEnabledStandardsCommand({}));

    if ((res.StandardsSubscriptions ?? []).length === 0) {
      status = 'NG';
      detail = 'Security Hub は有効ですが、標準（CIS等）が1つも有効ではありません';
    }
  } catch (err: any) {
    if (err.name === 'InvalidAccessException' || err.name === 'SecurityHubDisabledException') {
      status = 'NG';
      detail = 'Security Hub は有効化されていません';
    } else {
      status = 'NG';
      detail = 'Security Hub 状態の取得に失敗しました';
      console.error('⚠️ Security Hub チェックエラー:', err);
    }
  }

  const results: CheckResult[] = [
    {
      pillar,
      category,
      checkName,
      resource: '(default)',
      status,
      detail,
    },
  ];
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);

  return results;
}
