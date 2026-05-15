import { test as base } from '@playwright/test';
import { getDatabase, Database } from '../Helper/utils/db/DatabaseFactory';

/**
* TypeScript Idiomatic: Functional database fixtures
* Sử dụng Database type thay vì IDatabase interface
*/

type DBFixtures = {
  clmsDb: Database;
  dnaDb: Database;
};

export const test = base.extend<DBFixtures>({
  clmsDb: async ({}, use) => {
    const db = getDatabase('mssql', 'CLMS');
    await use(db);
    // KHÔNG close ở đây, vì singleton được reuse
  },

  dnaDb: async ({}, use) => {
    const db = getDatabase('oracle', 'DNA');
    await use(db);
  },
});

export { expect } from '@playwright/test';
 