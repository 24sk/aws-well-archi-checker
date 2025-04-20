import { DescribeVolumesCommand, Volume } from '@aws-sdk/client-ec2';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { ec2Client } from '../../shared/aws-client';

/**
 * EBS ボリュームが Data Lifecycle Manager によって自動スナップショット対象になっているかをチェック
 */
export async function checkEbsSnapshotAutomation(): Promise<CheckResult[]> {
  console.log('🔍 [信頼性] EBSスナップショットの自動取得設定をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'バックアップ';
  const checkName = 'EBSスナップショットが自動取得されているか';

  const results: CheckResult[] = [];

  const res = await ec2Client.send(new DescribeVolumesCommand({}));
  const volumes: Volume[] = res.Volumes ?? [];

  for (const volume of volumes) {
    const volumeId = volume.VolumeId ?? '(ID不明)';
    const name = volume.Tags?.find((tag) => tag.Key === 'Name')?.Value ?? '(no name)';
    const dlmTagExists = volume.Tags?.some((tag) => tag.Key?.startsWith('aws:dlm:')) ?? false;

    const status: CheckStatus = dlmTagExists ? 'OK' : 'NG';
    const detail = dlmTagExists
      ? 'DLMによってスナップショットが自動取得されています'
      : 'スナップショットの自動取得設定がありません';

    results.push({
      pillar,
      category,
      checkName,
      resource: `${name} (${volumeId})`,
      status,
      detail,
    });
  }

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
