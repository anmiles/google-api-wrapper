module.exports = {
	preset     : 'ts-jest',
	clearMocks : true,

	roots     : [ '<rootDir>/src' ],
	testMatch : [ '<rootDir>/src/**/__tests__/*.test.ts' ],
	transform : {
		'^.+\\.ts$' : 'ts-jest',
	},
	collectCoverageFrom : [
		'<rootDir>/src/**/*.ts',
		'!<rootDir>/src/**/*.d.ts',
		'!<rootDir>/src/*.ts',
		'!<rootDir>/src/types/*.ts',

		'!**/node_modules/**',
		'!**/__tests__/**',

		'!<rootDir>/coverage/**',
		'!<rootDir>/dist/**',
	],
};
