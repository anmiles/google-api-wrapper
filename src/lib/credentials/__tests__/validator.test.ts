import { validateCredentials } from '../validator';

describe('src/lib/credentials/validator', () => {
	describe('validateCredentials', () => {
		it('should return false if no access token', async () => {
			expect(await validateCredentials({}))
				.toEqual({ isValid: false, validationError: 'Credentials does not have access_token' });
		});

		it('should return false if no refresh token', async () => {
			expect(await validateCredentials({ access_token: 'token' }))
				.toEqual({ isValid: false, validationError: 'Credentials does not have refresh_token' });
		});

		it('should return false if no expiration date', async () => {
			expect(await validateCredentials({ access_token: 'token', refresh_token: 'token' }))
				.toEqual({ isValid: false, validationError: 'Credentials does not have expiry_date' });
		});

		it('should return true if credentials are not more than 1 week ago', async () => {
			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() - 6);
			expect(await validateCredentials({ access_token: 'token', refresh_token: 'token', expiry_date: expiryDate.getTime() }))
				.toEqual({ isValid: true });
		});

		it('should return false if credentials are more than 1 week ago', async () => {
			const expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() - 8);
			expect(await validateCredentials({ access_token: 'token', refresh_token: 'token', expiry_date: expiryDate.getTime() }))
				.toEqual({ isValid: false, validationError: 'Credentials expired' });
		});
	});
});
