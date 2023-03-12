import fs from 'fs';
import path from 'path';
import paths from './paths';

export { ensureDir, ensureFile, getProfilesFile, getSecretsFile, getCredentialsFile };
export default { ensureDir, ensureFile, getProfilesFile, getSecretsFile, getCredentialsFile };

const dirPaths = {
	input   : 'input',
	secrets : 'secrets',
};

function ensureDir(dirPath: string) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive : true });
	}
	return dirPath;
}

function ensureFile(filePath: string) {
	paths.ensureDir(path.dirname(filePath));

	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, '');
	}
	return filePath;
}

function getProfilesFile() {
	return path.join(dirPaths.input, 'profiles.json');
}

function getSecretsFile(profile: string) {
	return path.join(dirPaths.secrets, `${profile}.json`);
}

function getCredentialsFile(profile: string) {
	return path.join(dirPaths.secrets, `${profile}.credentials.json`);
}
