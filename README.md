
> A simple, modern approach to Obvervables and DOM re-rendering and patching.

## [Documentation](https://dperrymorrow.github.io/re-bars) | [Examples](https://dperrymorrow.github.io/re-bars#example-simple)

- [ReBars Introduction](#rebars)
- [A ReBars Application](#a-rebars-application)
  - [Getting Started](#getting-started)
  - [Handlebars](#handlebars)
  - [Template](#template)
  - [Data](#data)
  - [Hooks](#hooks)
  - [Helpers](#helpers)
  - [Methods](#methods)
  - [Partials](#partials)
- [ReBars Helpers](#rebars-built-in-helpers)
  - [watch (re-rendering)](#the-watch-helper)
  - [concat (string building)](#the-concat-helper)
  - [on (event handling)](#the-on-helper)
  - [ref (element reference)](#the-ref-helper)

---

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



```javascript
export default {
  template: /*html*/ `
    <strong>
      Button have been clicked
      {{#watch}}
        {{ clicked }}
      {{/watch}}
      times
    </strong>

    <button {{ on click="step" }}>Click Me</button>
  `,

  data: { clicked: 0 },

  methods: {
    step() {
      this.clicked++;
    },
  },
};

```


# A ReBars Application

A ReBars application is a Handlebars template rendered to a specified DOM element. You can event have more than one app on a page if you desire.

## Getting Started

> You will need Handlebars in order to use ReBars. You can install it from NPM or use a CDN.


Using a CDN

```html
<script src="//cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.min.js"></script>
<script src="//cdn.jsdelivr.net/npm/re-bars@latest/dist/index.umd.min.js"></script>
```

Or using NPM

```shell
npm i --save-dev handlebars re-bars
```

```javascript
import Handlebars from "handlebars";
import ReBars from "re-bars";
```

Or using browser esm modules

```html
<script type="module">
  import Handlebars from "//unpkg.com/handlebars-esm";
  import ReBars from "//unpkg.com/re-bars";
</script>
```

### [Creating an Application](#creating-an-application)

To create an app, invoke the `Rebars.app` function with an Object describing your application. _(We will talk more about thes items in a sec)_.

```javascript
{
  Handlebars // Optional, Handlebars source, defaults to window.Handlebars
  template: ``, // The Handlebars template string
  data: {}, // data passed to your template
  helpers: {}, // Handlebars helpers to add
  partials: {}, // Handlebars partials to register
  trace: true, // If true logs changes and re-renders to the console
}
```

This will return an Object containing

| Key | Type | Description |
| - | - | - |
| instance | Object | the Handlebars instance the app is using |
| render | Function | the function to render the app  |

### [The Render Function](#the-render-function)
You then call `render` passing in the selector for a target element to render to.

```javascript
const app = ReBars.app(...your app definition);
app.render("#my-app");
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

## Template

The template is a String that is your Handlebars template your application will use. It will be rendered with the helpers and data that you include in your application.

It is helpful to use a [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) so that you can have multiple lines in your template String.

```javascript
export default {
  template: /*html*/ `
    <h1>{{ myName }}</h1>
  `,
  data: {
    myName: "Dave"
  }
};
```

### Loading from external files

ReBars includes a function to load your templates from external files. This can be super handy for breaking up your application, or in working with proper syntax highlighting in your editor of choice.

> ReBars will wait for all templates to resolve before mounting your application. `ReBars.load` can also be used for loading [partials](#partials) as external files.

```handlebars
<!-- template.hbs -->
<h1>{{ myName }}</h1>
```

```javascript
const { ReBars } = window;

export default {
  template: ReBars.load("./template.hbs"),
  data: {
    myName: "Dave"
  }
};
```

## Data

The data object you provide to your ReBars application is the core of what makes ReBars great.

Your data object is what is passed to your Handlebars template on render, and what is watched for changes with the [watch](#the-watch-helper), and triggers re-renders.

```javascript
{
  ...
  data: {
    name: {
      first: "David",
      last: "Morrow"
    }
  }
}
```

> You don't have to do anything special for ReBars to observe all changes to your data Object. In fact ReBar's observer is native [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

### Methods in your data

You can also return a method as a value from your data. This is a simple yet powerful feature that lets you return calculations based off your data's state at that point in time. You can even define methods at runtime, or nest them deeply within your data Object.



```javascript
export default {
  template: /*html*/ `
    {{#watch "friends.length" tag="h3" }}
      my friends: {{ allMyFriends }}
    {{/watch}}

    <input type="text" {{ ref "input" }}>
    <button {{ on click="add" }}>Add</button>
  `,

  data: {
    allMyFriends() {
      return this.friends.join(", ");
    },

    friends: ["Mike", "David", "Todd", "Keith"],
  },

  methods: {
    add({ rootData, $refs }) {
      const $input = $refs().input;
      this.friends.push($input.value);
      $input.value = "";
    },
  },
};

```


Any method defined in your data Object will be scoped to your data object `this`

> You **cannot** however [watch](#the-watch-helper) a method from your data. You would need to watch the item or items in your data that the method relies on its computation for.

## Hooks

ReBars has the following hooks for use. These methods can be useful for manipulating initial data, instantiating 3rd party libraries ect.

They are called with the same scope as other functions in ReBars, `this` being your data, and a parameter of [context](#methods)

| Hook | Description |
| - | - |
| `beforeRender` | Called right before your application renders for the first time. |
| `afterRender` | Called right after your application renders for the first time |


> When using `beforeRender` hook, your DOM will not be available. It has not yet been rendered to the page. Context items such as `$refs` and `$app` are undefined.

```javascript
data: {
  name: "Dave",
},

hooks: {
  afterRender({ $app, methods, rootData, $refs, $nextTick }) {
    console.log(this); // { name: "Dave" }
  }
}
```

## Helpers

If you would like to add helpers to your app you can pass a helpers Object to the `ReBars.app` function.

```javascript
ReBars.app({
  helpers: {} // your custom helpers
  ...
});
```

The helpers operate just as any other Handlebars helper you would add. `this` is the scope of the render block. [more about Handlebars helpers here](https://handlebarsjs.com/guide/#custom-helpers)

In the example below, you would then be able to use your `isChecked` helper anywhere in your application.



```javascript
export default {
  template: /*html*/ `
    <label>
      {{#watch}}
        <input type="checkbox" {{ isChecked }} {{ on input="toggle" }}>
      {{/watch}}
      Is On
    </label>
    <button {{ on click="toggle" }}>Toggle</button>
  `,

  data: {
    isOn: false,
  },

  methods: {
    toggle(context) {
      this.isOn = !this.isOn;
    },
  },

  helpers: {
    isChecked(context) {
      if (this.isOn) return "checked";
    },
  },
};

```


ReBars simply registers these helpers for you to the Handlebars instance of your app. Should you want to register more helpers yourself instead of defining them in your app definition, you can do so using the instance returned from creating your app. It's the same thing.

```javascript
const { instance } = ReBars.app(...);
instance.registerHelper("myCustomHelper", function () {
  // helper code...
})
```

## Methods

Methods define functions that can be called from event handlers, [see on helper](#the-on-helper) or can be called from another method in your application. This allows you to share code, and prevent redundant declarations.

When a method is trigged, it is called with the current scope of the template from where it was called `this`, similar to how Handlebars helpers are called with `this` as the scope of which the helper was triggered.

The first param when invoked is an object containing the following.

```javascript
methods: {
  myMethod({ event, $app, rootData, $refs, $nextTick, methods}) {
    ...
  }
}
```

| Key | Type | Description |
| - | - | - |
| `event` | `Event Object` | the event Object triggered from the UI interaction MouseEvent ect. |
| `$app` | `Element` | the element that the app is rendered to. |
| `rootData` | `Object` | the data at the root of your application. |
| `$refs` | `Function` | `$refs()` returns all the elements in your application that have been marked with a [ref](#the-ref-helper) |
| `$nextTick` | `Function` | returns a Promise when called. Allows you to wait until after the next render to preform an action on the DOM |
| `methods` | `Object` | the methods defined in your app. If called, they will be called with the same scope. |

> If you call a method from another method. The scope remains the same. _(the context in the template where the call originated)_

Here is an example of chaining methods from within a ReBars application.



```javascript
export default {
  template: /*html*/ `
    {{#each foods as | food | }}
      <button {{ on click="isFavorite" }}>{{ food }}</button>
    {{/each}}

    {{#watch}}
      {{ favorite }}
    {{/watch}}
  `,

  data: {
    favorite: null,
    foods: ["pizza", "cake", "donuts"],
  },

  methods: {
    display({ rootData }) {
      // this is the scope of the template
      // here it is a string inside of the each loop
      rootData.favorite = `${this.toUpperCase()}!! is my favorite food`;
    },

    isFavorite({ event, $refs, $nextTick, rootData, methods }) {
      // here we call another method, and the scope remains the same
      methods.display();
    },
  },
};

```


## Partials

The partials object in a ReBars app is simply a way to use Handlebars built in [partials](https://handlebarsjs.com/guide/partials.html) functionality in a ReBars application.

This lets you break up your templates into pieces.


> This is another great candidate for using `ReBars.load` to have separate files for your partials.

```handlebars
<!-- person.hbs -->
<ul>
  </li>{{ fullName }}</li>
  </li>{{ person.profession }}</li>
</ul>
```

```javascript
// app.js
const { ReBars } = window;

export default {
  template: /*html*/ `
    <h1>All the people</h1>
    {{#each people as | person | }}
      {{> Person person=person }}
    {{/each}}
  `,

  data: {
    people: [
      { firstName: "Mike", lastName: "Jones", profession: "Doctor" },
      { firstName: "David", lastName: "Smith", profession: "Programmer" },
    ]
  },

  partials: {
    Person: ReBars.load("./person.hbs")
  }
}
```

This is simply a convenience method giving you access to Handlebar's `registerPartial` method. Just like with helpers, if you would like to work directly with Handlebars, you simply reference the instance passed back after you create your application. See [Handlebars Partials](https://handlebarsjs.com/guide/partials.html) for more info.

```javascript
const app = ReBars.app(...);
app.instance.registerPartial("myPartial", "<h1><{{ name }}</h1>");
```


# ReBars built in helpers

ReBars consists of a few very powerful Handlebars helpers. Of course you can add your own to extend even further, but the following is what you get on install.

## The watch helper

The watch helper tells ReBars to re-render this block on change of the item you pass in as the second parameter.


Watch allows you to re-render a block of your template on change.
Watch takes an _optional_ arguments of what properties to watch. The arguments can be string or a regular expression. You may also as many as you like. When any change, the block will re-render.

In our explanation below, we will be referring to this data set.

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
```html
{{#watch}}
  My name is {{ name.first }} {{ name.last }}.
{{/watch}}
```

The above omits the what to watch. In this situation, ReBars will pre-render the block, and captures any references used. It would evaluate to the same as.



```html
{{#watch "name.first" "name.last" }}
```

> If you are unsure what to watch, ReBars traces out changes to the console when you pass `trace: true` to your application.

| Argument Example | re-renders when |
| - | - |
| `{{#watch "name(*.)" }}` | on any change to name Object |
| `{{#watch "name.first" }}` | on changes to the string `name.first` |
| `{{#watch "name(*.)" "friends(*.)" }}` | any change to name or friends |
| `{{#watch "friends[1].hobby" }}` | on changes to friends index 1 hobby change
| `{{#watch "friends(*.)hobby" }}` | on change to any friend's hobby change

> You can use any regular expression you would like. The examples above use `(*.)` which equates to any character.

### [Watch Element wrappers](#watch-element-wrappers)
Each `{{#watch}}` block gets wrapped by default in a `<span>` tag with attributes marking what outlet this represents. Sometimes this can get in the way of styling your layout.

As a solution you can add a tag, class id, any attribute you want to the watch block.

> Remember, Handlebars helper arguments must have the params before `key="value"` arguments `{{#watch "name.first" tag="h1" }}`



```javascript
export default {
  template: /*html*/ `
    {{#watch "name" tag="h3"}}
      {{ name }}
    {{/watch}}

    <input type="text" value="{{ name }}" {{ on input="saveName" }}>
  `,
  data: {
    name: "David",
  },
  methods: {
    saveName({ event }) {
      this.name = event.target.value;
    },
  },
};

```


## The Concat Helper

Sometimes you need to piece together something that is a combination of a dynamic value, and a static. Thats where this simple little helper comes in handy.

In this example we are looking to not re-render the entire Array on change of any of it's items. So we use the concat helper as a [sub expression](https://handlebarsjs.com/guide/expressions.html#subexpressions)

> Notice the `()` around the sub expression. You will get a syntax error without them!

```handlebars
{{#watch "todos.length" tag="ul"}}
  {{#each todos as | todo | }}
    {{#watch (concat "todos." @index "(.*)") tag="li" }}
      {{ todo.name }}
    {{/watch}}
  {{/each}}
{{/watch}}
```

The above results in the equivalent of

```handlebars
{{#watch "todos.1(.*)" }}
```

## The on helper

This allows you to bind your component's methods to events in your template. The method will be called with the first param an Object as described [above](#methods) and any additional params that are passed to the helper.

The method will be called with `this` _(scope)_ as the context in the template from where the on helper was called

```html
<button {{ on "yes" click="save" }}>Save</button>
```

```javascript
methods: {
  save(context, arg) {
    console.log(arg);
    // yes
  }
}
```

> Remember Handlebars requires params to be first, and then `key="val"` arguments second

You can also call multiple events on one invocation of the on helpers. For example.

```html
<input {{ on focus="focused" blur="blurred" input="inputChange" >
```

## The ref helper

The ref helper gives you an alias to a DOM element in your template. The `$refs` method can be accessed in the context passed like other items in the context.


```html
<button {{ ref "myButton" }}>Save</button>
<a {{ on click="doSomething" }}>Click</a>
```

```javascript
methods: {
  doSomething(context) {
    console.log(context.$refs().myButton);
    // <button>Save</button>
  }
}
```

