export const Pillars = [
  'operational-excellence',
  'security',
  'reliability',
  'performance-efficiency',
  'cost-optimization',
  'sustainability',
] as const;

export type Pillar = (typeof Pillars)[number];

export const PILLAR_MAP: Record<Pillar, string> = {
  'operational-excellence': '1.運用上の優秀性',
  security: '2.セキュリティ',
  reliability: '3.信頼性',
  'performance-efficiency': '4.パフォーマンス',
  'cost-optimization': '5.コスト最適化',
  sustainability: '6.持続可能性',
} as const;
