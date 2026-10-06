import { test } from '../../fixtures/pom.fixtures';
import { Logger } from '../../Helper/utils/logger';

test.describe('API Tests', () => {
	test('should create a place successfully', async ({ hero }) => {
		Logger.info('TEST', 'Starting API test: create a place');
		await hero.testAPI();
		Logger.info('TEST', 'Completed API test: create a place');
	});
});
