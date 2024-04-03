import fs from 'fs';
import renderer from './renderer';
import { getTemplateFile } from './paths';

const templates = {
	index : [ 'page' ] as const,
	page  : [ 'css', 'content' ] as const,
	css   : [ ] as const,
	auth  : [ 'profile', 'authUrl', 'scopesList' ],
	scope : [ 'type', 'title', 'name' ] as const,
	done  : [ 'profile' ] as const,
} as const;

type TemplateName = keyof typeof templates;

const allHTML = {} as Record<TemplateName, string>;

function renderAuth({ profile, authUrl, scope }: { profile : string; authUrl : string; scope : string[] }): string {
	const scopesList = scope.map((s) => render('scope', {
		name  : s.split('/').pop()!,
		title : s.endsWith('.readonly') ? 'Readonly (cannot change or delete your data)' : 'Writable (can change or delete your data)',
		type  : s.endsWith('.readonly') ? 'readonly' : '',
	})).join('\n');

	const css     = render('css', {});
	const content = render('auth', { profile, authUrl, scopesList });
	const page    = render('page', { css, content });
	return render('index', { page });
}

function renderDone({ profile }: { profile : string }): string {
	const css     = render('css', {});
	const content = render('done', { profile });
	const page    = render('page', { css, content });
	return render('index', { page });
}

// TODO: Use react
function render<T extends TemplateName>(templateName: T, values: Record<typeof templates[T][number], string | undefined>): string {
	let html        = renderer.getTemplate(templateName);
	const allValues = values as Record<typeof templates[TemplateName][number], string | undefined>;

	for (const variable of templates[templateName]) {
		const value = allValues[variable] ?? '';
		html        = html.replace(`\${${variable}}`, value);
	}

	return html;
}

function getTemplate(templateName: TemplateName): string {
	if (!(templateName in allHTML)) {
		const file            = getTemplateFile(templateName);
		const template        = fs.readFileSync(file).toString();
		allHTML[templateName] = template;
	}

	return allHTML[templateName];
}

export { templates, renderAuth, renderDone };
export default { templates, render, getTemplate, renderAuth, renderDone };
