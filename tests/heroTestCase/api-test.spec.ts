import { test } from '../../fixtures/pom.fixtures';

test.describe('API Tests', () => {
	test('should create a place successfully', async ({ hero }) => {
		await hero.testAPI();
	});
});
