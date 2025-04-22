import {
  IAMClient,
  ListUsersCommand,
  GetAccessKeyLastUsedCommand,
  ListAccessKeysCommand,
} from '@aws-sdk/client-iam';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

const iamClient = new IAMClient({});

/**
 * 不要なIAMユーザーを検出する
 * - 最終アクセスが非常に古い（例：90日以上ログイン履歴がない）
 * - アクセスキーが存在しない
 * - アクセスキーが90日以上使用されていない
 */
export async function checkUnusedIamUsers(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] IAMユーザーの使用状況をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'アイデンティティとアクセス管理';
  const checkName = '不要なIAMユーザーが存在しないか';

  const now = new Date();
  const THRESHOLD_DAYS = 90;

  const userRes = await iamClient.send(new ListUsersCommand({}));
  const users = userRes.Users ?? [];

  const results: CheckResult[] = [];

  for (const user of users) {
    const userName = user.UserName ?? '(名前不明)';
    let status: CheckStatus = 'OK';
    let detail = '正常なアクティビティ';

    try {
      const keyRes = await iamClient.send(new ListAccessKeysCommand({ UserName: userName }));
      const accessKeys = keyRes.AccessKeyMetadata ?? [];

      // 1つでも最近使われていればOK
      let recentlyUsed = false;

      for (const key of accessKeys) {
        const usedRes = await iamClient.send(
          new GetAccessKeyLastUsedCommand({ AccessKeyId: key.AccessKeyId })
        );
        const lastUsed = usedRes.AccessKeyLastUsed?.LastUsedDate;
        if (lastUsed) {
          const days = (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
          if (days <= THRESHOLD_DAYS) {
            recentlyUsed = true;
            break;
          }
        }
      }

      if (!recentlyUsed) {
        status = 'NG';
        detail =
          accessKeys.length === 0
            ? 'アクセスキー未設定'
            : `アクセスキーが ${THRESHOLD_DAYS}日以上使用されていません`;
      }
    } catch (err) {
      status = 'NG';
      detail = 'アクセスキー情報の取得に失敗';
      console.error(`⚠️ ${userName} の確認中にエラー:`, err);
    }

    results.push({
      pillar,
      category,
      checkName,
      resource: userName,
      status,
      detail,
    });
  }

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
