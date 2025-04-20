import path from 'path';
import { Pillar, PILLAR_MAP } from '../shared/consts/pillars';

/**
 * ファイルの __dirname から柱（pillar）を自動で取得する
 * @param dirPath - __dirname を渡す
 * @returns ピラー名（例: 'セキュリティ'）または '(不明な柱)'
 */
export function getPillarFromPath(dirPath: string): string {
  const parts = dirPath.split(path.sep);
  const pillarFolder = parts[parts.length - 2]; // 1つ上のディレクトリ名を取得

  return PILLAR_MAP[pillarFolder as Pillar] ?? '(不明な柱)';
}
