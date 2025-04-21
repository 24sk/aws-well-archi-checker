import { DescribeDBSnapshotsCommand, DBSnapshot } from '@aws-sdk/client-rds';
import { getPillarFromPath } from '../../utils';
import { rdsClient } from '../../shared/aws-client';
import { type CheckResult, type CheckStatus } from '../../shared/types/check-result';

/**
 * 古いRDSスナップショットが大量に残っていないかをチェック
 */
export async function checkOldRdsSnapshots(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] 古い RDS スナップショットの蓄積をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '未使用リソース';
  const checkName = '古いRDSスナップショットが大量に残っていないか';

  /**
   * 閾値
   * - 何日前を「古い」とするか
   */
  const THRESHOLD_DAYS = 90;

  /**
   * 閾値
   * - 古いRDSスナップショットが何個以上あると NG とするか
   */
  const THRESHOLD_COUNT = 10;
  const now = new Date();

  const res = await rdsClient.send(new DescribeDBSnapshotsCommand({ SnapshotType: 'manual' }));
  const snapshots: DBSnapshot[] = res.DBSnapshots ?? [];

  const oldSnapshots = snapshots.filter(({ SnapshotCreateTime }) => {
    const created = SnapshotCreateTime;
    return (
      created instanceof Date &&
      (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) > THRESHOLD_DAYS
    );
  });

  const status: CheckStatus = oldSnapshots.length > THRESHOLD_COUNT ? 'NG' : 'OK';
  const detail =
    status === 'NG'
      ? `作成から${THRESHOLD_DAYS}日以上経過したRDS手動スナップショットが ${oldSnapshots.length} 件存在します`
      : `古いRDSスナップショットの数は閾値以下です（${oldSnapshots.length} 件）`;

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
      const snapshotId = snap.DBSnapshotIdentifier ?? '(ID不明)';
      const dbInstance = snap.DBInstanceIdentifier ?? '(DB不明)';
      const daysOld = Math.floor(
        (now.getTime() - (snap.SnapshotCreateTime?.getTime() ?? 0)) / (1000 * 60 * 60 * 24)
      );

      return {
        pillar,
        category,
        checkName,
        resource: `Snapshot: ${snapshotId} / DB: ${dbInstance}`,
        status: 'NG' as CheckStatus,
        detail: `作成から ${daysOld} 日経過`,
      };
    }),
  ];

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
