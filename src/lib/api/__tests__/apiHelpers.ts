const getAPI = <T>(items: Array<Array<T> | null>, pageTokens: Array<string | undefined>) => ({
	list : jest.fn().mockImplementation(async ({ pageToken }: {pageToken?: string}) => {
		const index = pageTokens.indexOf(pageToken);

		return {
			data : {
				items         : items[index],
				nextPageToken : pageTokens[index + 1],
				pageInfo      : !items[index] ? null : {
					totalResults : items.reduce((sum, list) => sum + (list?.length || 0), 0),
				},
			},
		};
	}),
	update : jest.fn(),
});

export default { getAPI };
