const API_URL = 'https://graphql.kiwi.com/';

export default class SearchModel {
	searchFlights(params, first, after, last, before) {
		const query = `
			query searchFlights($locationFrom: String, $locationTo: String, $date: Date,
				$first: Int, $after: String, $last: Int, $before: String) {
				allFlights(search: {
					from: {location: $locationFrom},
					to: {location: $locationTo},
					date: {exact: $date}
				}, first: $first, after: $after, last: $last, before: $before) {
				pageInfo {
					hasNextPage,
					hasPreviousPage,
					startCursor,
					endCursor
				}
				edges {
					node {
						id,
						departure {
							airport {
								locationId
								name
								city {
									name
								}
							},
							localTime
						},
						arrival {
							airport {
								locationId,
								name
								city {
									name
								}
							},
							localTime
						},
						duration,
						price {
							amount
							currency
						},
						airlines {
							name
						},
						bookingUrl
					}
				}
			}
		}`;

		let flightData = this.fetchData(query, {
			locationFrom: params.locationFrom,
			locationTo: params.locationTo,
			date: params.date.format("YYYY-MM-DD"),
			first: first,
			after: after,
			last: last,
			before: before
		});

		//flightData.then(response => console.log(response));
		return flightData;
	}

	fetchData(query, variables) {
		return fetch(API_URL, {
			method: 'post',
			body: JSON.stringify({
				query: query,
				variables: variables || {}
			}),
			headers: {
				'content-type': 'application/json'
			},
		})
		.then(response => response.json());
	}

	searchLocations(term, limit) {
		const query = `
			query searchLocations($search: String, $first: Int) {
				allLocations(search: $search, first: $first) {
					edges {
						node {
							locationId
							name
							type
							country {
								name
							}
						}
					}
				}
			}`;

		let locationsData = this.fetchData(query, {
			search: term,
			first: limit
		});

		//locationsData.then(response => console.log(response));
		return locationsData;
	}
}
