import path from 'node:path';
import fs from 'fs-extra';

export type CopyMode = 'skip' | 'overwrite';
export type CopyResult = 'installed' | 'skipped' | 'overwritten';

export async function listResourceNames(directory: string, extension: string): Promise<string[]> {
  if (!(await fs.pathExists(directory))) {
    return [];
  }

  const entries = await fs.readdir(directory);

  return entries
    .filter((entry) => entry.endsWith(extension))
    .map((entry) => path.basename(entry, extension))
    .sort((a, b) => a.localeCompare(b));
}

export async function copyFileWithMode(
  source: string,
  target: string,
  mode: CopyMode
): Promise<CopyResult> {
  await fs.ensureDir(path.dirname(target));

  const exists = await fs.pathExists(target);

  if (exists && mode === 'skip') {
    return 'skipped';
  }

  await fs.copy(source, target, {
    overwrite: true,
    errorOnExist: false
  });

  return exists ? 'overwritten' : 'installed';
}

export async function copyPathWithMode(
  source: string,
  target: string,
  mode: CopyMode
): Promise<CopyResult> {
  await fs.ensureDir(path.dirname(target));
  const exists = await fs.pathExists(target);
  if (exists && mode === 'skip') return 'skipped';
  await fs.copy(source, target, { overwrite: true, errorOnExist: false });
  return exists ? 'overwritten' : 'installed';
}

export async function listDirectoryNames(directory: string, requiredFile: string): Promise<string[]> {
  if (!(await fs.pathExists(directory))) return [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const names = await Promise.all(entries
    .filter((entry) => entry.isDirectory())
    .map(async (entry) => (await fs.pathExists(path.join(directory, entry.name, requiredFile))) ? entry.name : undefined));
  return names.filter((name): name is string => Boolean(name)).sort((a, b) => a.localeCompare(b));
}
