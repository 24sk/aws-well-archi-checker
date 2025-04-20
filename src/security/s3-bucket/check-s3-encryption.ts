import {
  ListBucketsCommand,
  GetBucketEncryptionCommand,
  S3Client,
  ServerSideEncryptionConfiguration,
} from '@aws-sdk/client-s3';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

const s3Client = new S3Client({});

/**
 * S3 バケットにサーバーサイド暗号化（SSE）が有効かをチェックする
 */
export async function checkS3Encryption(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] S3 バケットの暗号化設定（SSE）が有効かをチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'S3バケット';
  const checkName = 'S3バケットにサーバーサイド暗号化が有効か';

  const bucketRes = await s3Client.send(new ListBucketsCommand({}));
  const buckets = bucketRes.Buckets ?? [];

  const results: CheckResult[] = await Promise.all(
    buckets.map(async (bucket) => {
      const name = bucket.Name ?? '(名前不明)';
      let status: CheckStatus = 'OK';
      let detail = '暗号化設定あり';

      try {
        const encRes = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: name }));
        const config: ServerSideEncryptionConfiguration | undefined =
          encRes.ServerSideEncryptionConfiguration;
        const rules = config?.Rules ?? [];

        const isEncrypted = rules.some((rule) =>
          ['AES256', 'aws:kms'].includes(
            rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm ?? ''
          )
        );

        if (!isEncrypted) {
          status = 'NG';
          detail = '暗号化ルールは存在するが方式が不明';
        }
      } catch (err: any) {
        if (err.name === 'ServerSideEncryptionConfigurationNotFoundError') {
          status = 'NG';
          detail = '暗号化設定が存在しません';
        } else {
          status = 'NG';
          detail = '設定取得に失敗';
          console.error(`⚠️ ${name} の暗号化設定取得時にエラー:`, err);
        }
      }

      return {
        pillar,
        category,
        checkName,
        resource: name,
        status,
        detail,
      };
    })
  );

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
