// cli.ts
import { exportToCsv } from './utils/export-result';
import { CheckResult } from './shared/types/check-result';
import * as operationalChecks from './operational-excellence';
import * as securityChecks from './security';
import * as reliabilityChecks from './reliability';
import * as performanceChecks from './performance-efficiency';
import * as costOptimizationChecks from './cost-optimization';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

interface CheckDefinition {
  pillar: string;
  category: string;
  fnName: string;
  fn: () => Promise<CheckResult[]>;
}

const ALL_CHECKS: CheckDefinition[] = [
  // --- Operational Excellence ---
  {
    pillar: 'operational-excellence',
    category: 'monitoring',
    fnName: 'checkCloudWatchAlarms',
    fn: operationalChecks.checkCloudWatchAlarms,
  },
  {
    pillar: 'operational-excellence',
    category: 'log-collection',
    fnName: 'checkCloudTrail',
    fn: operationalChecks.checkCloudTrail,
  },
  {
    pillar: 'operational-excellence',
    category: 'log-collection',
    fnName: 'checkLambdaLogging',
    fn: operationalChecks.checkLambdaLogging,
  },
  {
    pillar: 'operational-excellence',
    category: 'log-collection',
    fnName: 'checkS3AccessLogs',
    fn: operationalChecks.checkS3AccessLogs,
  },
  {
    pillar: 'operational-excellence',
    category: 'log-collection',
    fnName: 'checkVPCFlowLogs',
    fn: operationalChecks.checkVPCFlowLogs,
  },

  // --- Security ---
  {
    pillar: 'security',
    category: 'iam',
    fnName: 'checkIamUserMfa',
    fn: securityChecks.checkIamUserMfa,
  },
  {
    pillar: 'security',
    category: 'iam',
    fnName: 'checkIamUserAttachedPolicies',
    fn: securityChecks.checkIamUserAttachedPolicies,
  },
  {
    pillar: 'security',
    category: 's3-bucket',
    fnName: 'checkS3Encryption',
    fn: securityChecks.checkS3Encryption,
  },
  {
    pillar: 'security',
    category: 'kms',
    fnName: 'checkKmsKeyRotation',
    fn: securityChecks.checkKmsKeyRotation,
  },
  {
    pillar: 'security',
    category: 'audit',
    fnName: 'checkAwsConfig',
    fn: securityChecks.checkAwsConfig,
  },
  {
    pillar: 'security',
    category: 'audit',
    fnName: 'checkSecurityHubEnabled',
    fn: securityChecks.checkSecurityHubEnabled,
  },
  {
    pillar: 'security',
    category: 'audit',
    fnName: 'checkGuardDutyEnabled',
    fn: securityChecks.checkGuardDutyEnabled,
  },
  {
    pillar: 'security',
    category: 'network',
    fnName: 'checkSecurityGroupOpenPorts',
    fn: securityChecks.checkSecurityGroupOpenPorts,
  },
  {
    pillar: 'security',
    category: 'network',
    fnName: 'checkUnusedSecurityGroups',
    fn: securityChecks.checkUnusedSecurityGroups,
  },

  // --- Reliability ---
  {
    pillar: 'reliability',
    category: 'availability',
    fnName: 'checkEC2AutoScaling',
    fn: reliabilityChecks.checkEC2AutoScaling,
  },
  {
    pillar: 'reliability',
    category: 'availability',
    fnName: 'checkRdsMultiAz',
    fn: reliabilityChecks.checkRdsMultiAz,
  },
  {
    pillar: 'reliability',
    category: 'availability',
    fnName: 'checkRoute53HealthChecks',
    fn: reliabilityChecks.checkRoute53HealthChecks,
  },
  {
    pillar: 'reliability',
    category: 'backup',
    fnName: 'checkRdsBackup',
    fn: reliabilityChecks.checkRdsBackup,
  },
  {
    pillar: 'reliability',
    category: 'backup',
    fnName: 'checkEbsSnapshotAutomation',
    fn: reliabilityChecks.checkEbsSnapshotAutomation,
  },

  // --- Performance Efficiency ---
  {
    pillar: 'performance-efficiency',
    category: 'instance-type',
    fnName: 'checkEc2InstanceType',
    fn: performanceChecks.checkEc2InstanceType,
  },
  {
    pillar: 'performance-efficiency',
    category: 'instance-type',
    fnName: 'checkLambdaPerformance',
    fn: performanceChecks.checkLambdaPerformance,
  },
  {
    pillar: 'performance-efficiency',
    category: 'instance-type',
    fnName: 'checkRdsCpuLoad',
    fn: performanceChecks.checkRdsCpuLoad,
  },
  {
    pillar: 'performance-efficiency',
    category: 'monitoring',
    fnName: 'checkAutoScaling',
    fn: performanceChecks.checkAutoScaling,
  },
  {
    pillar: 'performance-efficiency',
    category: 'cache',
    fnName: 'checkCloudFrontUsage',
    fn: performanceChecks.checkCloudFrontUsage,
  },

  // --- Cost Optimization ---
  {
    pillar: 'cost-optimization',
    category: 'unused-resources',
    fnName: 'checkUnusedEbsVolumes',
    fn: costOptimizationChecks.checkUnusedEbsVolumes,
  },
  {
    pillar: 'cost-optimization',
    category: 'unused-resources',
    fnName: 'checkUnusedEc2Instances',
    fn: costOptimizationChecks.checkUnusedEc2Instances,
  },
  {
    pillar: 'cost-optimization',
    category: 'unused-resources',
    fnName: 'checkUnusedElasticIps',
    fn: costOptimizationChecks.checkUnusedElasticIps,
  },
  {
    pillar: 'cost-optimization',
    category: 'unused-resources',
    fnName: 'checkOldEc2Snapshots',
    fn: costOptimizationChecks.checkOldEc2Snapshots,
  },
  {
    pillar: 'cost-optimization',
    category: 'unused-resources',
    fnName: 'checkOldRdsSnapshots',
    fn: costOptimizationChecks.checkOldRdsSnapshots,
  },
  {
    pillar: 'cost-optimization',
    category: 'plan',
    fnName: 'checkReservedPlan',
    fn: costOptimizationChecks.checkReservedPlan,
  },
  {
    pillar: 'cost-optimization',
    category: 'monitoring',
    fnName: 'checkBudgetsConfigured',
    fn: costOptimizationChecks.checkBudgetsConfigured,
  },
  {
    pillar: 'cost-optimization',
    category: 'monitoring',
    fnName: 'checkCostExplorerEnabled',
    fn: costOptimizationChecks.checkCostExplorerEnabled,
  },
  {
    pillar: 'cost-optimization',
    category: 's3',
    fnName: 'checkS3Storage',
    fn: costOptimizationChecks.checkS3Storage,
  },
  {
    pillar: 'cost-optimization',
    category: 's3',
    fnName: 'checkS3LifecyclePolicy',
    fn: costOptimizationChecks.checkS3LifecyclePolicy,
  },
];

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .options({
      pillar: {
        type: 'string',
        description: '実行する柱（例: security, operational-excellence）',
        choices: Array.from(new Set(ALL_CHECKS.map((c) => c.pillar))),
      },
      category: {
        type: 'string',
        description: '実行するカテゴリ（例: iam, s3-bucket, audit）',
        choices: Array.from(new Set(ALL_CHECKS.map((c) => c.category))),
      },
      check: {
        type: 'string',
        description: '実行する関数名（例: checkIamUserMfa）',
        choices: ALL_CHECKS.map((c) => c.fnName),
      },
    })
    .help().argv;

  console.log('🚀 well-archi-checker 開始\n');
  const results: CheckResult[] = [];

  const selectedChecks = ALL_CHECKS.filter((check) => {
    if (argv.pillar && check.pillar !== argv.pillar) return false;
    if (argv.category && check.category !== argv.category) return false;
    if (argv.check && check.fnName !== argv.check) return false;
    return true;
  });

  for (const { fnName, fn } of selectedChecks) {
    try {
      console.log(`▶️  実行中: ${fnName}`);
      const res = await fn();
      results.push(...res);
      console.log(`✅ 完了: ${fnName}（${res.length}件）\n`);
    } catch (err) {
      console.error(`❌ 失敗: ${fnName}`);
      console.error(err);
    }
  }

  exportToCsv(results, 'output/well-archi-report.csv');
  console.log('\n📦 CSV出力完了: output/well-archi-report.csv');
  console.log('🎉 全チェック完了');
}

main().catch((err) => {
  console.error('❌ 実行エラー:', err);
  process.exit(1);
});
