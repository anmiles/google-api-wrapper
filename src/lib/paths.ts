import path from 'path';
import type { templates } from './renderer';

export { getProfilesFile, getScopesFile, getSecretsFile, getCredentialsFile, getTemplateFile };
export default { getProfilesFile, getScopesFile, getSecretsFile, getCredentialsFile, getTemplateFile };

const dirPaths = {
	input     : 'input',
	secrets   : 'secrets',
	// TODO: Remove this hack after moving to React
	templates : 'node_modules/@anmiles/google-api-wrapper/dist/templates',
};

function getProfilesFile() {
	return path.join(dirPaths.input, 'profiles.json');
}

function getScopesFile() {
	return 'scopes.json';
}

function getSecretsFile(profile: string) {
	return path.join(dirPaths.secrets, `${profile}.json`);
}

function getCredentialsFile(profile: string) {
	return path.join(dirPaths.secrets, `${profile}.credentials.json`);
}

function getTemplateFile(templateName: keyof typeof templates) {
	return path.join(dirPaths.templates, `${templateName}.html`);
}
