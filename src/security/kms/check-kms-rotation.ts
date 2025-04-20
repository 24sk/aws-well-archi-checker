import {
  ListKeysCommand,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { kmsClient } from '../../shared/aws-client';

/**
 * カスタマー管理 KMS キーがローテーションされているかチェックする
 */
export async function checkKmsKeyRotation(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] KMS キーのローテーション設定をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '暗号化';
  const checkName = 'KMSキーが適切にローテーションされているか';

  const keyListRes = await kmsClient.send(new ListKeysCommand({}));
  const keys = keyListRes.Keys ?? [];

  const results: CheckResult[] = [];

  for (const key of keys) {
    const keyId = key.KeyId ?? '(KeyId不明)';
    let status: CheckStatus = 'OK';
    let detail = 'ローテーション設定が有効です';

    try {
      const descRes = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
      const metadata = descRes.KeyMetadata;

      if (metadata?.KeyManager !== 'CUSTOMER') {
        // AWS 管理キーは対象外として OK 判定
        continue;
      }

      const rotationRes = await kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));

      const isEnabled = rotationRes.KeyRotationEnabled;

      if (!isEnabled) {
        status = 'NG';
        detail = 'ローテーションが無効です';
      }
    } catch (err) {
      status = 'NG';
      detail = 'ローテーション設定取得に失敗';
      console.error(`⚠️ KMS Key ${keyId} チェック中にエラー:`, err);
    }

    results.push({
      pillar,
      category,
      checkName,
      resource: keyId,
      status,
      detail,
    });
  }

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
