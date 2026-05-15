import { getDatabase } from './Helper/utils/db/DatabaseFactory';
import { Logger } from './Helper/utils/logger';

export default async function globalTeardown() {
  try {
    Logger.info('DB', 'Closing CLMS DB connections...');
    getDatabase('mssql', 'CLMS')?.close();
    // Logger.info('DB', 'Closing DNA DB connections...');
    // getDatabase('oracle', 'DNA')?.close();
  } catch (e) {
    Logger.error('DB', 'Error during database connections closing', e as Error);
  }
}