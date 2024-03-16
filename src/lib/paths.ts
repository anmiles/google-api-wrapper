import path from 'path';
import type { templates } from './renderer';

const dirPaths = {
	input     : 'input',
	secrets   : 'secrets',
	// TODO: Remove this hack after moving to React
	templates : 'node_modules/@anmiles/google-api-wrapper/dist/templates',
};

function getProfilesFile(): string {
	return path.join(dirPaths.input, 'profiles.json');
}

function getScopesFile(): string {
	return 'scopes.json';
}

function getSecretsFile(profile: string): string {
	return path.join(dirPaths.secrets, `${profile}.json`);
}

function getCredentialsFile(profile: string): string {
	return path.join(dirPaths.secrets, `${profile}.credentials.json`);
}

function getTemplateFile(templateName: keyof typeof templates): string {
	return path.join(dirPaths.templates, `${templateName}.html`);
}

export { getProfilesFile, getScopesFile, getSecretsFile, getCredentialsFile, getTemplateFile };
export default { getProfilesFile, getScopesFile, getSecretsFile, getCredentialsFile, getTemplateFile };
