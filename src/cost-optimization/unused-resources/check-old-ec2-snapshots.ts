import {
  DescribeSnapshotsCommand,
  DescribeVolumesCommand,
  Snapshot,
  Volume,
} from '@aws-sdk/client-ec2';
import { getPillarFromPath } from '../../utils';
import { ec2Client } from '../../shared/aws-client';
import { type CheckResult, type CheckStatus } from '../../shared/types/check-result';

/**
 * 古いスナップショットが大量に残っていないかをチェック（EC2インスタンス情報付き）
 */
export async function checkOldEc2Snapshots(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] 古いスナップショットの蓄積をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '未使用リソース';
  const checkName = '古いスナップショットが大量に残っていないか';

  /**
   * 閾値
   * - 何日前を「古い」とするか
   */
  const THRESHOLD_DAYS = 90;

  /**
   * 閾値
   * - 古いスナップショットが何個以上あると NG とするか
   */
  const THRESHOLD_COUNT = 10;

  const now = new Date();

  const [snapshotRes, volumeRes] = await Promise.all([
    ec2Client.send(new DescribeSnapshotsCommand({ OwnerIds: ['self'] })),
    ec2Client.send(new DescribeVolumesCommand({})),
  ]);

  const snapshots: Snapshot[] = snapshotRes.Snapshots ?? [];
  const volumes: Volume[] = volumeRes.Volumes ?? [];

  // VolumeId → InstanceId マップ作成
  const volumeToInstanceMap = volumes.reduce<Record<string, string>>((acc, vol) => {
    const volumeId = vol.VolumeId;
    const instanceId = vol.Attachments?.[0]?.InstanceId;
    if (volumeId && instanceId) {
      acc[volumeId] = instanceId;
    }
    return acc;
  }, {});

  const oldSnapshots = snapshots.filter((snap) => {
    const startTime = snap.StartTime;
    return (
      startTime instanceof Date &&
      (now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24) > THRESHOLD_DAYS
    );
  });

  const status: CheckStatus = oldSnapshots.length > THRESHOLD_COUNT ? 'NG' : 'OK';
  const detail =
    status === 'NG'
      ? `作成から${THRESHOLD_DAYS}日以上経過したスナップショットが ${oldSnapshots.length} 件存在します`
      : `古いスナップショットの数は閾値以下です（${oldSnapshots.length} 件）`;

  const results: CheckResult[] = [
    {
      pillar,
      category,
      checkName,
      resource: '(全体)',
      status,
      detail,
    },
    ...oldSnapshots.map((snap) => {
      const snapshotId = snap.SnapshotId ?? '(ID不明)';
      const volumeId = snap.VolumeId ?? '(ボリューム不明)';
      const instanceId = volumeToInstanceMap[volumeId] ?? '(インスタンス不明)';
      const daysOld = Math.floor(
        (now.getTime() - (snap.StartTime?.getTime() ?? 0)) / (1000 * 60 * 60 * 24)
      );

      return {
        pillar,
        category,
        checkName,
        resource: `Snapshot: ${snapshotId} / Volume: ${volumeId} / Instance: ${instanceId}`,
        status: 'NG' as CheckStatus,
        detail: `作成から ${daysOld} 日経過`,
      };
    }),
  ];

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
