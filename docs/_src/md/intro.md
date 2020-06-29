# The Problem...

Writing Javascript for the browser used to be simple. You wrote your code, and that same code ran in the browser. **Your** code is what was running in your application. You spent your time writing Javascript, not configuring tools.

Things have changed. _Modern_ Javascript development requires rediculous amounts of tooling and setup. Webpack, JSX, Virtual DOM, Babel, CLI bolierplates, component loaders, Style extractors, concatenators and on and on. Have you looked in your `node_modules` directory recently? Have you ever seen the filesize of your _built_ app and wondered WTF is all that?

The thing is, **WE DON'T NEED THIS ANYMORE**. Evergreen browsers support the features we want that we have been Babeling and polyfilling in order to use. [ES6](https://caniuse.com/#feat=es6) brought us Promises, Modules, Classes, Template Literals, Arrow Functions, Let and Const, Default Parameters, Generators, Destructuring Assignment, Rest & Spread, Map/Set & WeakMap/WeakSet and many more. All the things we have been waiting for It's all there!

So why are we still using build steps and mangling **our** beautiful code back to the stone age?

## [ReBars](#rebars)
> ReBars is around 2.8k gzipped and has no dependancies other than Handlebars!

ReBars started with the idea of so what do I _actually_ need from a Javascript framework?

- a templating language _(Handlebars)_
- re-render DOM elements on data change
- manage your event handling and scope

ReBars re-renders tiny pieces of your application on change. You are in control of what re-renders and when. There is no Virtual DOM, no JSX, no pre-compiling. **Your** code runs on **your** app.

ReBars keeps your DOM in sync with your data using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), and gets out of your way. You can get back to just writing Javascript.

ReBars is just a Handlebars instance with helpers added. The main one being a [watch](#the-watch-helper) block helper that lets you tell ReBars what and when to re-render.

> If you have used Handlebars, you already know ReBars

{{ example for-docs/counter.js }}
