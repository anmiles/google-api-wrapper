import { validateCredentials } from '../validator';

describe('src/lib/credentials/validator', () => {
	describe('validateCredentials', () => {
		let expiryDate: Date;

		beforeEach(() => {
			expiryDate = new Date();
			expiryDate.setDate(expiryDate.getDate() - 6);
		});

		it('should return false if no access token', () => {
			expect(validateCredentials({ refresh_token: 'token', expiry_date: expiryDate.getTime() }))
				.toEqual({ isValid: false, validationError: 'Credentials does not have access_token' });
		});

		it('should return false if no refresh token', () => {
			expect(validateCredentials({ access_token: 'token', expiry_date: expiryDate.getTime() }))
				.toEqual({ isValid: false, validationError: 'Credentials does not have refresh_token' });
		});

		it('should return true if no refresh token for temporary credentials', () => {
			expect(validateCredentials({ access_token: 'token', expiry_date: expiryDate.getTime() }, { temporary: true }))
				.toEqual({ isValid: true });
		});

		it('should return false if no expiration date', () => {
			expect(validateCredentials({ access_token: 'token', refresh_token: 'token' }))
				.toEqual({ isValid: false, validationError: 'Credentials does not have expiry_date' });
		});

		it('should return true if credentials are not more than 1 week ago', () => {
			expect(validateCredentials({ access_token: 'token', refresh_token: 'token', expiry_date: expiryDate.getTime() }))
				.toEqual({ isValid: true });
		});

		it('should return false if credentials are more than 1 week ago', () => {
			expiryDate.setDate(expiryDate.getDate() - 2);
			expect(validateCredentials({ access_token: 'token', refresh_token: 'token', expiry_date: expiryDate.getTime() }))
				.toEqual({ isValid: false, validationError: 'Credentials expired' });
		});
	});
});
