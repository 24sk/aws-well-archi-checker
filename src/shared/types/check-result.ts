export const CHECK_STATUSES = ['OK', 'NG'] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

/**
 * チェック結果
 */
export interface CheckResult {
  /**
   * チェックの柱
   * @remark Well-Architected Frameworkの6つの柱から抽出
   * @see https://aws.amazon.com/jp/architecture/well-architected/
   */
  pillar: string;

  /**
   * カテゴリ
   */
  category: string;

  /**
   * チェック項目
   */
  checkName: string;

  /**
   * チェック対象のリソースIDまたはリソース名
   */
  resource: string;

  /**
   * チェックのステータス
   * @see {@link CHECK_STATUSES}
   */
  status: CheckStatus;

  /**
   * 詳細
   */
  detail: string;
}
