import { ListBucketsCommand, GetPublicAccessBlockCommand, S3Client } from '@aws-sdk/client-s3';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';

const s3Client = new S3Client({});

/**
 * S3 バケットにパブリックアクセスブロックが有効かをチェックする
 */
export async function checkS3PublicAccessBlock(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] S3 バケットのパブリックアクセスブロック設定をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'S3バケット';
  const checkName = 'S3バケットにパブリックアクセスブロックが有効か';

  const bucketRes = await s3Client.send(new ListBucketsCommand({}));
  const buckets = bucketRes.Buckets ?? [];

  const results: CheckResult[] = await Promise.all(
    buckets.map(async (bucket) => {
      const name = bucket.Name ?? '(名前不明)';
      let status: CheckStatus = 'OK';
      let detail = 'すべてのパブリックアクセスがブロックされています';

      try {
        const blockRes = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: name }));

        const config = blockRes.PublicAccessBlockConfiguration;

        const allBlocked =
          config?.BlockPublicAcls &&
          config?.IgnorePublicAcls &&
          config?.BlockPublicPolicy &&
          config?.RestrictPublicBuckets;

        if (!allBlocked) {
          status = 'NG';
          detail = 'パブリックアクセスを完全にブロックしていません';
        }
      } catch (err) {
        status = 'NG';
        detail = '設定取得に失敗';
        console.error(`⚠️ ${name} のパブリックアクセス設定取得時にエラー:`, err);
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
