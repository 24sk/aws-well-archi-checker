import { GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';
import { getPillarFromPath } from '../../utils';
import { type CheckResult } from '../../shared/types/check-result';
import { costExplorerClient } from '../../shared/aws-client';

/**
 * Cost Explorer が有効かどうかをチェック
 */
export async function checkCostExplorerEnabled(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] Cost Explorer が有効かどうかをチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'モニタリング';
  const checkName = 'Cost Explorerでコスト監視が行われているか';

  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - 7); // 直近7日間

  const StartTime = start.toISOString().split('T')[0];
  const EndTime = end.toISOString().split('T')[0];

  try {
    await costExplorerClient.send(
      new GetCostAndUsageCommand({
        TimePeriod: { Start: StartTime, End: EndTime },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
      })
    );

    return [
      {
        pillar,
        category,
        checkName,
        resource: '(全体)',
        status: 'OK',
        detail: 'Cost Explorer が有効になっており、利用データが取得可能です',
      },
    ];
  } catch (err: any) {
    return [
      {
        pillar,
        category,
        checkName,
        resource: '(全体)',
        status: 'NG',
        detail: `Cost Explorer が有効ではない可能性があります: ${err.name ?? 'UnknownError'}`,
      },
    ];
  }
}
