import { renderAuth, renderDone } from '../renderer';

const authUrl = 'https://authUrl';
const profile = 'username';
const scope   = [ 'namespace/scope1.readonly', 'namespace/scope2' ];

describe('src/lib/renderer', () => {
	describe('renderAuth', () => {
		it('should return auth page', () => {
			const result = renderAuth({ profile, authUrl, scope });

			expect(result).toMatchSnapshot();
		});

		it('should throw error if property missing', () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			const func = (): string => renderAuth({ scope } as unknown as Parameters<typeof renderAuth>[0]);

			expect(func).toThrow('Missing required value \'profile\' while rendering template \'auth\'');
		});
	});

	describe('renderDone', () => {
		it('should return done page', () => {
			const result = renderDone({ profile });

			expect(result).toMatchSnapshot();
		});

		it('should throw error if property missing', () => {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
			const func = (): string => renderDone({} as unknown as Parameters<typeof renderAuth>[0]);

			expect(func).toThrow('Missing required value \'profile\' while rendering template \'done\'');
		});
	});
});
