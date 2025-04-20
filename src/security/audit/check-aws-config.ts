import {
  DescribeConfigurationRecordersCommand,
  DescribeConfigurationRecorderStatusCommand,
} from '@aws-sdk/client-config-service';
import { CheckResult, CheckStatus } from '../../shared/types/check-result';
import { getPillarFromPath } from '../../utils';
import { configClient } from '../../shared/aws-client';

/**
 * AWS Config が現在のリージョンで有効かをチェックする
 */
export async function checkAwsConfig(): Promise<CheckResult[]> {
  console.log('🔍 [監査] AWS Config が現在のリージョンで有効かをチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = '監査';
  const checkName = 'AWS Configが有効か';

  let status: CheckStatus = 'OK';
  let detail = 'AWS Config が有効です';

  try {
    const recorderRes = await configClient.send(new DescribeConfigurationRecordersCommand({}));
    const recorders = recorderRes.ConfigurationRecorders ?? [];

    if (recorders.length === 0) {
      const results: CheckResult[] = [
        {
          pillar,
          category,
          checkName,
          resource: '(default)',
          status,
          detail,
        },
      ];
      console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
      return results;
    }

    const statusRes = await configClient.send(new DescribeConfigurationRecorderStatusCommand({}));

    const isRecording = statusRes.ConfigurationRecordersStatus?.some((r) => r.recording === true);

    if (!isRecording) {
      status = 'NG';
      detail = 'Config Recorder は無効状態です（recording = false）';
    }
  } catch (err) {
    status = 'NG';
    detail = 'Config 状態取得に失敗';
    console.error('⚠️ AWS Config 状態取得エラー:', err);
  }

  const results: CheckResult[] = [
    {
      pillar,
      category,
      checkName,
      resource: '(default)',
      status,
      detail,
    },
  ];
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
