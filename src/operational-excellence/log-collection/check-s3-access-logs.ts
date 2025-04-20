import { ListBucketsCommand, GetBucketLoggingCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../shared/aws-client';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

/**
 * S3 バケットのアクセスログ設定をチェックします。
 */
export async function checkS3AccessLogs(): Promise<CheckResult[]> {
  console.log('🔍 [運用上の優秀性] S3 バケットのアクセスログ設定をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'ログ収集';
  const checkName = 'S3バケットにアクセスログが設定されているか';

  const bucketRes = await s3Client.send(new ListBucketsCommand({}));
  const buckets = bucketRes.Buckets ?? [];

  const results: CheckResult[] = await Promise.all(
    buckets.map(async (bucket) => {
      const name = bucket.Name ?? '(名前不明)';
      let status: CheckStatus = 'NG';
      let detail = '不明なエラーが発生しました';

      try {
        const logRes = await s3Client.send(new GetBucketLoggingCommand({ Bucket: name }));

        const isLoggingEnabled = !!logRes.LoggingEnabled;
        status = isLoggingEnabled ? 'OK' : 'NG';
        detail = isLoggingEnabled ? 'アクセスログ有効' : 'アクセスログ未設定';
      } catch (err) {
        status = 'NG';
        detail = 'ログ設定の取得に失敗しました';
        console.error(`⚠️ ${name} のログ取得時にエラー:`, err);
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
  console.log(JSON.stringify(results, null, 2));
  return results;
}
