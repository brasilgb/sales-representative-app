/**
 * Escopo local por tenant e usuário. Cada par tem seu próprio arquivo de banco criptografado e sua
 * própria chave. Um usuário nunca abre o banco de outro: o nome do arquivo e a chave dependem do
 * par, e o banco guarda o escopo dono para detectar qualquer divergência.
 */
import { migrate } from '../db/migrations.ts';
import type { DatabaseFiles, LocalDb, RandomSource, SecureKeyStore } from '../db/ports.ts';
import { getMeta, setMeta } from '../catalog/catalog-sync.ts';

export type Scope = { tenantId: number; userId: number };

export class ScopeMismatchError extends Error {
  constructor() {
    super('O banco local pertence a outra conta. A abertura foi recusada.');
  }
}

export function scopeId(scope: Scope): string {
  return `${scope.tenantId}:${scope.userId}`;
}

export function scopeDbName(scope: Scope): string {
  return `vetorpet-${scope.tenantId}-${scope.userId}.db`;
}

export function scopeKeyName(scope: Scope): string {
  return `offline-db-key-${scope.tenantId}-${scope.userId}`;
}

export type ScopePorts = { files: DatabaseFiles; keys: SecureKeyStore; random: RandomSource };

/** Abre (ou cria) o banco do escopo, aplica as migrações e confirma o dono do banco. */
export async function openScopedDatabase(scope: Scope, ports: ScopePorts): Promise<LocalDb> {
  const keyName = scopeKeyName(scope);
  let key = await ports.keys.get(keyName);

  if (!key) {
    key = ports.random.randomHex(32);
    await ports.keys.set(keyName, key);
  }

  const db = await ports.files.open(scopeDbName(scope), key);
  await migrate(db);

  const owner = await getMeta(db, 'owner_scope');
  if (owner === null) {
    await setMeta(db, 'owner_scope', scopeId(scope));
  } else if (owner !== scopeId(scope)) {
    throw new ScopeMismatchError();
  }

  return db;
}

/** Limpeza no logout ou na troca de conta: remove o arquivo e a chave do escopo, por completo. */
export async function purgeScope(scope: Scope, ports: Pick<ScopePorts, 'files' | 'keys'>): Promise<void> {
  await ports.files.remove(scopeDbName(scope));
  await ports.keys.remove(scopeKeyName(scope));
}
