

# The Problem

Writing Javascript for the browser used to be simple. You wrote your code, and that same code ran in the browser. _Your_ code is what was running in your application. You spent your time writing Javascript, not configuring tools.

Things have changed. _Modern_ Javascript development requires rediculous amounts of tooling and setup. Webpack, JSX, Virtual DOM, Babel, CLI bolierplates, component loaders, Style extractors, concatenators and on an on. Have you ever looked in your `node_modules` directory? Have you ever seen the filesize of your _built_ app and wondered WTF is all that?

The thing is, **WE DON'T NEED THIS ANYMORE**. Evergreen browsers support the features we want that we have been Babeling and polyfilling in order to use. [ES6](https://caniuse.com/#feat=es6) brought us Promises, Modules, Classes, Template Literals, Arrow Functions, Let and Const, Default Parameters, Generators, Destructuring Assignment, Rest & Spread, Map/Set & WeakMap/WeakSet and many more. All the things we have been waiting for It's all there!

> So why are we still using build steps and mangling _our_ beautiful code back to the stone age?

## ReBars
> ReBars is around 2.8k gzipped and has no dependancies other than Handlebars!

ReBars started with the idea of so what do I _actually_ need from a Javascript framework?

- a templating language _(Handlebars)_
- re-render DOM elements on data change
- manage your event handling and scope


ReBars lets you re-render tiny pieces of your application on change. You are in control of what re-renders and when. There is no Virtual DOM, no JSX, no pre-compiling. _Your_ code runs on your _app_.

ReBars keeps your DOM in sync with your data using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), and gets out of your way. You can get back to just writing Javascript.

