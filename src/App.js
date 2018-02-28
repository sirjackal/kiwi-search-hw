import React from 'react';
import * as SearchModel from './models/Search';
import KiwiLogo from './img/kiwi-logo.svg';
import Autosuggest from 'react-autosuggest';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import './css/autosuggest.css';

const RESULTS_PER_PAGE = 5;
const AUTOCOMPLETE_SUGGESTIONS_LIMIT = 10;

const PaginationDir = {
	PREV: -1,
	NEXT: 1
};

export default class Search extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			searchParams: {
				locationFrom: '',
				locationTo: '',
				date: moment()
			},
			isSearched: false,
			isLoading: false,
			results: [],
			pagination: {
				hasNextPage: false,
				hasPreviousPage: false,
				startCursor: null,
				endCursor: null
			},
			errors: [],
			validationMessages: {}
		};

		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleDateChange = this.handleDateChange.bind(this);
		this.handleFormSubmit = this.handleFormSubmit.bind(this);
		this.handlePrevPage = this.handlePrevPage.bind(this);
		this.handleNextPage = this.handleNextPage.bind(this);
	}

	render() {
		return (
			<div className="search">
				<SearchForm onSubmit={this.handleFormSubmit} onInputChange={this.handleInputChange}
					onDateChange={this.handleDateChange} values={this.state.searchParams} validationMessages={this.state.validationMessages} />

				{this.state.errors.map((message, i) => <ErrorMessage message={message} key={i} />)}

				<SearchResults results={this.state.results} pagination={this.state.pagination} isLoading={this.state.isLoading}
					isSearched={this.state.isSearched} />

				<Pagination params={this.state.pagination} isLoading={this.state.isLoading} onPrevPage={this.handlePrevPage}
					onNextPage={this.handleNextPage} />
			</div>
		);
	}

	handleInputChange = (inputName, event, { newValue }) => {
		const state = {
			searchParams: Object.assign({}, this.state.searchParams, {[inputName]: newValue})
		}

		this.setState(state);
	}

	handleDateChange(date) {
		const state = {
			searchParams: Object.assign({}, this.state.searchParams, {date: date})
		}

		this.setState(state);
	}

	/** 
	 * As simple form validation as possible.
	 * Maybe it would be better to have this func inside SearchForm component, but we are
	 * handling form submit event here.
	 * 
	 * @returns {boolean}
	 */
	validateForm() {
		let validationMessages = {};

		const requiredFields = [
			'locationFrom',
			'locationTo'
		];

		let isValid = true;

		for (let fld of requiredFields) {
			const value = this.state.searchParams[fld];

			if (value === null || value.trim() === '') {
				validationMessages[fld] = ['Please fill in this field first.'];
				isValid = false;
			}
		}

		this.setState({validationMessages: validationMessages});
		return isValid;
	}

	handleFormSubmit(event) {
		event.preventDefault();

		if (!this.validateForm()) {
			return;
		}

		this.setState({
			isLoading: true,
			isSearched: true
		});

		let flights = SearchModel.searchFlights(this.state.searchParams, RESULTS_PER_PAGE);
		this.showResults(flights);
	}

	handlePrevPage(event) {
		event.preventDefault();
		this.setState({isLoading: true});

		let flights = SearchModel.searchFlights(this.state.searchParams, null, null,
			RESULTS_PER_PAGE, this.state.pagination.startCursor);

		this.showResults(flights, PaginationDir.PREV);
	}

	handleNextPage(event) {
		event.preventDefault();
		this.setState({isLoading: true});

		let flights = SearchModel.searchFlights(this.state.searchParams, RESULTS_PER_PAGE,
			this.state.pagination.endCursor, null, null);

		this.showResults(flights, PaginationDir.NEXT);
	}

	showResults(flights, lastPaginationDir) {
		flights.then(response => {
			let results = [], errors = [], pagination = {};

			if (response.data instanceof Object && response.data.allFlights instanceof Object) {
				if (Array.isArray(response.data.allFlights.edges)) {
					results = response.data.allFlights.edges;
				}

				const pageInfo = response.data.allFlights.pageInfo;

				// pageInfo.hasNextPage is always false when paginating backwards,
				// pageInfo.hasPreviousPage is always false when paginating forwards
				pagination = {
					hasNextPage: lastPaginationDir && lastPaginationDir === PaginationDir.PREV ? true : pageInfo.hasNextPage,
					hasPreviousPage: lastPaginationDir && lastPaginationDir === PaginationDir.NEXT ? true : pageInfo.hasPreviousPage,
					startCursor: pageInfo.startCursor,
					endCursor: pageInfo.endCursor
				};
			}
			
			if (Array.isArray(response.errors)) {
				 errors = response.errors.map(error => error.message);
			}

			this.setState({
				results: results,
				errors: errors,
				pagination: pagination
			});
		})
		.catch(err =>
			this.handleError(err)
		)
		.finally(() =>
			this.setState({isLoading: false})
		);
	}

	handleError(err) {
		this.setState({
			results: [],
			errors: [err instanceof Error ? err.message : err],
			isLoading: false
		});
	}
}

class SearchForm extends React.Component {
	renderValidationMessages(inputName) {
		const messages = Array.isArray(this.props.validationMessages[inputName]) ? this.props.validationMessages[inputName] : [];

		if (messages.length === 0) {
			return '';
		}
			
		return (
			<ul className="form-errors">
				{messages.map((msg, i) => <li key={i}>{msg}</li>)}
			</ul>
		);
	}

