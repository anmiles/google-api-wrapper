import fs from 'fs';
import logger from '../logger';
import paths from '../paths';

import jsonLib from '../jsonLib';
const original = jest.requireActual('../jsonLib').default as typeof jsonLib;
jest.mock<typeof jsonLib>('../jsonLib', () => ({
	readJSON     : jest.fn().mockImplementation(() => json),
	writeJSON    : jest.fn(),
	getJSON      : jest.fn(),
	getJSONAsync : jest.fn(),
	checkJSON    : jest.fn(),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	readFileSync  : jest.fn().mockImplementation(() => jsonString),
	writeFileSync : jest.fn(),
	existsSync    : jest.fn().mockImplementation(() => fileExists),
}));

jest.mock<Partial<typeof logger>>('../logger', () => ({
	error : jest.fn().mockImplementation((error) => {
		throw error;
	}) as jest.Mock<never, any>,
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	ensureFile : jest.fn(),
}));

const filename     = 'filename';
const json         = { key : 'value' };
const jsonString   = JSON.stringify(json, null, '    ');
const fallbackJSON = { fallbackKey : 'fallbackValue' };

let fileExists: boolean;
let validation: boolean;

const validateCallback      = jest.fn().mockImplementation(() => validation);
const validateCallbackAsync = jest.fn().mockImplementation(async () => validation);

const createCallback      = jest.fn().mockReturnValue(fallbackJSON);
const createCallbackAsync = jest.fn().mockResolvedValue(fallbackJSON);

