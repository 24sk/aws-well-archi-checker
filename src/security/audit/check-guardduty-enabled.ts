import { ListDetectorsCommand } from '@aws-sdk/client-guardduty';
import { getPillarFromPath } from '../../utils';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { guardDutyClient } from '../../shared/aws-client';

/**
 * GuardDuty が有効になっているかチェックする
 */
export async function checkGuardDutyEnabled(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] GuardDuty の有効化状態をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '監査';
  const checkName = 'GuardDutyが有効か';

  let status: CheckStatus = 'OK';
  let detail = 'GuardDuty は有効です';

  try {
    const res = await guardDutyClient.send(new ListDetectorsCommand({}));
    const detectors = res.DetectorIds ?? [];

    if (detectors.length === 0) {
      status = 'NG';
      detail = 'GuardDuty は有効化されていません';
    }
  } catch (err) {
    status = 'NG';
    detail = 'GuardDuty 状態取得に失敗しました';
    console.error('⚠️ GuardDuty チェック中にエラー:', err);
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
