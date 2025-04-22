import { IAMClient, ListUsersCommand, ListMFADevicesCommand } from '@aws-sdk/client-iam';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

const iamClient = new IAMClient({});

/**
 * IAMユーザーにMFAが有効かチェックする
 * - MFAデバイスが1つ以上有効な場合はOK
 */
export async function checkIamUserMfa(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] IAMユーザーにMFAが有効かをチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'アイデンティティとアクセス管理';
  const checkName = 'IAMユーザーにMFAが有効か';

  const userRes = await iamClient.send(new ListUsersCommand({}));
  const users = userRes.Users ?? [];

  const results: CheckResult[] = await Promise.all(
    users.map(async (user) => {
      const userName = user.UserName ?? '(名前不明)';
      let status: CheckStatus = 'OK';
      let detail = 'MFAが有効です';

      try {
        const mfaRes = await iamClient.send(new ListMFADevicesCommand({ UserName: userName }));
        const devices = mfaRes.MFADevices ?? [];

        if (devices.length === 0) {
          status = 'NG';
          detail = 'MFAが有効になっていません';
        }
      } catch (err) {
        status = 'NG';
        detail = 'MFA情報の取得に失敗';
        console.error(`⚠️ ${userName} のMFA確認時にエラー:`, err);
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
