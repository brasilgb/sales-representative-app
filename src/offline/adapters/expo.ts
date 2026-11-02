/**
 * Adaptadores do aparelho: SQLite criptografado (SQLCipher, habilitado no app.json), chaves no
 * armazenamento seguro do sistema e aleatoriedade criptográfica. Não é coberto pelos testes
 * automatizados do Node: depende de runtime nativo e deve ser validado em aparelho ou emulador.
 */
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import type { DatabaseFiles, LocalDb, RandomSource, SecureKeyStore } from '../db/ports';

function wrap(native: SQLite.SQLiteDatabase): LocalDb {
  let depth = 0;

  return {
    async run(sql, params = []) {
      await native.runAsync(sql, params as never[]);
    },
    async all(sql, params = []) {
      return (await native.getAllAsync(sql, params as never[])) as never;
    },
    async first(sql, params = []) {
      return (await native.getFirstAsync(sql, params as never[])) as never;
    },
    async transaction(work) {
      if (depth > 0) {
        return work();
      }

      let result: unknown;
      depth += 1;
      try {
        await native.withTransactionAsync(async () => {
          result = await work();
        });
        return result as never;
      } finally {
        depth -= 1;
      }
    },
  };
}

export const expoDatabaseFiles: DatabaseFiles = {
  async open(name, keyHex) {
    const native = await SQLite.openDatabaseAsync(name);
    // SQLCipher: a chave precisa ser a primeira instrução. Chave errada falha na leitura do esquema.
    await native.execAsync(`PRAGMA key = "x'${keyHex}'"`);
    await native.getFirstAsync('SELECT count(*) AS total FROM sqlite_master');
    return wrap(native);
  },
  async remove(name) {
    await SQLite.deleteDatabaseAsync(name);
  },
};

const KEY_OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const expoKeyStore: SecureKeyStore = {
  get: (name) => SecureStore.getItemAsync(name, KEY_OPTIONS),
  set: (name, value) => SecureStore.setItemAsync(name, value, KEY_OPTIONS),
  remove: (name) => SecureStore.deleteItemAsync(name, KEY_OPTIONS),
};

export const expoRandom: RandomSource = {
  randomHex(bytes) {
    return Array.from(Crypto.getRandomBytes(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
  },
};
