import { google } from 'googleapis';
import auth from '../../auth';
import { getAPI } from '../youtube';

jest.mock('googleapis', () => ({
	google : {
		youtube : jest.fn().mockImplementation(() => api),
	},
}));

jest.mock<Partial<typeof auth>>('../../auth', () => ({
	getAuth : jest.fn().mockImplementation(() => googleAuth),
}));

const profile    = 'username';
const api        = 'api';
const googleAuth = 'googleAuth';

describe('src/lib/api/youtube', () => {
	describe('getAPI', () => {
		it('should call getAuth', async () => {
			await getAPI(profile);

			expect(auth.getAuth).toBeCalledWith(profile, undefined);
		});

		it('should pass persistence', async () => {
			await getAPI(profile, { persist : true });

			expect(auth.getAuth).toBeCalledWith(profile, { persist : true });
		});

		it('should get youtube api', async () => {
			await getAPI(profile);

			expect(google.youtube).toBeCalledWith({ version : 'v3', auth : googleAuth });
		});

		it('should return youtube api', async () => {
			const result = await getAPI(profile);

			expect(result).toEqual(api);
		});
	});
});
