import fs from 'fs';

import { getScopesFile } from './utils/paths';

export function getScopes(): string[] {
	const scopesFile = getScopesFile();
	const scopes     = fs.getJSON<string[]>(scopesFile, () => {
		throw new Error(getScopesError(scopesFile));
	});
	return scopes;
}

function getScopesError(scopesFile: string): string {
	return [
		`File ${scopesFile} not found!`,
		`This application had to have pre-defined file ${scopesFile} that will declare needed scopes`,
	].join('\n');
}
