import fs from 'fs';
import path from 'path';
import paths from '../paths';
import renderer from '../renderer';

const original = jest.requireActual('../renderer').default as typeof renderer;

type TemplateName = keyof typeof original.templates;
type GetFileName<T extends TemplateName> = `${T}.html`;

type FileName = GetFileName<TemplateName>;
type GetTemplateName<F> = F extends `${infer T}.html` ? T : never;

function getFileName<T extends TemplateName>(templateName: T):  GetFileName<T> {
	return `${templateName}.html`;
}

function getTemplateName<F extends FileName>(file: F):  GetTemplateName<F> {
	return file.replace('.html', '') as GetTemplateName<F>;
}

jest.mock<Partial<typeof renderer>>('../renderer', () => ({
	getTemplate : jest.fn().mockImplementation((templateName: TemplateName) => mockTemplates[templateName]),
}));

jest.mock<Partial<typeof fs>>('fs', () => ({
	readFileSync : jest.fn().mockImplementation((file: FileName) => mockTemplates[getTemplateName(file)] || ''),
}));

jest.mock<Partial<typeof path>>('path', () => ({
	join : jest.fn().mockImplementation((...args) => args.join('/')),
}));

jest.mock<Partial<typeof paths>>('../paths', () => ({
	getTemplateFile : jest.fn().mockImplementation((templateName) => getFileName(templateName)),
}));

const mockTemplates: Record<TemplateName, string> = {
	page  : 'page css = (${css}) content = (${content})',
	css   : 'css',
	auth  : 'auth profile = (${profile}) authUrl = (${authUrl}) scopesList = (${scopesList})',
	scope : 'scope type = (${type}) title = (${title}) name = (${name})',
	done  : 'done profile = (${profile})',
};

const authUrl = 'https://authUrl';
const profile = 'username';
const scope   = [ 'namespace/scope1.readonly', 'namespace/scope2' ];

describe('src/lib/renderer', () => {
	describe('renderAuth', () => {
		it('should return auth page', () => {
			const result = original.renderAuth({ authUrl, profile, scope });
			expect(result).toEqual('page css = (css) content = (auth profile = (username) authUrl = (https://authUrl) scopesList = (scope type = (readonly) title = (Readonly (cannot change or delete your data)) name = (scope1.readonly)\nscope type = () title = (Writable (can change or delete your data)) name = (scope2)))');
		});
	});

	describe('renderDone', () => {
		it('should return done page', () => {
			const result = original.renderDone({ profile });
			expect(result).toEqual('page css = (css) content = (done profile = (username))');
		});
	});

	describe('render', () => {
		it('should replace all template variables with their values', () => {
			const values = { type : 'readonly', title : 'Readonly scope', name : 'scope.readonly' };

			const result = original.render('scope', values);

			expect(result).toEqual('scope type = (readonly) title = (Readonly scope) name = (scope.readonly)');
		});

		it('should replace non-existing template variable with empty string', () => {
			const values = { name : 'scope.readonly' };

			const result = original.render('scope', values as any);

			expect(result).toEqual('scope type = () title = () name = (scope.readonly)');
		});
	});

	describe('getTemplate', () => {
		for (const templateName in original.templates) {
			it(`should return contents of '${templateName}' template file`, () => {
				const template = original.getTemplate(templateName as TemplateName);
				expect(fs.readFileSync).toHaveBeenCalledTimes(1);
				expect(fs.readFileSync).toHaveBeenCalledWith(`${templateName}.html`);
				expect(template).toEqual(mockTemplates[templateName as TemplateName]);
			});
		}

		it('should cache templates', () => {
			original.getTemplate('template1' as TemplateName);

			original.getTemplate('template2' as TemplateName);
			original.getTemplate('template2' as TemplateName);
			original.getTemplate('template2' as TemplateName);

			original.getTemplate('template3' as TemplateName);

			expect(fs.readFileSync).toHaveBeenCalledWith('template1.html');
			expect(fs.readFileSync).toHaveBeenCalledWith('template2.html');
			expect(fs.readFileSync).toHaveBeenCalledWith('template3.html');

			expect(fs.readFileSync).toHaveBeenCalledTimes(3);
		});
	});
});
