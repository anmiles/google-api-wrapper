import path from 'path';

export { getProfilesFile, getScopesFile, getSecretsFile, getCredentialsFile };
export default { getProfilesFile, getScopesFile, getSecretsFile, getCredentialsFile };

const dirPaths = {
	input   : 'input',
	secrets : 'secrets',
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
