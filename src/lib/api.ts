import { google } from 'googleapis';
import type GoogleApis from 'googleapis';
import { log } from '@anmiles/logger';
import sleep from '@anmiles/sleep';
import type { AuthOptions, CommonOptions } from '../types';
import { getAuth } from './auth';
import { deleteCredentials } from './secrets';

const requestInterval = 300;

type CommonApi<TItem> = {
	list: {
		(params?: { pageToken: string | undefined }, options?: GoogleApis.Common.MethodOptions): Promise<GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>>>;
		(callback: (err: Error | null, res?: GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>> | null) => void): void;
	}
};

type CommonResponse<TItem> = {
	items?: TItem[],
	pageInfo?: {
		totalResults?: number | null | undefined
	},
	nextPageToken?: string | null | undefined
};

class Api<TApi extends keyof typeof allApis> {
	api: ReturnType<typeof allApis[TApi]>;
	private auth: GoogleApis.Common.OAuth2Client;

	private apiName: TApi;
	private profile: string;
	private authOptions?: AuthOptions;

	constructor(apiName: TApi, profile: string, authOptions?: AuthOptions) {
		this.apiName     = apiName;
		this.profile     = profile;
		this.authOptions = authOptions;
	}

	async init() {
		this.auth = await getAuth(this.profile, this.authOptions);
		this.api  = allApis[this.apiName](this.auth) as ReturnType<typeof allApis[TApi]>;
	}

	async getItems<TItem>(selectAPI: (api: ReturnType<typeof allApis[TApi]>) => CommonApi<TItem>, params: any, options?: CommonOptions): Promise<TItem[]> {
		const items: TItem[] = [];

		let pageToken: string | null | undefined = undefined;

		do {
			let response: GoogleApis.Common.GaxiosResponse<CommonResponse<TItem>>;

			try {
				response = await selectAPI(this.api).list({ ...params, pageToken });
			} catch (ex) {
				if (ex.message === 'invalid_grant') {
					deleteCredentials(this.profile);
					await this.init();
					return this.getItems(selectAPI, params, options);
				} else {
					throw ex;
				}
			}

			response.data.items?.forEach((item) => items.push(item));

			if (!options?.hideProgress) {
				log(`Getting items (${items.length} of ${response.data.pageInfo?.totalResults || 'many'})...`);
			}

			await sleep(requestInterval);
			pageToken = response.data.nextPageToken;
		} while (pageToken);

		return items;
	}

	async revoke() {
		deleteCredentials(this.profile);
		return this.auth.revokeCredentials();
	}
}

async function getApi<TApi extends keyof typeof allApis>(apiName: TApi, profile: string, authOptions?: AuthOptions): Promise<Api<TApi>> {
	const instance = new Api<TApi>(apiName, profile, authOptions);
	await instance.init();
	return instance;
}