describe('src/lib/jsonLib', () => {
	describe('readJSON', () => {
		it('should read specified file', () => {
			original.readJSON(filename);

			expect(fs.readFileSync).toHaveBeenCalledWith(filename);
		});

		it('should return parsed JSON', () => {
			const result = original.readJSON(filename);

			expect(result).toEqual(json);
		});
	});

	describe('writeJSON', () => {
		it('should write JSON into specified file', () => {
			original.writeJSON(filename, json);

			expect(fs.writeFileSync).toHaveBeenCalledWith(filename, jsonString);
		});
	});

	describe('getJSON', () => {

		it('should call readJSON if file exists and json is valid', () => {
			fileExists = true;
			validation = true;

			original.getJSON(filename, createCallback, validateCallback);

			expect(jsonLib.readJSON).toHaveBeenCalledWith(filename);
			expect(createCallback).not.toHaveBeenCalled();
		});

		it('should call createCallback if file exists but json is not valid', () => {
			fileExists = true;
			validation = false;

			original.getJSON(filename, createCallback, validateCallback);

			expect(jsonLib.readJSON).toHaveBeenCalledWith(filename);
			expect(createCallback).toHaveBeenCalledWith();
		});

		it('should call createCallback if file not exists', () => {
			fileExists = false;

			original.getJSON(filename, createCallback, validateCallback);

			expect(jsonLib.readJSON).not.toHaveBeenCalled();
			expect(createCallback).toHaveBeenCalledWith();
		});

		it('should not write fallback JSON back if file exists and json is valid', () => {
			fileExists = true;
			validation = true;

			original.getJSON(filename, createCallback, validateCallback);

			expect(jsonLib.writeJSON).not.toHaveBeenCalled();
		});

		it('should write fallback JSON back if file exists but json is not valid', () => {
			fileExists = true;
			validation = false;

			original.getJSON(filename, createCallback, validateCallback);

			expect(jsonLib.checkJSON).toHaveBeenCalledWith(filename, fallbackJSON);
			expect(paths.ensureFile).toHaveBeenCalledWith(filename);
			expect(jsonLib.writeJSON).toHaveBeenCalledWith(filename, fallbackJSON);
		});

		it('should write fallback JSON back if file not exists', () => {
			fileExists = false;

			original.getJSON(filename, createCallback, validateCallback);

			expect(jsonLib.checkJSON).toHaveBeenCalledWith(filename, fallbackJSON);
			expect(paths.ensureFile).toHaveBeenCalledWith(filename);
			expect(jsonLib.writeJSON).toHaveBeenCalledWith(filename, fallbackJSON);
		});

		it('should return JSON if file exists and json is valid', () => {
			fileExists = true;
			validation = true;

			const result = original.getJSON(filename, createCallback, validateCallback);

			expect(result).toEqual(json);
		});

		it('should return fallback JSON if file exists but json is not valid', () => {
			fileExists = true;
			validation = false;

			const result = original.getJSON(filename, createCallback, validateCallback);

			expect(result).toEqual(fallbackJSON);
		});

		it('should return fallback JSON if file not exists', () => {
			fileExists = false;

			const result = original.getJSON(filename, createCallback, validateCallback);

			expect(result).toEqual(fallbackJSON);
		});
	});

	describe('getJSONAsync', () => {
		it('should call readJSON if file exists and json is valid', async () => {
			fileExists = true;
			validation = true;

			await original.getJSONAsync(filename, createCallbackAsync, validateCallbackAsync);

			expect(jsonLib.readJSON).toHaveBeenCalledWith(filename);
			expect(createCallbackAsync).not.toHaveBeenCalled();
		});

		it('should call createCallback if file exists but json is not valid', async () => {
			fileExists = true;
			validation = false;

			await original.getJSONAsync(filename, createCallbackAsync, validateCallbackAsync);

			expect(jsonLib.readJSON).toHaveBeenCalledWith(filename);
			expect(createCallbackAsync).toHaveBeenCalledWith();
		});

		it('should call createCallback if file not exists', async () => {
			fileExists = false;

			await original.getJSONAsync(filename, createCallbackAsync, validateCallbackAsync);

			expect(jsonLib.readJSON).not.toHaveBeenCalled();
			expect(createCallbackAsync).toHaveBeenCalledWith();
		});

		it('should not write fallback JSON back if file exists and json is valid', async () => {
			fileExists = true;
			validation = true;

			await original.getJSONAsync(filename, createCallbackAsync, validateCallbackAsync);

			expect(jsonLib.writeJSON).not.toHaveBeenCalled();
		});

		it('should write fallback JSON back if file exists but json is not valid', async () => {
			fileExists = true;
			validation = false;

			await original.getJSONAsync(filename, createCallbackAsync, validateCallbackAsync);

			expect(jsonLib.checkJSON).toHaveBeenCalledWith(filename, fallbackJSON);
			expect(paths.ensureFile).toHaveBeenCalledWith(filename);
			expect(jsonLib.writeJSON).toHaveBeenCalledWith(filename, fallbackJSON);
		});

		it('should write fallback JSON back if file not exists', async () => {
			fileExists = false;

			await original.getJSONAsync(filename, createCallbackAsync, validateCallbackAsync);

			expect(jsonLib.checkJSON).toHaveBeenCalledWith(filename, fallbackJSON);
			expect(paths.ensureFile).toHaveBeenCalledWith(filename);
			expect(jsonLib.writeJSON).toHaveBeenCalledWith(filename, fallbackJSON);
		});

		it('should return JSON if file exists and json is valid', async () => {
			fileExists = true;
			validation = true;

			const result = await original.getJSONAsync(filename, createCallbackAsync, validateCallbackAsync);

			expect(result).toEqual(json);
		});

		it('should return fallback JSON if file exists but json is not valid', async () => {
			fileExists = true;
			validation = false;

			const result = await original.getJSONAsync(filename, createCallbackAsync, validateCallbackAsync);

			expect(result).toEqual(fallbackJSON);
		});

		it('should return fallback JSON if file not exists', async () => {
			fileExists = false;

			const result = await original.getJSONAsync(filename, createCallbackAsync, validateCallbackAsync);

			expect(result).toEqual(fallbackJSON);
		});
	});

	describe('checkJSON', () => {
		it('should do nothing if json is truthy', () => {
			original.checkJSON(filename, json);

			expect(logger.error).not.toBeCalled();
		});
		it('should output error if json is falsy', () => {
			expect(() => original.checkJSON(filename, '')).toThrowError(`File ${filename} doesn't exist and should be created with initial data, but function createCallback returned nothing`);
		});
	});
});
