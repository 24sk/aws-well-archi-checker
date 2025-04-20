import { IAMClient, ListUsersCommand, ListAttachedUserPoliciesCommand } from '@aws-sdk/client-iam';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

const iamClient = new IAMClient({});

/**
 * IAMユーザーに直接ポリシーがアタッチされていないかチェックする
 */
export async function checkIamUserAttachedPolicies(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] IAMユーザーに直接アタッチされたポリシーの有無をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'アイデンティティとアクセス管理';
  const checkName = 'IAMユーザーに直接ポリシーがアタッチされていないか';

  const userRes = await iamClient.send(new ListUsersCommand({}));
  const users = userRes.Users ?? [];

  const results: CheckResult[] = await Promise.all(
    users.map(async (user) => {
      const userName = user.UserName ?? '(名前不明)';
      let status: CheckStatus = 'OK';
      let detail = 'ユーザーにポリシーは直接アタッチされていません';

      try {
        const policyRes = await iamClient.send(
          new ListAttachedUserPoliciesCommand({ UserName: userName })
        );
        const attachedPolicies = policyRes.AttachedPolicies ?? [];

        if (attachedPolicies.length > 0) {
          status = 'NG';
          detail = `直接アタッチされたポリシーが ${attachedPolicies.length} 件存在します`;
        }
      } catch (err) {
        status = 'NG';
        detail = 'ポリシー取得に失敗';
        console.error(`⚠️ ${userName} のポリシー確認時にエラー:`, err);
      }

      return {
        pillar,
        category,
        checkName,
        resource: userName,
        status,
        detail,
      };
    })
  );

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
