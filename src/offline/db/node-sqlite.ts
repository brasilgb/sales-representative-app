/**
 * Adaptador de LocalDb sobre o SQLite embutido do Node. Usado pelos testes automatizados para
 * executar o mesmo SQL das migrações e dos repositórios. Não é usado no aplicativo.
 */
import { DatabaseSync } from 'node:sqlite';
import type { LocalDb } from './ports.ts';

export type NodeDatabase = LocalDb & { close(): void };

/** Abre um banco em memória ou em arquivo (para testar persistência entre aberturas). */
export function openNodeDatabase(file: string = ':memory:'): NodeDatabase {
  const native = new DatabaseSync(file);
  let depth = 0;

  const db: NodeDatabase = {
    close() {
      native.close();
    },
    async run(sql, params = []) {
      native.prepare(sql).run(...(params as never[]));
    },
    async all(sql, params = []) {
      return native.prepare(sql).all(...(params as never[])) as never;
    },
    async first(sql, params = []) {
      return (native.prepare(sql).get(...(params as never[])) as never) ?? null;
    },
    async transaction(work) {
      if (depth > 0) {
        return work();
      }
      depth += 1;
      native.exec('BEGIN IMMEDIATE');
      try {
        const result = await work();
        native.exec('COMMIT');
        return result;
      } catch (error) {
        native.exec('ROLLBACK');
        throw error;
      } finally {
        depth -= 1;
      }
    },
  };

  return db;
}
