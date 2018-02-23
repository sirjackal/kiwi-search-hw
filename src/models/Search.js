const API_URL = 'https://graphql.kiwi.com/';

export default class SearchModel {
	searchFlights(params, page, perPage) {
		const query = `
			query searchFlights($locationFrom: String, $locationTo: String, $date: Date, $perPage: Int) {
				allFlights(search: {
					from: {location: $locationFrom},
					to: {location: $locationTo},
					date: {exact: $date}
				}, first: $perPage) {
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
					},
					cursor
				}
			}
		}`;

		//const [year, month, day] = params.date.split('-');

		let flightData = this.fetchData(query, {
			locationFrom: params.locationFrom,
			locationTo: params.locationTo,
			date: params.date,
			perPage: perPage
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
}
