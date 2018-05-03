# HAL Explorer

An API Explorer for [HAL](http://stateless.co/hal_specification.html) based REST APIs,
inspired by Mike Kelly's [HAL-Browser](https://github.com/mikekelly/hal-browser).

HAL Explorer can be used to browse and explore HAL based hypermedia APIs.

## Screenshot
![HAL Explorer screenshot](hal-explorer.jpg)

## Features

* Responsive design
* Syntax highlighted response body
* Custom request headers
* Bootswatch themes
* 2 layouts (2 column or 3 column)
* API URL, theme, layout and request headers stored in URL fragment

## Demo

You can play with a running demo [here](https://chatty42.herokuapp.com/hal-explorer/index.html#theme=Cosmo&url=https://chatty42.herokuapp.com/api).
I host this demo at Heroku, so please give it a little time to warm up (This might take up to 1 minute).

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

