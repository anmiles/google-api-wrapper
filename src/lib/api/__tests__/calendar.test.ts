import { google } from 'googleapis';
import auth from '../../auth';
import { getAPI } from '../calendar';

jest.mock('googleapis', () => ({
	google : {
		calendar : jest.fn().mockImplementation(() => api),
	},
}));

jest.mock<Partial<typeof auth>>('../../auth', () => ({
	getAuth : jest.fn().mockImplementation(() => googleAuth),
}));

const profile    = 'username';
const api        = 'api';
const googleAuth = 'googleAuth';

describe('src/lib/api/calendar', () => {
	describe('getAPI', () => {
		it('should call getAuth', async () => {
			await getAPI(profile);

			expect(auth.getAuth).toBeCalledWith(profile, undefined);
		});

		it('should pass temporariness', async () => {
			await getAPI(profile, { temporary : true });

			expect(auth.getAuth).toBeCalledWith(profile, { temporary : true });
		});

		it('should get calendar api', async () => {
			await getAPI(profile);

			expect(google.calendar).toBeCalledWith({ version : 'v3', auth : googleAuth });
		});

		it('should return calendar api', async () => {
			const result = await getAPI(profile);

			expect(result).toEqual(api);
		});
	});
});
