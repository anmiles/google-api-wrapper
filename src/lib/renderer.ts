import fs from 'fs';
import renderer from './renderer';
import { getTemplateFile } from './paths';

export { templates, renderAuth, renderDone };

const templates = {
	page  : [ 'content' ] as const,
	auth  : [ 'profile', 'authUrl', 'scopesList' ],
	scope : [ 'type', 'title', 'name' ] as const,
	done  : [ 'profile' ] as const,
} as const;

type TemplateName = keyof typeof templates;

const allHTML = {} as Record<TemplateName, string>;

function renderAuth({ profile, authUrl, scope }: { profile: string, authUrl: string, scope: string[] }) {
	const scopesList = scope.map((s) => render('scope', {
		name  : s.split('/').pop() as string,
		title : s.endsWith('.readonly') ? 'Readonly (cannot change or delete your data)' : 'Writable (can change or delete your data)',
		type  : s.endsWith('.readonly') ? 'readonly' : '',
	})).join('\n');

	const content = render('auth', { profile, authUrl, scopesList });
	return render('page', { content });
}

function renderDone({ profile }: { profile: string }): string {
	const content = render('done', { profile });
	return render('page', { content });
}

// TODO: Use react
function render<T extends TemplateName>(templateName: T, values: Record<typeof templates[T][number], string>): string {
	let html        = renderer.getTemplate(templateName);
	const allValues = values as Record<typeof templates[TemplateName][number], string>;

	for (const variable of templates[templateName]) {
		const value = allValues[variable] || '';
		html        = html.replace(`\${${variable}}`, value);
	}

	return html;
}

function getTemplate(templateName: TemplateName) {
	if (!(templateName in allHTML)) {
		const file            = getTemplateFile(templateName);
		const template        = fs.readFileSync(file).toString();
		allHTML[templateName] = template;
	}

	return allHTML[templateName];
}

export default { templates, render, getTemplate, renderAuth, renderDone };
