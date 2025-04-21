import { ListDistributionsCommand } from '@aws-sdk/client-cloudfront';
import { CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { cloudFrontClient } from '../../shared/aws-client';

/**
 * CloudFront が活用されているかをチェック（少なくとも1つのDistributionが存在する）
 */
export async function checkCloudFrontUsage(): Promise<CheckResult[]> {
  console.log('🔍 [パフォーマンス効率] CloudFront の活用状況をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'キャッシュ';
  const checkName = 'CloudFrontが活用されているか';

  const res = await cloudFrontClient.send(new ListDistributionsCommand({}));
  const items = res.DistributionList?.Items ?? [];

  const results: CheckResult[] =
    items.length === 0
      ? [
          {
            pillar,
            category,
            checkName,
            resource: '(全体)',
            status: 'NG',
            detail: 'CloudFront ディストリビューションが構成されていません',
          },
        ]
      : items.map(({ Id, DomainName }) => ({
          pillar,
          category,
          checkName,
          resource: Id ?? '(ID不明)',
          status: 'OK' as CheckStatus,
          detail: `ドメイン: ${DomainName}`,
        }));

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
