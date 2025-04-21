import { ListBucketsCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../../shared/aws-client';
import { getPillarFromPath } from '../../utils';
import { type CheckResult, type CheckStatus } from '../../shared/types/check-result';

/**
 * S3 のライフサイクルポリシーが設定されているかをチェック
 */
export async function checkS3LifecyclePolicy(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] S3 のライフサイクルポリシー設定状況をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'ライフサイクル';
  const checkName = 'S3のライフサイクルポリシーが設定されているか';

  const bucketRes = await s3Client.send(new ListBucketsCommand());
  const buckets = bucketRes.Buckets ?? [];

  const results = await Promise.all(
    buckets.map(async (bucket): Promise<CheckResult> => {
      const bucketName = bucket.Name ?? '(名前不明)';

      try {
        const policyRes = await s3Client.send(
          new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
        );

        const rules = policyRes.Rules ?? [];
        const status: CheckStatus = rules.length > 0 ? 'OK' : 'NG';
        const detail =
          status === 'OK'
            ? `${rules.length} 件のライフサイクルルールが設定されています`
            : 'ライフサイクルポリシーが未設定です';

        return {
          pillar,
          category,
          checkName,
          resource: bucketName,
          status,
          detail,
        };
      } catch (err: any) {
        const isNotFound = err?.$metadata?.httpStatusCode === 404;
        return {
          pillar,
          category,
          checkName,
          resource: bucketName,
          status: isNotFound ? 'NG' : 'NG',
          detail: isNotFound
            ? 'ライフサイクルポリシーが設定されていません'
            : `ライフサイクル取得に失敗しました: ${err.name ?? 'UnknownError'}`,
        };
      }
    })
  );

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
