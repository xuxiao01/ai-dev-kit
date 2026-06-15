import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function getPackageRoot(cliImportMetaUrl: string): string {
  const cliFile = fileURLToPath(cliImportMetaUrl);
  return path.resolve(path.dirname(cliFile), '..');
}
