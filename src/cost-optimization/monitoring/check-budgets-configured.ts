import {
  DescribeBudgetsCommand,
  DescribeNotificationsForBudgetCommand,
} from '@aws-sdk/client-budgets';
import { getPillarFromPath } from '../../utils';
import { type CheckResult, type CheckStatus } from '../../shared/types/check-result';
import { budgetsClient } from '../../shared/aws-client';

export async function checkBudgetsConfigured(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] Budgets の設定と通知の有無をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'モニタリング';
  const checkName = 'Budgetsが設定され、しきい値超過アラートが有効か';

  const accountId = process.env.AWS_ACCOUNT_ID;

  if (!accountId) {
    return [
      {
        pillar,
        category,
        checkName,
        resource: '(全体)',
        status: 'NG',
        detail: 'AWS_ACCOUNT_ID が .env に未設定です',
      },
    ];
  }

  try {
    const budgetRes = await budgetsClient.send(
      new DescribeBudgetsCommand({
        AccountId: accountId,
        MaxResults: 100,
      })
    );

    const budgets = budgetRes.Budgets ?? [];

    if (budgets.length === 0) {
      return [
        {
          pillar,
          category,
          checkName,
          resource: '(全体)',
          status: 'NG',
          detail: 'Budgets が1件も設定されていません',
        },
      ];
    }

    const results: CheckResult[] = await Promise.all(
      budgets.map(async (budget) => {
        const budgetName = budget.BudgetName ?? '(名前不明)';

        try {
          const notificationRes = await budgetsClient.send(
            new DescribeNotificationsForBudgetCommand({
              AccountId: accountId,
              BudgetName: budgetName,
            })
          );

          const notifications = notificationRes.Notifications ?? [];
          const hasNotifications = notifications.length > 0;

          const status: CheckStatus = hasNotifications ? 'OK' : 'NG';
          const detail = hasNotifications
            ? `${notifications.length} 件の通知ルールが設定されています`
            : '通知ルールが設定されていません';

          return {
            pillar,
            category,
            checkName,
            resource: budgetName,
            status,
            detail,
          };
        } catch (err: any) {
          return {
            pillar,
            category,
            checkName,
            resource: budgetName,
            status: 'NG',
            detail: `通知取得に失敗しました: ${err.name ?? 'UnknownError'}`,
          };
        }
      })
    );

    return results;
  } catch (err: any) {
    return [
      {
        pillar,
        category,
        checkName,
        resource: '(全体)',
        status: 'NG',
        detail: `Budgets API の取得に失敗しました: ${err.name ?? 'UnknownError'}`,
      },
    ];
  }
}
