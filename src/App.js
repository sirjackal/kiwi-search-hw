import React from 'react';
import * as SearchModel from './models/Search';
import KiwiLogo from './img/kiwi-logo.svg';
import Autosuggest from 'react-autosuggest';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import 'react-datepicker/dist/react-datepicker.css';
import { Form, FormGroup, Label, Input, Button, FormFeedback, Row, Col, Pagination, PaginationItem,
	PaginationLink, Alert, UncontrolledAlert } from 'reactstrap';

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
				<ErrorBoundary>
					<SearchForm onSubmit={this.handleFormSubmit} onInputChange={this.handleInputChange}
						onDateChange={this.handleDateChange} values={this.state.searchParams} validationMessages={this.state.validationMessages} />

					{this.state.errors.map((message, i) => <ErrorMessage message={message} key={i} />)}

					<SearchResults results={this.state.results} pagination={this.state.pagination} isLoading={this.state.isLoading}
						isSearched={this.state.isSearched} />

					<Paginator params={this.state.pagination} isLoading={this.state.isLoading} onPrevPage={this.handlePrevPage}
						onNextPage={this.handleNextPage} />
				</ErrorBoundary>
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
			
		return messages.map((msg, i) =>
			<FormFeedback key={i}>{msg}</FormFeedback>
		);
	}

	render() {
		return (
			<Form onSubmit={this.props.onSubmit} className="search-form mb-5">
				{/* In the autocomplete onChange method I cannot tell the input name from event.target if the event
					comes from the suggestion mouse click, so I have to forward input's name as parameter as well. */}
				<Row>
					<Col lg="5">
						<FormGroup>
							<Label for="locationFrom">From:</Label>
							<Autocomplete name="locationFrom" value={this.props.values.locationFrom} id="locationFrom" placeholder="London"
								onChange={(event, { newValue, method }) => this.props.onInputChange("locationFrom", event, { newValue, method })} />
							{this.renderValidationMessages("locationFrom")}
						</FormGroup>
					</Col>
					<Col lg="5">
						<FormGroup>
							<Label for="locationTo">To:</Label>
							<Autocomplete name="locationTo" value={this.props.values.locationTo} id="locationTo" placeholder="New York"
								onChange={(event, { newValue, method }) => this.props.onInputChange("locationTo", event, { newValue, method })} />
							{this.renderValidationMessages("locationTo")}
						</FormGroup>
					</Col>
					<Col lg="2">
						<FormGroup>
							<Label for="date">Date:</Label>
							<DatePicker customInput={<Input />} minDate={moment()} dateFormat="ddd DD MMM" selected={this.props.values.date}
								onChange={this.props.onDateChange} name="date" id="date" readOnly={true} />
						</FormGroup>
					</Col>
				</Row>
				<Row>
					<Col>
						<Button color="primary" size="lg">Search</Button>
					</Col>
				</Row>
			</Form>
		);
	}
}

class SearchResults extends React.Component {
	render() {
		const results = this.props.results;
		let alert = null;

		if (results.length === 0 && this.props.isSearched && !this.props.isLoading) {
			alert = <Alert color="info">No flights found.</Alert>;
		}

		return (
			<div className="search-results-wrapper">
				{alert}
				<div className="search-results">
					<div className="flights">
						{results.map(item => <FlightConnection flight={item.node} key={item.node.id} />)}
					</div>
					{this.props.isLoading && <div className="loader"></div>}
				</div>
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
			<Row className="flight mb-3">
				<Col md="2" className="pt-2 pb-2">
					{departureTime.format("HH:mm")} - {arrivalTime.format("HH:mm")}<br />
					
					<span className="small">
						{departureTime.format("ddd DD MMM")}
					</span>
				</Col>

				<Col md="4" className="pt-2 pb-2">
					{durationHours}h {durationMinutes}min<br />
				
					<span className="small">
						<span title={flight.departure.airport.name}>
							{flight.departure.airport.city.name}
							&nbsp;({flight.departure.airport.locationId})
						</span>
						
						{' '}&rarr;{' '}

						<span title={flight.arrival.airport.name}>
							{flight.arrival.airport.city.name}
							&nbsp;({flight.arrival.airport.locationId})
						</span>
					</span>
				</Col>

				<Col md="2" className="pt-2 pb-2">
					<span className="small">
						{flight.airlines.map(airline => airline.name).join(', ')}
					</span>
				</Col>

				<Col md="2" className="pt-2 pb-2">
					<strong>{flight.price.amount} {flight.price.currency}</strong>
				</Col>

				<Col md="2" className="pt-2 pb-2">
					<a href={flight.bookingUrl} title="Book flight at Kiwi.com">
						<img src={KiwiLogo} alt="Book flight" className="logo" />
					</a>
				</Col>
			</Row>
		);
	}
}

class Paginator extends React.Component {
	render() {
		let prevButton = null, nextButton = null;

		if (this.props.params.hasPreviousPage) {
			prevButton = (
				<PaginationItem onClick={this.props.onPrevPage} disabled={this.props.isLoading}>
					<PaginationLink href="#">&laquo; Prev</PaginationLink>
				</PaginationItem>
			);
		}

		if (this.props.params.hasNextPage) {
			nextButton = (
				<PaginationItem onClick={this.props.onNextPage} disabled={this.props.isLoading}>
					<PaginationLink href="#">Next &raquo;</PaginationLink>
				</PaginationItem>
			);
		}

		return (
			<Pagination className="mt-3">
				{prevButton}
				{nextButton}
			</Pagination>
		);
	}
}

function ErrorMessage(props) {
	return (
		<Alert color="danger">{props.message}</Alert>
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

	renderInputComponent = inputProps => (
		<Input {...inputProps} innerRef={inputProps.ref} ref={null} />
	  );

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
				renderInputComponent={this.renderInputComponent}
		  	/>
		);
	}
}

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false
		};
	}
  
	componentDidCatch(error, info) {
	  this.setState({ hasError: true });
	}
  
	render() {
		if (this.state.hasError) {
			return (
				<UncontrolledAlert color="danger">
					Sorry, something went wrong. Please try to reload the page.
				</UncontrolledAlert>
			);
	  	}
		return this.props.children;
	}
}
