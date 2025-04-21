import { ListBucketsCommand, ListObjectsV2Command, _Object as S3Object } from '@aws-sdk/client-s3';
import { s3Client } from '../../shared/aws-client';
import { getPillarFromPath } from '../../utils';
import { type CheckResult, type CheckStatus } from '../../shared/types/check-result';

/**
 * S3 のストレージクラスが適切に設定されているかチェックする
 */
export async function checkS3Storage(): Promise<CheckResult[]> {
  console.log('🔍 [コスト最適化] S3 ストレージクラスの最適化状況をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'S3最適化';
  const checkName = 'S3のストレージクラスが適切に設定されているか';

  const bucketRes = await s3Client.send(new ListBucketsCommand());
  const buckets = bucketRes.Buckets ?? [];

  const results = await Promise.all(
    buckets.map(async (bucket): Promise<CheckResult> => {
      const bucketName = bucket.Name ?? '(名前不明)';

      try {
        const objRes = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 100,
          })
        );

        const objects: S3Object[] = objRes.Contents ?? [];

        const nonOptimized = objects.filter(
          (obj) => obj.StorageClass === 'STANDARD' && (obj.Size ?? 0) > 10 * 1024 * 1024
        );

        const status: CheckStatus = nonOptimized.length > 0 ? 'NG' : 'OK';
        const detail =
          status === 'NG'
            ? `${nonOptimized.length} 件のオブジェクトがSTANDARDクラスのままです`
            : 'ストレージクラスは最適化されています（上位100件のオブジェクト）';

        return {
          pillar,
          category,
          checkName,
          resource: bucketName,
          status,
          detail,
        };
      } catch (err) {
        return {
          pillar,
          category,
          checkName,
          resource: bucketName,
          status: 'NG',
          detail: `オブジェクト一覧取得に失敗しました: ${(err as Error).message}`,
        };
      }
    })
  );

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
