import { DescribeTrailsCommand, Trail } from '@aws-sdk/client-cloudtrail';
import { cloudTrailClient } from '../../shared/aws-client';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

/**
 * CloudTrailの全リージョン有効設定をチェックします。
 */
export async function checkCloudTrail(): Promise<CheckResult[]> {
  console.log('🔍 [運用上の優秀性] CloudTrailの全リージョン有効設定をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'ログ収集';
  const checkName = 'CloudTrailが全リージョンで有効になっているか';

  const res = await cloudTrailClient.send(
    new DescribeTrailsCommand({
      includeShadowTrails: false,
    })
  );

  const trails: Trail[] = res.trailList ?? [];

  // トレイルが存在しない場合は NG を1件返す
  if (trails.length === 0) {
    const results: CheckResult[] = [
      {
        pillar,
        category,
        checkName,
        resource: '(トレイル未定義)',
        status: 'NG',
        detail: 'CloudTrailが定義されていません',
      },
    ];
    console.log(`✅ チェック結果: ${results.length} 件`);
    console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
    return results;
  }

  // 複数の trail を map で処理
  const results: CheckResult[] = trails.map(({ Name, IsMultiRegionTrail }) => {
    const status: CheckStatus = IsMultiRegionTrail ? 'OK' : 'NG';
    return {
      pillar,
      category,
      checkName,
      resource: Name ?? '(名前不明)',
      status,
      detail: IsMultiRegionTrail ? '全リージョンで有効' : '全リージョンで有効ではありません',
    };
  });

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
