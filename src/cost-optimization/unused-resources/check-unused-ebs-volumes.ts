import { DescribeVolumesCommand } from '@aws-sdk/client-ec2';
import { type CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { ec2Client } from '../../shared/aws-client';

/**
 * 未アタッチのEBSボリュームが存在しないかをチェック
 */
export async function checkUnusedEbsVolumes(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] 未アタッチの EBS ボリュームをチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '未使用リソース';
  const checkName = '未アタッチのEBSボリュームが存在しないか';

  const volumeRes = await ec2Client.send(new DescribeVolumesCommand({}));
  const volumes = volumeRes.Volumes ?? [];

  const unusedVolumes = volumes.filter(
    (vol) => vol.State === 'available' && (vol.Attachments?.length ?? 0) === 0
  );

  const results: CheckResult[] =
    unusedVolumes.length > 0
      ? unusedVolumes.map(({ VolumeId }) => ({
          pillar,
          category,
          checkName,
          resource: `EBS: ${VolumeId ?? '(ID不明)'}`,
          status: 'NG' as CheckStatus,
          detail: '未アタッチのEBSボリュームが存在します。不要であれば削除を検討してください',
        }))
      : [
          {
            pillar,
            category,
            checkName,
            resource: '(全体)',
            status: 'OK',
            detail: '未アタッチのEBSボリュームは存在しません',
          },
        ];

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