ReBars is just a Handlebars instance with helpers added. The main one being a [watch](#the-watch-helper) block helper that lets you tell ReBars what and when to re-render.

> If you have used Handlebars, you already know ReBars

{{ example counter.js }}

# A ReBars Application

A ReBars application is a Handlebars template rendered to a specified DOM element. You can event have more than one app on a page if you desire.

## Getting Started

> You will need Handlebars in order to use ReBars. You can install it from NPM or use a CDN.

```html
<!-- Handlebars from CDN --->
<script src="https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.min.js"></script>
<!-- ReBars from CDN --->
<script src="https://cdn.jsdelivr.net/npm/re-bars@latest/dist/index.umd.min.js"></script>
```

Or using NPM

```shell
npm i --save-dev handlebars re-bars
```

```javascript
import Handlebars from "handlebars";
import ReBars from "re-bars";
```

## Creating an Application

To create an app, invoke the `Rebars.app` function with an Object describing your application.

```javascript
{
  Handlebars // Optional, Handlebars source, defaults to window.Handlebars
  template: ``, // The Handlebars template string
  data: {}, // data passed to your template
  helpers: {}, // Hanlebars helpers to add
  partials: {}, // Hanlebars partials to register
  trace: true, // If true logs changes and re-renders to the console
}
```

This will return an Object containing

- `instance` | `Object` the Handlebars instance the app is using
- `render` | `Function` the function

You then call `render` passing in the selector for a target element to render to.

```javascript
const app = ReBars.app(...your app definition);
app.render("#my-app");
```

## Custom Helpers

If you would like to add helpers to all components within this application you can pass a helpers Object to the `ReBars.app` function, You would then be able to use your `isChecked` helper in any component in your application. The helpers operate just as any other Handlebars helper you would add. `this` is the scope of the render block. [more about Handlebars helpers here](https://handlebarsjs.com/guide/#custom-helpers)

```javascript
ReBars.app({
  helpers: {
    isChecked(val) {
      console.log(this) // the scope of your template
      return val ? "checked" : "";
    },
  }
  ...
});
```

ReBars simply registers these helpers for you to the Handlebars instance of your app. Should you want to register more helpers yourself instead of defining them in your app definition, you can do so using the instanct returned from creating your app.

```javascript
const { instance } = ReBars.app(...);
instance.registerHelper("myCustomHelper", function () {
  // helper code...
})
```

## Handlebars

If you would like use Handlebars from a source other than `window`, you can pass your instance of Handlebars to the `ReBars.app` function. This can be helpful for test setup.

```javascript
import Handlebars from "somewhere";

ReBars.app({
  Handlebars,
  ...
});
```

# ReBars built in helpers

ReBars comes with a few very powerful helpers. Of course you can add your own to any component, or at the application level just as you would with any Handlebars application.


## The {{#watch}} helper

The watch helper tells ReBars to re-render this block on change of the item you pass in as the second parameter.

```javascript
{
  data: {
    hobby: "running",
    name: {
      first: "David",
      last: "Morrow"
    },
    friends: [
      { name: "Joe", hobby: "boxing" },
      { name: "Fred", hobby: "cooking" }
    ]
  }
}
```

Watch allows you to re-render a block of your template on change.
Watch takes an argument of what property to watch. The argument can be a string or an object.

```html
{{#watch name }}
  My name is {{ name.first }} {{ name.last }}.
{{/watch}}
```

Anytime `name` is changed the block would be re-rendered with the updated data.

> If the item you are watching is a primitive such as a `String`, or `Number`. You will need to use a string as the argument.

- `{{#watch name }}` this will watch all keys on Object `name`
- `{{#watch "name(*.)" }}` this is the string equivalent of the above
- `{{#watch "name.first" }}` will only watch for changes to `name.first`
- `{{#watch "name(*.)" "friends.(*.).hobby" }}` will watch for any change to name or hobby
- `{{#watch "friends(*.)hobby" }}` will watch for any friend index hobby change

### Watch Element wrappers
Each `{{watch}}` block gets wrapped in a span with an id which is stored to remember what outlet to re-render on change. Sometimes this can get in the way of styling your layouts.

As a solution you can add a tag, class id, any attribute you want to the watch block.

```html
{{#watch name tag="p" class="intro" id="intro-p" }}
  {{ name.first }} {{ name.last }}
{{/watch}}

<!-- outputs -->
<p class="intro" id="intro-p" data-rbs-watch="rbs4">
  David Morrow
</p>
```

### Watching Arrays
`{{#watch}}` can be used on an `Array` as well.

> Be sure to use the ref helper `{{ ref "somethingUnique" }}` on each item enabling ReBars to only re-render changed items. _Each ref must be unique_

```html
<ul>
  {{#watch "friends(*.)" }}
    {{#each friends as | friend | }}
      <li {{ ref friend.name }}>
        {{ friend.name }} likes to {{ friend.hobby }}
      </li>
    {{/each}}
  {{/watch}}
</ul>
```

## The {{on}} helper
This allows you to bind your component's methods to events in your template.

```html
<button {{ on click="save" "param1" "param2" }}>Save</button>
```

```javascript
methods: {
  save({ event }, arg1, arg1) {
    console.log(arg1, arg1);
    // param1 param2
  }
}
```

> You method, when invoked, the first argument will always be the event, followed by any additional parameters. Parameters must be primitive and not full Objects or Arrays.

- the first parameter is the methodName separated by `:eventType`, if none is specified `click` will be the event
- you can add as many other parameters as you would like to your method call

## The {{component}} helper
This allows you to render child components from withing the component you are in. It takes one parameter, the name of the component to render. This will render a registered component to the DOM of the parent component.

> The "name" of the component is the name property in the component's definition. Not the name you imported it as.

```html
{{ component "myComponentName" }}
```

You can pass props to the component. Any props sent in will be merged with the component's data. If a prop is a method, it will be merged into the child component's methods. The "friend" component will have friend defined in it's data.

```html
<ul>
  {{#each friends as | friend | }}
    {{ component "friend" friend=friend }}
  {{/each}}
</ul>
```
