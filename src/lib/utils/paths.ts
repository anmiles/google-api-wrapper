import path from 'path';

import type { templates } from '../renderer';

const dirPaths = {
	input    : 'input',
	secrets  : 'secrets',
	// TODO: Remove this hack after moving to React
	templates: path.relative(process.cwd(), path.join(__dirname, '../../templates')),
};

export function getProfilesFile(): string {
	return path.join(dirPaths.input, 'profiles.json');
}

export function getScopesFile(): string {
	return 'scopes.json';
}

export function getSecretsFile(profile: string): string {
	return path.join(dirPaths.secrets, `${profile}.json`);
}

export function getCredentialsFile(profile: string): string {
	return path.join(dirPaths.secrets, `${profile}.credentials.json`);
}

export function getTemplateFile(templateName: keyof typeof templates): string {
	return path.join(dirPaths.templates, `${templateName}.html`);
}
