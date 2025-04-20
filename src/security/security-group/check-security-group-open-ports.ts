import { DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { CheckResult } from '../../shared/types/check-result';
import { ec2Client } from '../../shared/aws-client';
import { getPillarFromPath } from '../../utils';

// 危険とされる公開ポートのリスト（使用しているDBはMySQLのみ）
const DANGEROUS_PORTS = [22, 3306]; // SSH と MySQL のみ

/**
 * セキュリティグループにおいて 0.0.0.0/0 へ危険ポートが公開されていないかをチェック
 */
export async function checkSecurityGroupOpenPorts(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] セキュリティグループの危険ポート公開をチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'セキュリティグループ';
  const checkName = '0.0.0.0/0 に対して危険なポートが公開されていないか';

  const res = await ec2Client.send(new DescribeSecurityGroupsCommand({}));
  const groups = res.SecurityGroups ?? [];

  const results: CheckResult[] = [];

  for (const group of groups) {
    const groupName = group.GroupName ?? '(名前不明)';
    const groupId = group.GroupId ?? '(ID不明)';
    const resource = `${groupName} (${groupId})`;

    const violations: string[] = [];

    for (const permission of group.IpPermissions ?? []) {
      const fromPort = permission.FromPort;
      const toPort = permission.ToPort;

      if (
        fromPort !== undefined &&
        toPort !== undefined &&
        DANGEROUS_PORTS.some((port) => fromPort <= port && port <= toPort)
      ) {
        for (const range of permission.IpRanges ?? []) {
          if (range.CidrIp === '0.0.0.0/0') {
            violations.push(`Port ${fromPort}-${toPort}`);
          }
        }
      }
    }

    if (violations.length > 0) {
      results.push({
        pillar,
        category,
        checkName,
        resource,
        status: 'NG',
        detail: `危険なポートが公開されています: ${violations.join(', ')}`,
      });
    } else {
      results.push({
        pillar,
        category,
        checkName,
        resource,
        status: 'OK',
        detail: '問題ありません',
      });
    }
  }

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
