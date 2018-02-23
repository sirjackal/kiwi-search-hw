import React from 'react';
import SearchModel from './models/Search';
import * as Localization from './models/Localization';
import KiwiLogo from './img/kiwi-logo.svg';

const RESULTS_PER_PAGE = 5;

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.searchModel = new SearchModel();
	}

	render() {
		return (
			<Search searchModel={this.searchModel} />
		);
	}
}

class Search extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			searchParams: {
				locationFrom: 'Brno',
				locationTo: 'London',
				date: '2018-04-01'
			},
			page: 1,
			results: [],
			errors: []
		};

		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleFormSubmit = this.handleFormSubmit.bind(this);
	}

	render() {
		return (
			<div className="search">
				<SearchForm onSubmit={this.handleFormSubmit} onChange={this.handleInputChange} values={this.state.searchParams} />
				{this.state.errors.map((message, i) => <ErrorMessage message={message} key={i} />)}
				<SearchResults results={this.state.results} />
			</div>
		);
	}

	handleInputChange(event) {
		const target = event.target;
		const state = {
			searchParams: Object.assign({}, this.state.searchParams, {[target.name]: target.value})
		}

		this.setState(state);
	  }

	handleFormSubmit(event) {
		event.preventDefault();

		try {
			let flights = this.props.searchModel.searchFlights(this.state.searchParams, this.state.page, RESULTS_PER_PAGE);
		
			flights.then(response => {
				let results = [], errors = [];

				if (response.data.allFlights != null && Array.isArray(response.data.allFlights.edges)) {
					results = response.data.allFlights.edges;
				}
				
				if (Array.isArray(response.errors)) {
					errors = response.errors.map(error => error.message);
				}

				this.setState({
					results: results,
					errors: errors
				});
			});
		} catch (err) {
			this.handleError(err);
		}
	}

	handleError(err) {
		this.setState({
			results: [],
			errors: [err instanceof Error ? err.message : err]
		});
	}
}

class SearchForm extends React.Component {
	render() {
		return (
			<div>
				<form onSubmit={this.props.onSubmit} className="search-form">
					<label htmlFor="locationFrom">From:</label>
					<input type="text" name="locationFrom" value={this.props.values.locationFrom} id="locationFrom" onChange={this.props.onChange} />

					<label htmlFor="locationTo">To:</label>
					<input type="text" name="locationTo" value={this.props.values.locationTo} id="locationTo" onChange={this.props.onChange} />

					<label htmlFor="date">Date:</label>
					<input type="text" name="date" value={this.props.values.date} id="date" onChange={this.props.onChange} />

					<input type="submit" value="Search" />
				</form>
			</div>
		);
	}
}

class SearchResults extends React.Component {
	render() {
		const results = this.props.results;

		return (
			<div className="search-results">
				{results.map(item => <FlightConnection flight={item.node} key={item.node.id} />)}
				{/* TODO: pagination */}
			</div>
		);
	}
}

class FlightConnection extends React.Component {
	render() {
		const flight = this.props.flight;

		const departureTime = new Date(flight.departure.localTime);
		const arrivalTime = new Date(flight.arrival.localTime);
		const durationHours = Math.floor(flight.duration / 60);
		const durationMinutes = flight.duration % 60;

		return (
			<div className="flight">
				<div className="flight-info l">
					<div className="col col-date l">
						{departureTime.getHours()}:{departureTime.getMinutes().toString().padStart(2, '0')}&nbsp;-&nbsp;
						{arrivalTime.getHours()}:{arrivalTime.getMinutes().toString().padStart(2, '0')}<br />
						{Localization.getWeekdayNameShort(departureTime)} {Localization.getMonthNameShort(departureTime)} {departureTime.getDate()}<br />
					</div>

					<div className="col col-airports l">
						{durationHours}h {durationMinutes}min<br />
					
						<span title={flight.departure.airport.name}>
							{flight.departure.airport.city.name}
							&nbsp;({flight.departure.airport.locationId})
						</span>
						
						{' '}&rarr;{' '}

						<span title={flight.arrival.airport.name}>
							{flight.arrival.airport.city.name}
							&nbsp;({flight.arrival.airport.locationId})
						</span><br />
					</div>

					<div className="col col-airlines l">
						{flight.airlines.map(airline => airline.name).join(', ')}
					</div>

					<div className="col col-price l">
						{flight.price.amount} {flight.price.currency}
					</div>					
				</div>
				
				<div className="flight-link l">
					<a href={flight.bookingUrl} title="Book flight at Kiwi.com">
						<img src={KiwiLogo} alt="Book flight" className="logo" />
					</a>
				</div>

				<div className="cb"></div>
			</div>
		);
	}
}

function ErrorMessage(props) {
	return (
		<div className="message message-error">{props.message}</div>
	);
}
