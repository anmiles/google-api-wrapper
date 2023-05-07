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

			expect(auth.getAuth).toHaveBeenCalledWith(profile, undefined);
		});

		it('should pass temporariness', async () => {
			await getAPI(profile, { temporary : true });

			expect(auth.getAuth).toHaveBeenCalledWith(profile, { temporary : true });
		});

		it('should get youtube api', async () => {
			await getAPI(profile);

			expect(google.youtube).toHaveBeenCalledWith({ version : 'v3', auth : googleAuth });
		});

		it('should return youtube api', async () => {
			const result = await getAPI(profile);

			expect(result).toEqual(api);
		});
	});
});
