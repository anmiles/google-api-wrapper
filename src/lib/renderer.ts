import fs from 'fs';

import { getTemplateFile } from './utils/paths';

export const templates = {
	index : [ 'style', 'page', 'script' ] as const,
	page  : [ 'content' ] as const,
	style : [ ] as const,
	script: [ ] as const,
	auth  : [ 'profile', 'authUrl', 'scopesList' ] as const,
	scope : [ 'type', 'title', 'name' ] as const,
	done  : [ 'profile' ] as const,
} as const;

type TemplateName = keyof typeof templates;

const allHTML = {} as Record<TemplateName, string>;	// eslint-disable-line @typescript-eslint/no-unsafe-type-assertion

export function renderAuth({ profile, authUrl, scope }: { profile: string; authUrl: string; scope: string[] }): string {
	const scopesList = scope.map((s) => render('scope', {
		name : s.split('/').pop()!,
		title: s.endsWith('.readonly') ? 'Readonly (cannot change or delete your data)' : 'Writable (can change or delete your data)',
		type : s.endsWith('.readonly') ? 'readonly' : '',
	})).join('\n');

	const style   = render('style', {});
	const script  = render('script', {});
	const content = render('auth', { profile, authUrl, scopesList });
	const page    = render('page', { content });
	return render('index', { style, page, script });
}

export function renderDone({ profile }: { profile: string }): string {
	const style   = render('style', {});
	const script  = render('script', {});
	const content = render('done', { profile });
	const page    = render('page', { content });
	return render('index', { style, page, script });
}

// TODO: Use react
function render<T extends TemplateName>(templateName: T, values: Record<typeof templates[T][number], string | undefined>): string {
	let html        = getTemplate(templateName);
	const allValues = values as Record<typeof templates[TemplateName][number], string | undefined>;

	for (const variable of templates[templateName]) {
		const value = allValues[variable];

		if (typeof value === 'undefined') {
			throw new Error(`Missing required value '${variable}' while rendering template '${templateName}'`);
		}

		html = html.replaceAll(`\${${variable}}`, value);
	}

	return html;
}

function getTemplate(templateName: TemplateName): string {
	if (!(templateName in allHTML)) {
		const file            = getTemplateFile(templateName);
		const template        = fs.readFileSync(file).toString().trim();
		allHTML[templateName] = template;
	}

	return allHTML[templateName];
}
