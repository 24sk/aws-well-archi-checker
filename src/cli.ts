import { exportToCsv } from './utils/export-result';
import { CheckResult } from './shared/types/check-result';
import * as operationalChecks from './operational-excellence';
import * as securityChecks from './security';
import * as reliabilityChecks from './reliability';
import * as performanceChecks from './performance-efficiency';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

type CheckFunction = () => Promise<CheckResult[]>;

const ALL_CHECKS: Record<string, Record<string, CheckFunction>> = {
  'operational-excellence/monitoring': operationalChecks,
  'operational-excellence/log-collection': operationalChecks,
  'security/iam': securityChecks,
  'security/s3-bucket': securityChecks,
  'security/network': securityChecks,
  'security/kms': securityChecks,
  'security/audit': securityChecks,
  'reliability/availability': reliabilityChecks,
  'reliability/backup': reliabilityChecks,
  'performance-efficiency/instance-type': performanceChecks,
  'performance-efficiency/cash': performanceChecks,
};

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('pillar', {
      type: 'string',
      description: '実行する柱（例: security, operational-excellence）',
    })
    .option('category', {
      type: 'string',
      description: '実行するカテゴリ（例: iam, s3-bucket, audit）',
    })
    .option('check', {
      type: 'string',
      description: '実行する関数名（例: checkIamUserMfa）',
    })
    .help().argv;

  console.log('🚀 well-archi-checker 開始\n');
  const results: CheckResult[] = [];

  const selectedFns = Object.entries(ALL_CHECKS)
    .filter(([path]) => {
      if (argv.pillar && !path.startsWith(argv.pillar)) return false;
      if (argv.category && !path.includes(argv.category)) return false;
      return true;
    })
    .flatMap(([, checkGroup]) =>
      Object.entries(checkGroup).filter(([fnName]) => (argv.check ? fnName === argv.check : true))
    )
    .map(([label, fn]) => ({ label, fn }));

  for (const { label, fn } of selectedFns) {
    try {
      console.log(`▶️  実行中: ${label}`);
      const res = await fn();
      results.push(...res);
      console.log(`✅ 完了: ${label}（${res.length}件）\n`);
    } catch (err) {
      console.error(`❌ 失敗: ${label}`);
      console.error(err);
    }
  }

  exportToCsv(results, 'output/well-archi-report.csv');
  console.log('🎉 全チェック完了');
}

main().catch((err) => {
  console.error('❌ 実行エラー:', err);
  process.exit(1);
});
