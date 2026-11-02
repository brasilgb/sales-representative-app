/**
 * Portas da camada offline. Os módulos de domínio dependem somente destas interfaces; a
 * implementação real (expo-sqlite, SecureStore, NetInfo, API) fica nos adaptadores.
 */
export interface LocalDb {
  run(sql: string, params?: readonly unknown[]): Promise<void>;
  all<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  first<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<T | null>;
  transaction<T>(work: () => Promise<T>): Promise<T>;
}

export interface SecureKeyStore {
  get(name: string): Promise<string | null>;
  set(name: string, value: string): Promise<void>;
  remove(name: string): Promise<void>;
}

export interface DatabaseFiles {
  /** Abre (criando, se preciso) o banco criptografado com a chave informada. */
  open(name: string, keyHex: string): Promise<LocalDb>;
  /** Remove o arquivo do banco por completo. */
  remove(name: string): Promise<void>;
}

export interface RandomSource {
  /** Bytes aleatórios criptograficamente seguros, em hexadecimal. */
  randomHex(bytes: number): string;
}
