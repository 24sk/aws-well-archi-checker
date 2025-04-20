import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { parse } from 'json2csv';
import { CheckResult } from '../shared/types/check-result';

export function exportToCsv(results: CheckResult[], filePath: string): void {
  const fields = ['pillar', 'category', 'checkName', 'resource', 'status', 'detail'];
  const csv = parse(results, { fields });

  const dir = filePath.split('/').slice(0, -1).join('/');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(filePath, csv, 'utf8');
  console.log(`📄 CSV出力完了: ${filePath}`);
}