	render() {
		return (
			<div>
				<form onSubmit={this.props.onSubmit} className="search-form">
					{/* In the autocomplete onChange method I cannot tell the input name from event.target if the event
						comes from the suggestion mouse click, so I have to forward input's name as parameter as well. */}

					<div className="form-elem">
						<label htmlFor="locationFrom">From:</label>
						<Autocomplete name="locationFrom" value={this.props.values.locationFrom} id="locationFrom"
							onChange={(event, { newValue, method }) => this.props.onInputChange("locationFrom", event, { newValue, method })} />
						{this.renderValidationMessages("locationFrom")}
					</div>

					<div className="form-elem">
						<label htmlFor="locationTo">To:</label>
						<Autocomplete name="locationTo" value={this.props.values.locationTo} id="locationTo"
							onChange={(event, { newValue, method }) => this.props.onInputChange("locationTo", event, { newValue, method })} />
						{this.renderValidationMessages("locationTo")}
					</div>

					<div className="form-elem">
						<label htmlFor="date">Date:</label>
						<DatePicker minDate={moment()} dateFormat="ddd DD MMM" selected={this.props.values.date} onChange={this.props.onDateChange}
							name="date" id="date" readOnly={true} />
					</div>

					<div className="form-elem">
						<input type="submit" value="Search" />
					</div>
				</form>
				<div className="cb"></div>
			</div>
		);
	}
}

class SearchResults extends React.Component {
	render() {
		const results = this.props.results;
		let content = null;

		if (results.length) {
			content = results.map(item => <FlightConnection flight={item.node} key={item.node.id} />);
		} else if (this.props.isSearched && !this.props.isLoading) {
			content = <span>No flights found.</span>;
		}

		return (
			<div className="search-results">
				<div className="flights">
					{content}
				</div>
				{this.props.isLoading && <div className="loader"></div>}
			</div>
		);
	}
}

class FlightConnection extends React.Component {
	render() {
		const flight = this.props.flight;

		const departureTime = moment(flight.departure.localTime);
		const arrivalTime = moment(flight.arrival.localTime);
		const durationHours = Math.floor(flight.duration / 60);
		const durationMinutes = flight.duration % 60;

		return (
			<div className="flight row">
				<div className="col col-date">
					{departureTime.format("HH:mm")} - {arrivalTime.format("HH:mm")}<br />
					{departureTime.format("ddd DD MMM")}
				</div>

				<div className="col col-airports">
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

				<div className="col col-airlines">
					{flight.airlines.map(airline => airline.name).join(', ')}
				</div>

				<div className="col col-price">
					{flight.price.amount} {flight.price.currency}
				</div>

				<div className="col col-link">
					<a href={flight.bookingUrl} title="Book flight at Kiwi.com">
						<img src={KiwiLogo} alt="Book flight" className="logo" />
					</a>
				</div>

				<div className="cb"></div>
			</div>
		);
	}
}

class Pagination extends React.Component {
	render() {
		let prevButton = null, nextButton = null;

		if (this.props.params.hasPreviousPage) {
			prevButton = <button className="prev" onClick={this.props.onPrevPage} disabled={this.props.isLoading}>
				&laquo; Prev
			</button>;
		}

		if (this.props.params.hasNextPage) {
			nextButton = <button className="next" onClick={this.props.onNextPage} disabled={this.props.isLoading}>
				Next &raquo;
			</button>;
		}

		return (
			<div className="pagination">
				{prevButton}
				{nextButton}
			</div>
		);
	}
}

function ErrorMessage(props) {
	return (
		<div className="message message-error">{props.message}</div>
	);
}

class Autocomplete extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			suggestions: []
		};

		this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
		this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
	}

	/**
	 * @param {string} value 
	 * @returns {Promise}
	 */
	getSuggestions(value) {
		const inputValue = value.trim();
		const inputLength = inputValue.length;

		if (inputLength === 0) {
			return Promise.resolve([]);
		}

		return SearchModel.searchLocations(inputValue, AUTOCOMPLETE_SUGGESTIONS_LIMIT)
			.then(response => {
				let nodes = [];

				if (response.data instanceof Object) {
					nodes = response.data.allLocations.edges.map(loc => loc.node);
				}

				return nodes;
			});
	};

	onSuggestionsFetchRequested = ({ value }) => {
		this.getSuggestions(value).then(suggestions => {
			this.setState({suggestions: suggestions});
		})
		.catch(err => {
			this.clearSuggestions();
			//console.error(err);
		});
	};

	renderSuggestion(suggestion) {
		let extras = null;
		if (suggestion.type === 'airport') {
			extras = ' (' + suggestion.locationId + ')';
		} else if (suggestion.type === 'city' && suggestion.country != null) {
			extras = ' (' + suggestion.country.name + ')';
		}

		return (
			<span>
				{suggestion.name}
				{extras && <span className="extras">{extras}</span>}
			</span>
		);
	}

	clearSuggestions() {
		this.setState({
			suggestions: []
		});
	}

	onSuggestionsClearRequested = () => this.clearSuggestions();

	onSuggestionSelected = (event, { method }) => {
		if (method === 'enter') {
			event.preventDefault();  // preventing form submit
		}
	};

	getSuggestionValue = suggestion => suggestion.name;

	render() {
		const { suggestions } = this.state;

		return (
			<Autosuggest
				suggestions={suggestions}
				onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
				onSuggestionsClearRequested={this.onSuggestionsClearRequested}
				onSuggestionSelected={this.onSuggestionSelected}
				getSuggestionValue={this.getSuggestionValue}
				renderSuggestion={this.renderSuggestion}
				inputProps={this.props}
		  	/>
		);
	}
}
