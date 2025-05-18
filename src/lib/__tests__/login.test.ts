import logger from '@anmiles/logger';

import { getAuth } from '../auth';
import { login } from '../login';
import { getProfiles } from '../profiles';

const profiles = [ 'username1', 'username2' ];

jest.mock('@anmiles/logger');
jest.mock('../auth');
jest.mock('../profiles');

jest.mocked(getProfiles).mockReturnValue(profiles);

describe('src/lib/login', () => {
	describe('login', () => {
		it('should auth all profiles', async () => {
			await login();

			profiles.forEach((profile) => {
				expect(getAuth).toHaveBeenCalledWith(profile, undefined);
			});
		});

		it('should auth only specified profile', async () => {
			await login('username1');

			expect(getAuth).toHaveBeenCalledWith('username1', undefined);
			expect(getAuth).not.toHaveBeenCalledWith('username2', undefined);
		});

		it('should pass temporariness for all profiles', async () => {
			await login(undefined, { temporary: true });

			expect(getAuth).toHaveBeenCalledWith('username1', { temporary: true });
			expect(getAuth).toHaveBeenCalledWith('username2', { temporary: true });

		});

		it('should pass temporariness only for specified profile', async () => {
			await login('username1', { temporary: true });

			expect(getAuth).toHaveBeenCalledWith('username1', { temporary: true });
			expect(getAuth).not.toHaveBeenCalledWith('username2', { temporary: true });

		});

		it('should show auth progress for all profiles by default', async () => {
			await login();

			expect(logger.warn).toHaveBeenCalledWith('username1 - logging in...');
			expect(logger.warn).toHaveBeenCalledWith('username2 - logging in...');
			expect(logger.info).toHaveBeenCalledWith('username1 - logged in successfully');
			expect(logger.info).toHaveBeenCalledWith('username2 - logged in successfully');
		});

		it('should show auth progress for specified profile by default', async () => {
			await login('username1');

			expect(logger.warn).toHaveBeenCalledWith('username1 - logging in...');
			expect(logger.info).toHaveBeenCalledWith('username1 - logged in successfully');
		});

		it('should not show auth progress if hidden', async () => {
			await login(undefined, { hideProgress: true });
			await login('username1', { hideProgress: true });

			expect(logger.info).not.toHaveBeenCalled();
		});
	});
});
