
> A simple, modern approach to Obvervables and DOM re-rendering and patching.

## [Documentation](https://dperrymorrow.github.io/re-bars) | [Examples](https://dperrymorrow.github.io/re-bars#example-simple)

- [ReBars Introduction](#rebars)
- [A ReBars Application](#a-rebars-application)
  - [Getting Started](#getting-started)
  - [Handlebars](#handlebars)
  - [Data](#data)
  - [Watch Methods](#watch)
  - [Helpers](#helpers)
  - [Methods](#methods)
  - [Partials](#partials)
- [ReBars Helpers](#rebars-built-in-helpers)
  - [watch (re-rendering)](#the-watch-helper)
  - [on (event handling)](#the-on-helper)
  - [ref (element reference)](#the-ref-helper)
- [Examples](#examples)
  - [Simple](#todo-list-simple)
  - [Advanced](#todo-list-advanced)

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

# [A ReBars Application](#a-rebars-application)

A ReBars application is a Handlebars template rendered to a specified DOM element. You can event have more than one app on a page if you desire.
## [Getting Started](getting-started)

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

### [Creating an Application](#creating-an-application)

To create an app, invoke the `Rebars.app` function with an Object describing your application. _(We will talk more about thes items in a sec)_.

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
## [Handlebars](#handlebars)

If you would like use Handlebars from a source other than `window`, you can pass your instance of Handlebars to the `ReBars.app` function. This can be helpful for test setup.

```javascript
import Handlebars from "somewhere";
ReBars.app({
  Handlebars,
  ...
});
```
## [Helpers](#helpers)

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
    toggle() {
      this.isOn = !this.isOn;
    },
  },

  helpers: {
    isChecked() {
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
## [Methods](#methods)

Methods define functions that can be called from event handlers, [see on helper](#the-on-helper) or can be called from another method in your application. This allows you to share code, and prevent redundant declarations.

When a method is triggerd, it is called with the current scope of the template from where it was called `this`, similar to how Handlebars helpers are called with `this` as the scope of which the helper was triggered.

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
| `$nextTick` | `Function` | returns a promose when called. Allows you to wait until after the next render to preform an action on the DOM |
| `methods` | `Object` | the methods defined in your app. If called, they will be called with the same scope. |

> If you call a method from another method. The scope remains the same. _(the context in the template where the call originated)_

Here is an example of chaining methods from within a ReBars appliction.



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
      rootData.favorite = `${this.toUpperCase()}!! is my favorite food`;
    },

    isFavorite({ event, $refs, $nextTick, rootData, methods }) {
      methods.display();
    },
  },
};

```


# [ReBars built in helpers](#rebars-built-in-helpers)

ReBars consists of a few very powerful Handlebars helpers. Of course you can add your own to extend even futher, but the following is what you get on install.
## [The watch helper](#the-watch-helper)

The watch helper tells ReBars to re-render this block on change of the item you pass in as the second parameter.


Watch allows you to re-render a block of your template on change.
Watch takes an _optional_ arguments of what properties to watch. The arguments can be string or a regular expression. You may aslo as many as you like. When any change, the block will re-render.

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
Each `{{#watch}}` block gets wrapped by default in a `<span>` tag with attributes marking what outlet this represents. Sometimes this can get in the way of styling your layouts.

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


### [Watching Arrays](#watching-arrays)
`{{#watch}}` can be used on an `Array` as well. But if one item in the Array changes, you don't want to re-render the entire block. That could have performance implications. Instead, ReBars will only update changed items in the block if every element has a [reference](#the-ref-helper)

> By using the ref helper `{{ ref "somethingUnique" }}` on each item, it enables ReBars to only re-render the changed items. _Each ref must be unique_ such as a pKey from the database or such.

```html
{{#watch "friends(*.)" tag="ul" }}
  {{#each friends as | friend | }}
    <li {{ ref friend.name }}>
      {{ friend.name }} likes to {{ friend.hobby }}
    </li>
  {{/each}}
{{/watch}}
```
## [The on helper](#the-on-helper)
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
# Examples

Here you can get a better idea of how one would build a small application with ReBars. The entire source code for the examples is shown below the functioning ReBars app.



## Todo List Simple

A simple, one component application that tracks todos. You can view source code on [Github](https://github.com/dperrymorrow/re-bars/blob/master/docs/examples/app.js)



```javascript
export default {
  template: /*html*/ `
  <div>
    <div class="header-container">
      <h1>
        {{#watch}}
          <span>{{ header.title }}</span>
          <small>{{ header.description }}</small>
        {{/watch}}
      </h1>

      <label>
        Title:
        <input
          type="text"
          value="{{ header.title }}"
          {{ on input="updateTitle" }}
        />
      </label>

      <label>
        Description:
        <input
          type="text"
          value="{{ header.description }}"
          {{ on input="updateDescription" }}
        />
      </label>
    </div>

    <ul class="simple">
      {{#watch "todos(.*)" }}
        {{#each todos }}
          <li {{ ref id }}>
            <div class="todo">
              <label>
                <input
                  type="checkbox"
                  {{ on click="toggleDone" }}
                  {{ isChecked }}
                />
                {{#if done }}
                  <s>{{ name }}</s>
                {{else}}
                  <strong>{{ name }}</strong>
                {{/if}}
              </label>

              <div class="actions">
                <button {{ on click="deleteTodo" }}>
                  delete
                </button>
              </div>
            </div>
          </li>
        {{/each}}
      {{/watch}}
    </ul>

    {{#watch}}
      {{#if adding }}
        <form>
          <input type="text" {{ ref "newName" }} placeholder="the new todo" />
          <button {{ on click="addItem" }}>Add todo</button>
          <button {{ on click="toggleCreate" }}>Cancel</button>
        </form>
      {{else}}
        <button {{ on click="toggleCreate" }}>Add another</button>
      {{/if}}
    {{/watch}}
  </div>
  `,

  trace: true,

  data: {
    adding: false,
    header: {
      title: "Todos",
      description: "some things that need done",
    },
    todos: [
      {
        done: false,
        name: "Grocery Shopping",
        id: 22,
      },
      {
        done: true,
        name: "Paint the House",
        id: 44,
      },
    ],
  },

  helpers: {
    isChecked() {
      return this.done ? "checked" : "";
    },
  },

  methods: {
    updateTitle({ event }) {
      this.header.title = event.target.value;
    },

    updateDescription({ event }) {
      this.header.description = event.target.value;
    },

    addItem({ $refs, event }) {
      event.preventDefault();
      const $input = $refs().newName;

      this.todos.push({
        id: new Date().getTime(),
        done: false,
        name: $input.value,
      });

      $input.value = "";
    },

    findTodo({ rootData }, id) {
      return rootData.todos.find(item => item.id === parseInt(id));
    },

    deleteTodo({ rootData }) {
      const index = rootData.todos.findIndex(t => t.id === this.id);
      rootData.todos.splice(index, 1);
    },

    toggleDone({ event, methods }) {
      const todo = methods.findTodo(this.id);
      todo.done = !this.done;
    },

    toggleCreate({ event }) {
      event.preventDefault();
      this.adding = !this.adding;
    },
  },
};

```

## Todo List Advanced

Same concept, a little more advanced using partials, some sorting and filtering. You can view the full app source code on [Github](https://github.com/dperrymorrow/re-bars/tree/master/docs/examples/advanced)



```javascript
import Add from "./add.js";
import Todo from "./todo.js";
import Filters from "./filters.js";

const { localStorage } = window;
const storageKey = "rebars-todo";
const store = localStorage.getItem(storageKey) || "{}";
const { todos, header } = JSON.parse(store);

export default {
  template: /*html*/ `
    <div class="header-container">
      {{#watch tag="h1" }}
        <span>{{ header.title }}</span>
        <small>{{ header.description }}</small>
      {{/watch}}

      <label>
        Title:
        <input type="text" value="{{ header.title }}" {{ on input="updateTitle" }} />
      </label>

      <label>
        Description:
        <input type="text" value="{{ header.description }}" {{ on input="updateDescription" }} />
      </label>
    </div>

    {{> Filters }}

    {{#watch "filters(.*)" "todos(.*)" tag="ul"}}
      {{#each filteredTodos as | todo | }}
        {{> Todo todo=todo }}
      {{/each}}
    {{/watch}}

    {{> Add }}
  `,

  trace: true,

  watch: {
    "(.*)"() {
      localStorage.setItem(storageKey, JSON.stringify(this.data));
    },
  },

  data: {
    header: header || {
      title: "ReBars Todos",
      description: "Some things that need done",
    },

    todos: todos || [
      {
        done: false,
        name: "Wash the car",
        updated: "3/1/2020, 12:37:10 PM",
        id: 21,
      },
      {
        done: true,
        name: "Shopping for groceries",
        updated: "2/27/2020, 2:37:10 PM",
        id: 22,
      },

      {
        done: false,
        name: "Code some Javascript",
        updated: "1/27/2020, 9:37:10 AM",
        id: 23,
      },

      {
        done: true,
        name: "Go for a run",
        updated: "1/15/2020, 10:37:10 PM",
        id: 24,
      },
    ],
  },

  partials: {
    Todo,
    Filters,
    Add,
  },

  methods: {
    updateTitle({ event, methods }) {
      this.header.title = event.target.value;
    },

    updateDescription({ event, methods }) {
      this.header.description = event.target.value;
    },
  },
};

```


