# Kiwi.com experimental flights search

This [React](https://reactjs.org/) app was written as a part of homework for developers interested in
[Modern JS weekend](https://jsweekend.cz/) organized by [Kiwi.com](https://www.kiwi.com/).

It provides simple flight connections search.

## Demo

Check out the [demo page](https://kiwi.krepa.cz/).

## Features

- one way flight connections search (by parameters from, to, date) 
- destinations suggestions while typing (autocomplete)
- search results pagination
- using [GraphQL API](https://kiwi-graphiql.now.sh/) to fetch data
- simple form validation
- errors handling
- responsive design using [Bootstrap 4](https://getbootstrap.com/) components.

## Installation

You'll need to have [Node.js](https://nodejs.org) installed on your local development machine.

Then you can install dependent packages via NPM:
```
npm install
```

## Deployment

To run the app in development mode:
```
npm start
```
Open http://localhost:3000 to view it in the browser.

To build the app for production to the `build` folder:
```
npm run build
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
