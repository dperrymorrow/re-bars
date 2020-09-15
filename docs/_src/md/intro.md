# The Problem...

Writing Javascript for the browser used to be simple. You wrote your code, and that same code ran in the browser. **Your** code is what was running in your application. You spent your time writing Javascript, not configuring tools.

Things have changed. _Modern_ Javascript development requires ridiculous amounts of tooling and setup. Webpack, JSX, Virtual DOM, Babel, CLI boilerplates, component loaders, Style extractors, tree-shaking and on and on. Have you looked in your `node_modules` directory recently? Have you ever seen the file size of your _built_ app and wondered WTF is all that? How long will that take to parse before your first meaningful paint?

The thing is, **WE DON'T NEED THIS ANYMORE**. Evergreen browsers support the features we want that we have been Babeling and polyfilling in order to use. [ES6](https://caniuse.com/#feat=es6) brought us Promises, Modules, Classes, Template Literals, Arrow Functions, Let and Const, Default Parameters, Generators, Destructuring Assignment, Rest & Spread, Map/Set & WeakMap/WeakSet and many more. All the things we have been waiting for It's all there!

So why are we still using build steps and mangling **our** beautiful code back to the stone age?

## [ReBars](#rebars)
> ReBars is around 2.8k gzipped and has no dependancies other than Handlebars!

ReBars started with the idea of so what do I _actually_ need from a Javascript framework?

- ✅ a templating language _(Handlebars)_
- ✅ re-render individual DOM elements on data change
- ✅ manage your event handling and scope

ReBars re-renders tiny pieces of your application on change. You are in control of what re-renders and when. There is no...

- ❌ Virtual DOM
- ❌ JSX or anything else to pre-compile
- ❌ DOM diffing and patching

**Your** code simply runs on **your** app.

> In fact there is zero DOM diffing / checking of any kind in ReBars. Marked elements are simply re-rendered when correlating data changes.

ReBars keeps your DOM in sync with your data using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), and gets out of your way. You can get back to just writing Javascript.

The reason ReBars is so simple, is that it is in fact just a Handlebars instance with helpers added. The main one being [watch](#the-watch-helper). This marks elements, and tells ReBars when to re-render them.

> If you have used Handlebars, you already know ReBars

{{ example for-docs/counter.js }}
