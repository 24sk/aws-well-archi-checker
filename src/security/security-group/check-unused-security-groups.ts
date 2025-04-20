import {
  DescribeSecurityGroupsCommand,
  DescribeNetworkInterfacesCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { getPillarFromPath } from '../../utils';
import { CheckResult } from '../../shared/types/check-result';

const ec2Client = new EC2Client({});

/**
 * いずれのリソースにも関連付けられていない不要なセキュリティグループを検出する
 */
export async function checkUnusedSecurityGroups(): Promise<CheckResult[]> {
  console.log('🔍 [セキュリティ] 未使用のセキュリティグループをチェック中...');

  const pillar = getPillarFromPath(__dirname);
  const category = 'セキュリティグループ';
  const checkName = '不要なセキュリティグループが存在しないか';

  // 1. 全セキュリティグループを取得
  const sgRes = await ec2Client.send(new DescribeSecurityGroupsCommand({}));
  const allGroups = sgRes.SecurityGroups ?? [];

  // 2. 全ネットワークインターフェース（ENI）に紐づくSGを取得
  const eniRes = await ec2Client.send(new DescribeNetworkInterfacesCommand({}));
  const usedGroupIds = new Set(
    (eniRes.NetworkInterfaces ?? []).flatMap(
      (eni) => eni.Groups?.map((group) => group.GroupId) ?? []
    )
  );

  // 3. 使用されていないSGを抽出
  const results: CheckResult[] = allGroups.map((group) => {
    const groupId = group.GroupId ?? '(ID不明)';
    const groupName = group.GroupName ?? '(名前不明)';
    const inUse = usedGroupIds.has(groupId);

    return {
      pillar,
      category,
      checkName,
      resource: `${groupName} (${groupId})`,
      status: inUse ? 'OK' : 'NG',
      detail: inUse ? 'リソースに関連付けられています' : 'どのリソースにも関連付けられていません',
    };
  });

  console.log(`✅ チェック結果: ${results.length} 件`);
  console.log(`✅ チェック結果: ${JSON.stringify(results, null, 2)}`);
  return results;
}
