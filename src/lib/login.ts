import { info, warn } from '@anmiles/logger';

import type { AuthOptions, CommonOptions } from '../types/options';

import { getAuth } from './auth';
import { getProfiles } from './profiles';

export async function login(profile?: string, options?: AuthOptions & CommonOptions): Promise<void> {
	const profiles = getProfiles().filter((p) => !profile || p === profile);

	for (const profile of profiles) {
		if (!options?.hideProgress) {
			warn(`${profile} - logging in...`);
		}

		await getAuth(profile, options);

		if (!options?.hideProgress) {
			info(`${profile} - logged in successfully`);
		}
	}
}