/* istanbul ignore next */
const allApis = {
	abusiveexperiencereport          : (auth: GoogleApis.Common.OAuth2Client) => google.abusiveexperiencereport({ version : 'v1', auth }),
	acceleratedmobilepageurl         : (auth: GoogleApis.Common.OAuth2Client) => google.acceleratedmobilepageurl({ version : 'v1', auth }),
	accessapproval                   : (auth: GoogleApis.Common.OAuth2Client) => google.accessapproval({ version : 'v1', auth }),
	accesscontextmanager             : (auth: GoogleApis.Common.OAuth2Client) => google.accesscontextmanager({ version : 'v1', auth }),
	acmedns                          : (auth: GoogleApis.Common.OAuth2Client) => google.acmedns({ version : 'v1', auth }),
	adexchangebuyer                  : (auth: GoogleApis.Common.OAuth2Client) => google.adexchangebuyer({ version : 'v1.2', auth }),
	adexchangebuyer2                 : (auth: GoogleApis.Common.OAuth2Client) => google.adexchangebuyer2({ version : 'v2beta1', auth }),
	adexperiencereport               : (auth: GoogleApis.Common.OAuth2Client) => google.adexperiencereport({ version : 'v1', auth }),
	admin                            : (auth: GoogleApis.Common.OAuth2Client) => google.admin({ version : 'datatransfer_v1', auth }),
	admob                            : (auth: GoogleApis.Common.OAuth2Client) => google.admob({ version : 'v1', auth }),
	adsense                          : (auth: GoogleApis.Common.OAuth2Client) => google.adsense({ version : 'v1.4', auth }),
	adsensehost                      : (auth: GoogleApis.Common.OAuth2Client) => google.adsensehost({ version : 'v4.1', auth }),
	advisorynotifications            : (auth: GoogleApis.Common.OAuth2Client) => google.advisorynotifications({ version : 'v1', auth }),
	alertcenter                      : (auth: GoogleApis.Common.OAuth2Client) => google.alertcenter({ version : 'v1beta1', auth }),
	analytics                        : (auth: GoogleApis.Common.OAuth2Client) => google.analytics({ version : 'v3', auth }),
	analyticsadmin                   : (auth: GoogleApis.Common.OAuth2Client) => google.analyticsadmin({ version : 'v1alpha', auth }),
	analyticsdata                    : (auth: GoogleApis.Common.OAuth2Client) => google.analyticsdata({ version : 'v1alpha', auth }),
	analyticshub                     : (auth: GoogleApis.Common.OAuth2Client) => google.analyticshub({ version : 'v1', auth }),
	analyticsreporting               : (auth: GoogleApis.Common.OAuth2Client) => google.analyticsreporting({ version : 'v4', auth }),
	androiddeviceprovisioning        : (auth: GoogleApis.Common.OAuth2Client) => google.androiddeviceprovisioning({ version : 'v1', auth }),
	androidenterprise                : (auth: GoogleApis.Common.OAuth2Client) => google.androidenterprise({ version : 'v1', auth }),
	androidmanagement                : (auth: GoogleApis.Common.OAuth2Client) => google.androidmanagement({ version : 'v1', auth }),
	androidpublisher                 : (auth: GoogleApis.Common.OAuth2Client) => google.androidpublisher({ version : 'v1.1', auth }),
	apigateway                       : (auth: GoogleApis.Common.OAuth2Client) => google.apigateway({ version : 'v1', auth }),
	apigeeregistry                   : (auth: GoogleApis.Common.OAuth2Client) => google.apigeeregistry({ version : 'v1', auth }),
	apikeys                          : (auth: GoogleApis.Common.OAuth2Client) => google.apikeys({ version : 'v2', auth }),
	appengine                        : (auth: GoogleApis.Common.OAuth2Client) => google.appengine({ version : 'v1', auth }),
	appsactivity                     : (auth: GoogleApis.Common.OAuth2Client) => google.appsactivity({ version : 'v1', auth }),
	area120tables                    : (auth: GoogleApis.Common.OAuth2Client) => google.area120tables({ version : 'v1alpha1', auth }),
	artifactregistry                 : (auth: GoogleApis.Common.OAuth2Client) => google.artifactregistry({ version : 'v1', auth }),
	assuredworkloads                 : (auth: GoogleApis.Common.OAuth2Client) => google.assuredworkloads({ version : 'v1', auth }),
	authorizedbuyersmarketplace      : (auth: GoogleApis.Common.OAuth2Client) => google.authorizedbuyersmarketplace({ version : 'v1', auth }),
	baremetalsolution                : (auth: GoogleApis.Common.OAuth2Client) => google.baremetalsolution({ version : 'v1', auth }),
	batch                            : (auth: GoogleApis.Common.OAuth2Client) => google.batch({ version : 'v1', auth }),
	beyondcorp                       : (auth: GoogleApis.Common.OAuth2Client) => google.beyondcorp({ version : 'v1', auth }),
	bigquery                         : (auth: GoogleApis.Common.OAuth2Client) => google.bigquery({ version : 'v2', auth }),
	bigqueryconnection               : (auth: GoogleApis.Common.OAuth2Client) => google.bigqueryconnection({ version : 'v1beta1', auth }),
	bigquerydatatransfer             : (auth: GoogleApis.Common.OAuth2Client) => google.bigquerydatatransfer({ version : 'v1', auth }),
	bigqueryreservation              : (auth: GoogleApis.Common.OAuth2Client) => google.bigqueryreservation({ version : 'v1', auth }),
	bigtableadmin                    : (auth: GoogleApis.Common.OAuth2Client) => google.bigtableadmin({ version : 'v1', auth }),
	billingbudgets                   : (auth: GoogleApis.Common.OAuth2Client) => google.billingbudgets({ version : 'v1', auth }),
	binaryauthorization              : (auth: GoogleApis.Common.OAuth2Client) => google.binaryauthorization({ version : 'v1', auth }),
	blogger                          : (auth: GoogleApis.Common.OAuth2Client) => google.blogger({ version : 'v2', auth }),
	books                            : (auth: GoogleApis.Common.OAuth2Client) => google.books({ version : 'v1', auth }),
	businessprofileperformance       : (auth: GoogleApis.Common.OAuth2Client) => google.businessprofileperformance({ version : 'v1', auth }),
	calendar                         : (auth: GoogleApis.Common.OAuth2Client) => google.calendar({ version : 'v3', auth }),
	certificatemanager               : (auth: GoogleApis.Common.OAuth2Client) => google.certificatemanager({ version : 'v1', auth }),
	chat                             : (auth: GoogleApis.Common.OAuth2Client) => google.chat({ version : 'v1', auth }),
	chromemanagement                 : (auth: GoogleApis.Common.OAuth2Client) => google.chromemanagement({ version : 'v1', auth }),
	chromepolicy                     : (auth: GoogleApis.Common.OAuth2Client) => google.chromepolicy({ version : 'v1', auth }),
	chromeuxreport                   : (auth: GoogleApis.Common.OAuth2Client) => google.chromeuxreport({ version : 'v1', auth }),
	civicinfo                        : (auth: GoogleApis.Common.OAuth2Client) => google.civicinfo({ version : 'v2', auth }),
	classroom                        : (auth: GoogleApis.Common.OAuth2Client) => google.classroom({ version : 'v1', auth }),
	cloudasset                       : (auth: GoogleApis.Common.OAuth2Client) => google.cloudasset({ version : 'v1', auth }),
	cloudbilling                     : (auth: GoogleApis.Common.OAuth2Client) => google.cloudbilling({ version : 'v1', auth }),
	cloudbuild                       : (auth: GoogleApis.Common.OAuth2Client) => google.cloudbuild({ version : 'v1', auth }),
	cloudchannel                     : (auth: GoogleApis.Common.OAuth2Client) => google.cloudchannel({ version : 'v1', auth }),
	clouddebugger                    : (auth: GoogleApis.Common.OAuth2Client) => google.clouddebugger({ version : 'v2', auth }),
	clouddeploy                      : (auth: GoogleApis.Common.OAuth2Client) => google.clouddeploy({ version : 'v1', auth }),
	clouderrorreporting              : (auth: GoogleApis.Common.OAuth2Client) => google.clouderrorreporting({ version : 'v1beta1', auth }),
	cloudfunctions                   : (auth: GoogleApis.Common.OAuth2Client) => google.cloudfunctions({ version : 'v1', auth }),
	cloudidentity                    : (auth: GoogleApis.Common.OAuth2Client) => google.cloudidentity({ version : 'v1', auth }),
	cloudiot                         : (auth: GoogleApis.Common.OAuth2Client) => google.cloudiot({ version : 'v1', auth }),
	cloudkms                         : (auth: GoogleApis.Common.OAuth2Client) => google.cloudkms({ version : 'v1', auth }),
	cloudprofiler                    : (auth: GoogleApis.Common.OAuth2Client) => google.cloudprofiler({ version : 'v2', auth }),
	cloudresourcemanager             : (auth: GoogleApis.Common.OAuth2Client) => google.cloudresourcemanager({ version : 'v1', auth }),
	cloudscheduler                   : (auth: GoogleApis.Common.OAuth2Client) => google.cloudscheduler({ version : 'v1', auth }),
	cloudsearch                      : (auth: GoogleApis.Common.OAuth2Client) => google.cloudsearch({ version : 'v1', auth }),
	cloudshell                       : (auth: GoogleApis.Common.OAuth2Client) => google.cloudshell({ version : 'v1', auth }),
	cloudsupport                     : (auth: GoogleApis.Common.OAuth2Client) => google.cloudsupport({ version : 'v2beta', auth }),
	cloudtasks                       : (auth: GoogleApis.Common.OAuth2Client) => google.cloudtasks({ version : 'v2', auth }),
	cloudtrace                       : (auth: GoogleApis.Common.OAuth2Client) => google.cloudtrace({ version : 'v1', auth }),
	composer                         : (auth: GoogleApis.Common.OAuth2Client) => google.composer({ version : 'v1', auth }),
	compute                          : (auth: GoogleApis.Common.OAuth2Client) => google.compute({ version : 'alpha', auth }),
	connectors                       : (auth: GoogleApis.Common.OAuth2Client) => google.connectors({ version : 'v1', auth }),
	contactcenteraiplatform          : (auth: GoogleApis.Common.OAuth2Client) => google.contactcenteraiplatform({ version : 'v1alpha1', auth }),
	contactcenterinsights            : (auth: GoogleApis.Common.OAuth2Client) => google.contactcenterinsights({ version : 'v1', auth }),
	container                        : (auth: GoogleApis.Common.OAuth2Client) => google.container({ version : 'v1', auth }),
	containeranalysis                : (auth: GoogleApis.Common.OAuth2Client) => google.containeranalysis({ version : 'v1', auth }),
	content                          : (auth: GoogleApis.Common.OAuth2Client) => google.content({ version : 'v2.1', auth }),
	contentwarehouse                 : (auth: GoogleApis.Common.OAuth2Client) => google.contentwarehouse({ version : 'v1', auth }),
	customsearch                     : (auth: GoogleApis.Common.OAuth2Client) => google.customsearch({ version : 'v1', auth }),
	datacatalog                      : (auth: GoogleApis.Common.OAuth2Client) => google.datacatalog({ version : 'v1', auth }),
	dataflow                         : (auth: GoogleApis.Common.OAuth2Client) => google.dataflow({ version : 'v1b3', auth }),
	dataform                         : (auth: GoogleApis.Common.OAuth2Client) => google.dataform({ version : 'v1beta1', auth }),
	datafusion                       : (auth: GoogleApis.Common.OAuth2Client) => google.datafusion({ version : 'v1', auth }),
	datalabeling                     : (auth: GoogleApis.Common.OAuth2Client) => google.datalabeling({ version : 'v1beta1', auth }),
	datalineage                      : (auth: GoogleApis.Common.OAuth2Client) => google.datalineage({ version : 'v1', auth }),
	datamigration                    : (auth: GoogleApis.Common.OAuth2Client) => google.datamigration({ version : 'v1', auth }),
	datapipelines                    : (auth: GoogleApis.Common.OAuth2Client) => google.datapipelines({ version : 'v1', auth }),
	dataplex                         : (auth: GoogleApis.Common.OAuth2Client) => google.dataplex({ version : 'v1', auth }),
	dataproc                         : (auth: GoogleApis.Common.OAuth2Client) => google.dataproc({ version : 'v1', auth }),
	datastore                        : (auth: GoogleApis.Common.OAuth2Client) => google.datastore({ version : 'v1', auth }),
	datastream                       : (auth: GoogleApis.Common.OAuth2Client) => google.datastream({ version : 'v1', auth }),
	deploymentmanager                : (auth: GoogleApis.Common.OAuth2Client) => google.deploymentmanager({ version : 'alpha', auth }),
	dfareporting                     : (auth: GoogleApis.Common.OAuth2Client) => google.dfareporting({ version : 'v3.3', auth }),
	dialogflow                       : (auth: GoogleApis.Common.OAuth2Client) => google.dialogflow({ version : 'v2', auth }),
	digitalassetlinks                : (auth: GoogleApis.Common.OAuth2Client) => google.digitalassetlinks({ version : 'v1', auth }),
	discovery                        : (auth: GoogleApis.Common.OAuth2Client) => google.discovery({ version : 'v1', auth }),
	discoveryengine                  : (auth: GoogleApis.Common.OAuth2Client) => google.discoveryengine({ version : 'v1alpha', auth }),
	displayvideo                     : (auth: GoogleApis.Common.OAuth2Client) => google.displayvideo({ version : 'v1', auth }),
	dlp                              : (auth: GoogleApis.Common.OAuth2Client) => google.dlp({ version : 'v2', auth }),
	dns                              : (auth: GoogleApis.Common.OAuth2Client) => google.dns({ version : 'v1', auth }),
	docs                             : (auth: GoogleApis.Common.OAuth2Client) => google.docs({ version : 'v1', auth }),
	documentai                       : (auth: GoogleApis.Common.OAuth2Client) => google.documentai({ version : 'v1', auth }),
	domains                          : (auth: GoogleApis.Common.OAuth2Client) => google.domains({ version : 'v1', auth }),
	domainsrdap                      : (auth: GoogleApis.Common.OAuth2Client) => google.domainsrdap({ version : 'v1', auth }),
	doubleclickbidmanager            : (auth: GoogleApis.Common.OAuth2Client) => google.doubleclickbidmanager({ version : 'v1.1', auth }),
	doubleclicksearch                : (auth: GoogleApis.Common.OAuth2Client) => google.doubleclicksearch({ version : 'v2', auth }),
	drive                            : (auth: GoogleApis.Common.OAuth2Client) => google.drive({ version : 'v2', auth }),
	driveactivity                    : (auth: GoogleApis.Common.OAuth2Client) => google.driveactivity({ version : 'v2', auth }),
	drivelabels                      : (auth: GoogleApis.Common.OAuth2Client) => google.drivelabels({ version : 'v2', auth }),
	essentialcontacts                : (auth: GoogleApis.Common.OAuth2Client) => google.essentialcontacts({ version : 'v1', auth }),
	eventarc                         : (auth: GoogleApis.Common.OAuth2Client) => google.eventarc({ version : 'v1', auth }),
	factchecktools                   : (auth: GoogleApis.Common.OAuth2Client) => google.factchecktools({ version : 'v1alpha1', auth }),
	fcm                              : (auth: GoogleApis.Common.OAuth2Client) => google.fcm({ version : 'v1', auth }),
	fcmdata                          : (auth: GoogleApis.Common.OAuth2Client) => google.fcmdata({ version : 'v1beta1', auth }),
	file                             : (auth: GoogleApis.Common.OAuth2Client) => google.file({ version : 'v1', auth }),
	firebase                         : (auth: GoogleApis.Common.OAuth2Client) => google.firebase({ version : 'v1beta1', auth }),
	firebaseappcheck                 : (auth: GoogleApis.Common.OAuth2Client) => google.firebaseappcheck({ version : 'v1', auth }),
	firebaseappdistribution          : (auth: GoogleApis.Common.OAuth2Client) => google.firebaseappdistribution({ version : 'v1', auth }),
	firebasedatabase                 : (auth: GoogleApis.Common.OAuth2Client) => google.firebasedatabase({ version : 'v1beta', auth }),
	firebasedynamiclinks             : (auth: GoogleApis.Common.OAuth2Client) => google.firebasedynamiclinks({ version : 'v1', auth }),
	firebasehosting                  : (auth: GoogleApis.Common.OAuth2Client) => google.firebasehosting({ version : 'v1', auth }),
	firebaseml                       : (auth: GoogleApis.Common.OAuth2Client) => google.firebaseml({ version : 'v1', auth }),
	firebaserules                    : (auth: GoogleApis.Common.OAuth2Client) => google.firebaserules({ version : 'v1', auth }),
	firebasestorage                  : (auth: GoogleApis.Common.OAuth2Client) => google.firebasestorage({ version : 'v1beta', auth }),
	firestore                        : (auth: GoogleApis.Common.OAuth2Client) => google.firestore({ version : 'v1', auth }),
	fitness                          : (auth: GoogleApis.Common.OAuth2Client) => google.fitness({ version : 'v1', auth }),
	forms                            : (auth: GoogleApis.Common.OAuth2Client) => google.forms({ version : 'v1', auth }),
	games                            : (auth: GoogleApis.Common.OAuth2Client) => google.games({ version : 'v1', auth }),
	gamesConfiguration               : (auth: GoogleApis.Common.OAuth2Client) => google.gamesConfiguration({ version : 'v1configuration', auth }),
	gameservices                     : (auth: GoogleApis.Common.OAuth2Client) => google.gameservices({ version : 'v1', auth }),
	gamesManagement                  : (auth: GoogleApis.Common.OAuth2Client) => google.gamesManagement({ version : 'v1management', auth }),
	genomics                         : (auth: GoogleApis.Common.OAuth2Client) => google.genomics({ version : 'v1', auth }),
	gkebackup                        : (auth: GoogleApis.Common.OAuth2Client) => google.gkebackup({ version : 'v1', auth }),
	gkehub                           : (auth: GoogleApis.Common.OAuth2Client) => google.gkehub({ version : 'v1', auth }),
	gmail                            : (auth: GoogleApis.Common.OAuth2Client) => google.gmail({ version : 'v1', auth }),
	gmailpostmastertools             : (auth: GoogleApis.Common.OAuth2Client) => google.gmailpostmastertools({ version : 'v1', auth }),
	groupsmigration                  : (auth: GoogleApis.Common.OAuth2Client) => google.groupsmigration({ version : 'v1', auth }),
	groupssettings                   : (auth: GoogleApis.Common.OAuth2Client) => google.groupssettings({ version : 'v1', auth }),
	healthcare                       : (auth: GoogleApis.Common.OAuth2Client) => google.healthcare({ version : 'v1', auth }),
	homegraph                        : (auth: GoogleApis.Common.OAuth2Client) => google.homegraph({ version : 'v1', auth }),
	iam                              : (auth: GoogleApis.Common.OAuth2Client) => google.iam({ version : 'v1', auth }),
	iamcredentials                   : (auth: GoogleApis.Common.OAuth2Client) => google.iamcredentials({ version : 'v1', auth }),
	iap                              : (auth: GoogleApis.Common.OAuth2Client) => google.iap({ version : 'v1', auth }),
	ideahub                          : (auth: GoogleApis.Common.OAuth2Client) => google.ideahub({ version : 'v1alpha', auth }),
	identitytoolkit                  : (auth: GoogleApis.Common.OAuth2Client) => google.identitytoolkit({ version : 'v2', auth }),
	ids                              : (auth: GoogleApis.Common.OAuth2Client) => google.ids({ version : 'v1', auth }),
	indexing                         : (auth: GoogleApis.Common.OAuth2Client) => google.indexing({ version : 'v3', auth }),
	integrations                     : (auth: GoogleApis.Common.OAuth2Client) => google.integrations({ version : 'v1alpha', auth }),
	jobs                             : (auth: GoogleApis.Common.OAuth2Client) => google.jobs({ version : 'v2', auth }),
	kgsearch                         : (auth: GoogleApis.Common.OAuth2Client) => google.kgsearch({ version : 'v1', auth }),
	kmsinventory                     : (auth: GoogleApis.Common.OAuth2Client) => google.kmsinventory({ version : 'v1', auth }),
	language                         : (auth: GoogleApis.Common.OAuth2Client) => google.language({ version : 'v1', auth }),
	libraryagent                     : (auth: GoogleApis.Common.OAuth2Client) => google.libraryagent({ version : 'v1', auth }),
	licensing                        : (auth: GoogleApis.Common.OAuth2Client) => google.licensing({ version : 'v1', auth }),
	lifesciences                     : (auth: GoogleApis.Common.OAuth2Client) => google.lifesciences({ version : 'v2beta', auth }),
	localservices                    : (auth: GoogleApis.Common.OAuth2Client) => google.localservices({ version : 'v1', auth }),
	logging                          : (auth: GoogleApis.Common.OAuth2Client) => google.logging({ version : 'v2', auth }),
	managedidentities                : (auth: GoogleApis.Common.OAuth2Client) => google.managedidentities({ version : 'v1', auth }),
	manufacturers                    : (auth: GoogleApis.Common.OAuth2Client) => google.manufacturers({ version : 'v1', auth }),
	memcache                         : (auth: GoogleApis.Common.OAuth2Client) => google.memcache({ version : 'v1', auth }),
	metastore                        : (auth: GoogleApis.Common.OAuth2Client) => google.metastore({ version : 'v1', auth }),
	migrationcenter                  : (auth: GoogleApis.Common.OAuth2Client) => google.migrationcenter({ version : 'v1alpha1', auth }),
	ml                               : (auth: GoogleApis.Common.OAuth2Client) => google.ml({ version : 'v1', auth }),
	monitoring                       : (auth: GoogleApis.Common.OAuth2Client) => google.monitoring({ version : 'v1', auth }),
	mybusinessaccountmanagement      : (auth: GoogleApis.Common.OAuth2Client) => google.mybusinessaccountmanagement({ version : 'v1', auth }),
	mybusinessbusinesscalls          : (auth: GoogleApis.Common.OAuth2Client) => google.mybusinessbusinesscalls({ version : 'v1', auth }),
	mybusinessbusinessinformation    : (auth: GoogleApis.Common.OAuth2Client) => google.mybusinessbusinessinformation({ version : 'v1', auth }),
	mybusinesslodging                : (auth: GoogleApis.Common.OAuth2Client) => google.mybusinesslodging({ version : 'v1', auth }),
	mybusinessnotifications          : (auth: GoogleApis.Common.OAuth2Client) => google.mybusinessnotifications({ version : 'v1', auth }),
	mybusinessplaceactions           : (auth: GoogleApis.Common.OAuth2Client) => google.mybusinessplaceactions({ version : 'v1', auth }),
	mybusinessqanda                  : (auth: GoogleApis.Common.OAuth2Client) => google.mybusinessqanda({ version : 'v1', auth }),
	mybusinessverifications          : (auth: GoogleApis.Common.OAuth2Client) => google.mybusinessverifications({ version : 'v1', auth }),
	networkconnectivity              : (auth: GoogleApis.Common.OAuth2Client) => google.networkconnectivity({ version : 'v1', auth }),
	networkmanagement                : (auth: GoogleApis.Common.OAuth2Client) => google.networkmanagement({ version : 'v1', auth }),
	networksecurity                  : (auth: GoogleApis.Common.OAuth2Client) => google.networksecurity({ version : 'v1', auth }),
	networkservices                  : (auth: GoogleApis.Common.OAuth2Client) => google.networkservices({ version : 'v1', auth }),
	notebooks                        : (auth: GoogleApis.Common.OAuth2Client) => google.notebooks({ version : 'v1', auth }),
	oauth2                           : (auth: GoogleApis.Common.OAuth2Client) => google.oauth2({ version : 'v2', auth }),
	ondemandscanning                 : (auth: GoogleApis.Common.OAuth2Client) => google.ondemandscanning({ version : 'v1', auth }),
	orgpolicy                        : (auth: GoogleApis.Common.OAuth2Client) => google.orgpolicy({ version : 'v2', auth }),
	osconfig                         : (auth: GoogleApis.Common.OAuth2Client) => google.osconfig({ version : 'v1', auth }),
	oslogin                          : (auth: GoogleApis.Common.OAuth2Client) => google.oslogin({ version : 'v1', auth }),
	pagespeedonline                  : (auth: GoogleApis.Common.OAuth2Client) => google.pagespeedonline({ version : 'v5', auth }),
	paymentsresellersubscription     : (auth: GoogleApis.Common.OAuth2Client) => google.paymentsresellersubscription({ version : 'v1', auth }),
	people                           : (auth: GoogleApis.Common.OAuth2Client) => google.people({ version : 'v1', auth }),
	playablelocations                : (auth: GoogleApis.Common.OAuth2Client) => google.playablelocations({ version : 'v3', auth }),
	playcustomapp                    : (auth: GoogleApis.Common.OAuth2Client) => google.playcustomapp({ version : 'v1', auth }),
	playdeveloperreporting           : (auth: GoogleApis.Common.OAuth2Client) => google.playdeveloperreporting({ version : 'v1alpha1', auth }),
	playintegrity                    : (auth: GoogleApis.Common.OAuth2Client) => google.playintegrity({ version : 'v1', auth }),
	plus                             : (auth: GoogleApis.Common.OAuth2Client) => google.plus({ version : 'v1', auth }),
	policyanalyzer                   : (auth: GoogleApis.Common.OAuth2Client) => google.policyanalyzer({ version : 'v1', auth }),
	policysimulator                  : (auth: GoogleApis.Common.OAuth2Client) => google.policysimulator({ version : 'v1', auth }),
	policytroubleshooter             : (auth: GoogleApis.Common.OAuth2Client) => google.policytroubleshooter({ version : 'v1', auth }),
	poly                             : (auth: GoogleApis.Common.OAuth2Client) => google.poly({ version : 'v1', auth }),
	privateca                        : (auth: GoogleApis.Common.OAuth2Client) => google.privateca({ version : 'v1', auth }),
	// eslint-disable-next-line camelcase
	prod_tt_sasportal                : (auth: GoogleApis.Common.OAuth2Client) => google.prod_tt_sasportal({ version : 'v1alpha1', auth }),
	publicca                         : (auth: GoogleApis.Common.OAuth2Client) => google.publicca({ version : 'v1alpha1', auth }),
	pubsub                           : (auth: GoogleApis.Common.OAuth2Client) => google.pubsub({ version : 'v1', auth }),
	pubsublite                       : (auth: GoogleApis.Common.OAuth2Client) => google.pubsublite({ version : 'v1', auth }),
	readerrevenuesubscriptionlinking : (auth: GoogleApis.Common.OAuth2Client) => google.readerrevenuesubscriptionlinking({ version : 'v1', auth }),
	realtimebidding                  : (auth: GoogleApis.Common.OAuth2Client) => google.realtimebidding({ version : 'v1', auth }),
	recaptchaenterprise              : (auth: GoogleApis.Common.OAuth2Client) => google.recaptchaenterprise({ version : 'v1', auth }),
	recommendationengine             : (auth: GoogleApis.Common.OAuth2Client) => google.recommendationengine({ version : 'v1beta1', auth }),
	recommender                      : (auth: GoogleApis.Common.OAuth2Client) => google.recommender({ version : 'v1', auth }),
	redis                            : (auth: GoogleApis.Common.OAuth2Client) => google.redis({ version : 'v1', auth }),
	remotebuildexecution             : (auth: GoogleApis.Common.OAuth2Client) => google.remotebuildexecution({ version : 'v1', auth }),
	reseller                         : (auth: GoogleApis.Common.OAuth2Client) => google.reseller({ version : 'v1', auth }),
	resourcesettings                 : (auth: GoogleApis.Common.OAuth2Client) => google.resourcesettings({ version : 'v1', auth }),
	retail                           : (auth: GoogleApis.Common.OAuth2Client) => google.retail({ version : 'v2', auth }),
	run                              : (auth: GoogleApis.Common.OAuth2Client) => google.run({ version : 'v1', auth }),
	runtimeconfig                    : (auth: GoogleApis.Common.OAuth2Client) => google.runtimeconfig({ version : 'v1', auth }),
	safebrowsing                     : (auth: GoogleApis.Common.OAuth2Client) => google.safebrowsing({ version : 'v4', auth }),
	sasportal                        : (auth: GoogleApis.Common.OAuth2Client) => google.sasportal({ version : 'v1alpha1', auth }),
	script                           : (auth: GoogleApis.Common.OAuth2Client) => google.script({ version : 'v1', auth }),
	searchads360                     : (auth: GoogleApis.Common.OAuth2Client) => google.searchads360({ version : 'v0', auth }),
	searchconsole                    : (auth: GoogleApis.Common.OAuth2Client) => google.searchconsole({ version : 'v1', auth }),
	secretmanager                    : (auth: GoogleApis.Common.OAuth2Client) => google.secretmanager({ version : 'v1', auth }),
	securitycenter                   : (auth: GoogleApis.Common.OAuth2Client) => google.securitycenter({ version : 'v1', auth }),
	serviceconsumermanagement        : (auth: GoogleApis.Common.OAuth2Client) => google.serviceconsumermanagement({ version : 'v1', auth }),
	servicecontrol                   : (auth: GoogleApis.Common.OAuth2Client) => google.servicecontrol({ version : 'v1', auth }),
	servicedirectory                 : (auth: GoogleApis.Common.OAuth2Client) => google.servicedirectory({ version : 'v1', auth }),
	servicemanagement                : (auth: GoogleApis.Common.OAuth2Client) => google.servicemanagement({ version : 'v1', auth }),
	servicenetworking                : (auth: GoogleApis.Common.OAuth2Client) => google.servicenetworking({ version : 'v1', auth }),
	serviceusage                     : (auth: GoogleApis.Common.OAuth2Client) => google.serviceusage({ version : 'v1', auth }),
	sheets                           : (auth: GoogleApis.Common.OAuth2Client) => google.sheets({ version : 'v4', auth }),
	siteVerification                 : (auth: GoogleApis.Common.OAuth2Client) => google.siteVerification({ version : 'v1', auth }),
	slides                           : (auth: GoogleApis.Common.OAuth2Client) => google.slides({ version : 'v1', auth }),
	smartdevicemanagement            : (auth: GoogleApis.Common.OAuth2Client) => google.smartdevicemanagement({ version : 'v1', auth }),
	sourcerepo                       : (auth: GoogleApis.Common.OAuth2Client) => google.sourcerepo({ version : 'v1', auth }),
	spanner                          : (auth: GoogleApis.Common.OAuth2Client) => google.spanner({ version : 'v1', auth }),
	speech                           : (auth: GoogleApis.Common.OAuth2Client) => google.speech({ version : 'v1', auth }),
	sql                              : (auth: GoogleApis.Common.OAuth2Client) => google.sql({ version : 'v1beta4', auth }),
	sqladmin                         : (auth: GoogleApis.Common.OAuth2Client) => google.sqladmin({ version : 'v1', auth }),
	storage                          : (auth: GoogleApis.Common.OAuth2Client) => google.storage({ version : 'v1', auth }),
	storagetransfer                  : (auth: GoogleApis.Common.OAuth2Client) => google.storagetransfer({ version : 'v1', auth }),
	streetviewpublish                : (auth: GoogleApis.Common.OAuth2Client) => google.streetviewpublish({ version : 'v1', auth }),
	sts                              : (auth: GoogleApis.Common.OAuth2Client) => google.sts({ version : 'v1', auth }),
	tagmanager                       : (auth: GoogleApis.Common.OAuth2Client) => google.tagmanager({ version : 'v1', auth }),
	tasks                            : (auth: GoogleApis.Common.OAuth2Client) => google.tasks({ version : 'v1', auth }),
	testing                          : (auth: GoogleApis.Common.OAuth2Client) => google.testing({ version : 'v1', auth }),
	texttospeech                     : (auth: GoogleApis.Common.OAuth2Client) => google.texttospeech({ version : 'v1', auth }),
	toolresults                      : (auth: GoogleApis.Common.OAuth2Client) => google.toolresults({ version : 'v1beta3', auth }),
	tpu                              : (auth: GoogleApis.Common.OAuth2Client) => google.tpu({ version : 'v1', auth }),
	trafficdirector                  : (auth: GoogleApis.Common.OAuth2Client) => google.trafficdirector({ version : 'v2', auth }),
	transcoder                       : (auth: GoogleApis.Common.OAuth2Client) => google.transcoder({ version : 'v1', auth }),
	translate                        : (auth: GoogleApis.Common.OAuth2Client) => google.translate({ version : 'v2', auth }),
	travelimpactmodel                : (auth: GoogleApis.Common.OAuth2Client) => google.travelimpactmodel({ version : 'v1', auth }),
	vault                            : (auth: GoogleApis.Common.OAuth2Client) => google.vault({ version : 'v1', auth }),
	vectortile                       : (auth: GoogleApis.Common.OAuth2Client) => google.vectortile({ version : 'v1', auth }),
	verifiedaccess                   : (auth: GoogleApis.Common.OAuth2Client) => google.verifiedaccess({ version : 'v1', auth }),
	versionhistory                   : (auth: GoogleApis.Common.OAuth2Client) => google.versionhistory({ version : 'v1', auth }),
	videointelligence                : (auth: GoogleApis.Common.OAuth2Client) => google.videointelligence({ version : 'v1', auth }),
	vision                           : (auth: GoogleApis.Common.OAuth2Client) => google.vision({ version : 'v1', auth }),
	vmmigration                      : (auth: GoogleApis.Common.OAuth2Client) => google.vmmigration({ version : 'v1', auth }),
	vpcaccess                        : (auth: GoogleApis.Common.OAuth2Client) => google.vpcaccess({ version : 'v1', auth }),
	webfonts                         : (auth: GoogleApis.Common.OAuth2Client) => google.webfonts({ version : 'v1', auth }),
	webmasters                       : (auth: GoogleApis.Common.OAuth2Client) => google.webmasters({ version : 'v3', auth }),
	webrisk                          : (auth: GoogleApis.Common.OAuth2Client) => google.webrisk({ version : 'v1', auth }),
	websecurityscanner               : (auth: GoogleApis.Common.OAuth2Client) => google.websecurityscanner({ version : 'v1', auth }),
	workflowexecutions               : (auth: GoogleApis.Common.OAuth2Client) => google.workflowexecutions({ version : 'v1', auth }),
	workflows                        : (auth: GoogleApis.Common.OAuth2Client) => google.workflows({ version : 'v1', auth }),
	workloadmanager                  : (auth: GoogleApis.Common.OAuth2Client) => google.workloadmanager({ version : 'v1', auth }),
	workstations                     : (auth: GoogleApis.Common.OAuth2Client) => google.workstations({ version : 'v1beta', auth }),
	youtube                          : (auth: GoogleApis.Common.OAuth2Client) => google.youtube({ version : 'v3', auth }),
	youtubeAnalytics                 : (auth: GoogleApis.Common.OAuth2Client) => google.youtubeAnalytics({ version : 'v1', auth }),
	youtubereporting                 : (auth: GoogleApis.Common.OAuth2Client) => google.youtubereporting({ version : 'v1', auth }),
} as const;

export { getApi };
export default { getApi, Api };
