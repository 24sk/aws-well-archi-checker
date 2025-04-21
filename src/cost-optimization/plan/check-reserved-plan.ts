import {
  GetSavingsPlansUtilizationCommand,
  GetReservationUtilizationCommand,
} from '@aws-sdk/client-cost-explorer';
import { getPillarFromPath } from '../../utils';
import { type CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { costExplorerClient } from '../../shared/aws-client';

export async function checkReservedPlan(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] RI / Savings Plans の適用状況をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'プラン適用';
  const checkName = 'RIやSavings Plansが活用されているか';

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = now;

  try {
    const [spResult, riResult] = await Promise.all([
      costExplorerClient.send(
        new GetSavingsPlansUtilizationCommand({
          TimePeriod: {
            Start: start.toISOString().split('T')[0],
            End: end.toISOString().split('T')[0],
          },
        })
      ),
      costExplorerClient.send(
        new GetReservationUtilizationCommand({
          TimePeriod: {
            Start: start.toISOString().split('T')[0],
            End: end.toISOString().split('T')[0],
          },
        })
      ),
    ]);

    const spCommit = spResult.SavingsPlansUtilizationsByTime?.[0]?.Utilization?.TotalCommitment;
    const riUtil = riResult.Total?.UtilizationPercentage;

    const spUsed = !!spCommit && parseFloat(spCommit) > 0;
    const riUsed = !!riUtil && parseFloat(riUtil) > 0;

    const hasAnyPlan = spUsed || riUsed;
    const status: CheckStatus = hasAnyPlan ? 'OK' : 'NG';

    const detail = hasAnyPlan
      ? `Savings Plans または RI が適用されています（Savings Commitment: $${spCommit ?? '-'}, RI Utilization: ${riUtil ?? '-'}%）`
      : 'RIやSavings Plansが一切適用されていません';

    const results: CheckResult[] = [
      {
        pillar,
        category,
        checkName,
        resource: '(全体)',
        status,
        detail,
      },
    ];

    console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);

    return results;
  } catch (err) {
    console.error('❌ Cost Explorer APIの呼び出しに失敗しました:', err);
    return [
      {
        pillar,
        category,
        checkName,
        resource: '(全体)',
        status: 'NG',
        detail:
          'Cost Explorer API の取得に失敗しました。アクセス許可または有効化状況をご確認ください。',
      },
    ];
  }
}
