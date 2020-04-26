
> A simple, modern approach to Obvervables and DOM re-rendering and patching.

## [Documentation](https://dperrymorrow.github.io/re-bars) | [Examples](https://dperrymorrow.github.io/re-bars#example-simple)



# ReBars

A simple alternative to modern Javascript frameworks that need pre-compiled, Babeled, and a running Virtial DOM.

> ReBars is under 5k gzipped!

ReBars lets you re-render tiny pieces of your application on change. You are in control of what re-renders and when. There is no Virtual DOM, no JSX, no pre-compiling.

ReBars handles keeping your DOM in sync with your data, and gets out of your way. You can get back to just writing Javascript.

ReBars is really just Handlebars with some built in helpers and the notion of [components](#rebars-components). The main concept of ReBars is a [{{#watch}}](#the-watch-helper) block helper that lets you tell ReBars what and when to re-render.

> If you have used Handlebars, you already know ReBars

```javascript
template: /*html*/ `
  <h3>
    Button have been clicked
      {{#watch "clicked" }}
        {{ clicked }}
      {{/watch}}
    times
    <button {{ method "step" }}>Click Me</button>
  </h3>
`,

name: "counter",

data() {
  return { clicked: 0 };
},

methods: {
  step() {
    this.clicked ++;
  },
}
```

Each time the value passed to watch is changed, *just* that Handlebars block will re-render. No Virtial DOM patching, no re-render of entire template. The block function from the helper is stored at first render, and simply invoked again each time a value changes.


- [ReBars Introduction](#rebars)
- [A ReBars Application](#a-rebars-application)
  - [Getting Started](#getting-started)
  - [Global Helpers](#global-helpers)
  - [Handlebars](#handlebars)
- [A ReBars Component](#rebars-components)
  - [Template](#template)
  - [Name](#name)
  - [Data](#data)
  - [Methods](#methods)
  - [Refs](#refs)
  - [Watchers](#watchers)
  - [Hooks](#hooks)
  - [Helpers](#helpers)
- [ReBars Helpers](#rebars-built-in-helpers)
  - [watch](#the-watch-helper)
  - [bound](#the-bound-helper)
  - [method](#the-method-helper)
  - [component](#the-component-helper)
  - [debug](#the-debug-helper)


# A ReBars Application

A ReBars application is a collection of components rendered to a DOM element. You can have more than one app on a page if you desire.

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

To start an app, there is minimal code on the page. You create a new ReBars app with an Object containing two keys.

- `$el` the Element that your app will be rendered into
- `root` the top level [component](component.html) in your app.
- `trace` default false, if true will console.log all data changes and re-renders

``` html
<div id="demo-app"></div>

<script type="module">
  import ReBars from "re-bars";
  import RootComponent from "./app.js";

  ReBars.app({
    $el: document.getElementById("demo-app"),
    root: RootComponent,
    trace: true // default false
  });
</script>
```

## Global Helpers

If you would like to add helpers to all components within this application you can pass a helpers Object to the `ReBars.app` function, You would then be able to use your `isChecked` helper in any component in your application.

```javascript
ReBars.app({
  $el: document.getElementById("demo-app"),
  root: RootComponent,
  helpers: {
    isChecked: val => (val ? "checked" : ""),
  }
});
```

## Global Components

If you would like to register components for all components within this application you can pass a components Array to the `ReBars.app` function. This is the same as passing your components to a component definition.

```javascript
import MyComponent from "my-component.js";

ReBars.app({
  $el: document.getElementById("demo-app"),
  root: RootComponent,
  components: [ MyComponent ]
});
```

## Handlebars

If you would like use Handlebars from a source other than on `window` _such as loading from a CDN_, you can pass your instance of Handlebars to the `ReBars.app` function.

```javascript
import Handlebars from "somewhere";

ReBars.app({
  Handlebars,
  $el: document.getElementById("demo-app"),
  root: RootComponent,
});
```



# ReBars Components

Components are where everything happens. Each component has it's own `Handlebars.instance` so their helpers are isolated from other components/applications.


```javascript
export default {
  template: /*html*/ `<div></div>`, // your Handlebars template
  name: "myComponent", // must have a name
  data() { return {} }, // data for your template
  methods: {}, // event handlers
  hooks: {}, // lifecycle hooks
  watchers: {}, // methods to fire on change of data
  helpers: {} // Handlebars helpers just for this component
}
```

## Template
The template is the Handlebars template that will be rendered. What is defined as the return from your `data()` function will be the root scope of the template when rendering.

## Name
Each component must define a name. This is is the string you will use to render components using the [component](#the-component-helper) helper within your template.

## Data
The data for the component. Must be a function that returns an Object.

```javascript
data() {
  return {
    name: {
      first: "David",
      last: "Morrow"
    }
  }
}
```

> It is also possible to return a function as a key in your data. This can be very useful.

```javascript
data() {
  return {
    fullName() {
      return `${this.name.first}, ${this.name.last}`;
    },
    name: {
      first: "David",
      last: "Morrow"
    }
  }
}
```
```html
<p>{{ fullName }}</p>
```

## Methods
Methods defined in a component are available for use with the [method](#the-method-helper) helper, or can be called from within another method.

```html
<button {{ method "save:click" "fred" }}>save</button>
```

```javascript
methods: {
  save(event, name) {
    // this.$methods
    // this.$refs()
    // this.$props
  }
}
```

> Methods can reference other methods.

```javascript
methods: {
  findFriend(name) {
    this.friends.find(friend => friend.name === name);
  },
  save(event, name) {
    const friend = this.$methods.findFriend(name);
    // save your friend
  }
}
```

## Refs

ReBars keeps track of any element with a `ref=""` tag on it. This gives you the ability to save a reference to an element. This also gives a key for Array loop items so that the Array can be patched instead of re-rendered entirely.

> The ref tag is also needed on any input or other elements that need focused restored after a re-render. It is also needed to prevent a full re-render of an Array if watching an Array. See [the bound helper](#the-bound-helper) and [the watch helper](#the-watch-helper)

```html
<div>
  <h1 ref="header">Header</h1>
</div>
```

inside of a method, you can reference any ref by using the `$refs()` function from a method in your component.

```javascript
methods: {
  save() {
    this.$refs().header;
    // returns the <h1> element
  }
}
```

If there are more than one element with the same ref, they will be returned as an Array.

```html
<ul>
  <li {{ ref "listItem" }}>item one</li>
  <li {{ ref "listItem" }}>item one</li>
</ul>
```

```javascript
methods: {
  save() {
    this.$refs().listItem
    // return [li, li]
  }
}
```

## Watchers

Watchers give you the ability to call a function when a property in your data has change. You can watch any items in  your data or `$props`

> You cannot, however watch a method in your data. Methods defined in your data are only for convenience for your template rendering.

```javascript
data() {
  return {
    name: {
      first: "David"
    }
  };
},

watchers: {
  "name.first"() {
    console.log(this.name.first); // David
    // this.$refs()
    // this.$methods
    // this.$props
  }
}
```

Each time `name.first` is changed the method will be triggered with the same context you would have in a method.

## Hooks

Hooks are triggered at different points in the component instance's life.

- `created` triggered when the component is instantiated and prior to rendering
- `attached` the component has been rendered and added to the DOM
- `detached` the component is no longer on the DOM and is being garbage collected

> `this.$refs()` cannot be used in the created hook. The component is not yet on the DOM. If you need to do something with the component's `$refs` or DOM. Use the attached hook instead.


```javascript
data() {
  return {
    name: {
      first: "David"
    }
  }
},

hooks: {
  created() {
    // you can set items here pre-render
    this.name.first = "Mike";
  }
}
```

## Helpers

Any methods you define under Handlebars helpers methods you define in `helpers` will be automatically added to the instance rendering the component, and be available for use. ReBars includes several [helpers](helpers.html) as well.

```html
<input type="checkbox" {{ isChecked someBoolean }} />
```
```javascript
helpers: {
  isChecked: val => (val ? "checked" : ""),
}
```

These helpers are only available for the context of the component you are defining. If you would like to define helpers that are global. Add them to the [ReBars application](#a-rebars-application).


# ReBars built in helpers

ReBars comes with a few very powerful helpers. Of course you can add your own to any component, or at the application level just as you would with any Handlebars application.


## The {{#watch}} helper

The watch helper tells ReBars to re-render this block on change of the item you pass in as the second parameter.

```javascript
data() {
  return {
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
- `{{#watch "name.*" }}` this is the string equivalent of the above
- `{{#watch "name.first" }}` will only watch for changes to `name.first`
- `{{#watch "name.*,hobby" }}` will watch for any change to name or hobby
- `{{#watch "friends.*.hobby" }}` will watch for any friend index hobby change

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

> Be sure to add a `ref="somethingUnique"` to each item enabling ReBars to only re-render changed items. _Each ref must be unique_

```html
<ul>
  {{#watch friends }}
    {{#each friends as | friend | }}
      <li ref="{{ friend.name }}">
        {{ friend.name }} likes to {{ friend.hobby }}
      </li>
    {{/each}}
  {{/watch}}
</ul>
```

If you are watching inside a loop, you can target the specific object and key by passing further arguments. The example below will only trigger a re-render on that `friend.name` _(the item in the loop)_ change

```html
<ul>
  {{#each friends as | friend | }}
    <li>
      {{#watch friend "name" }}
        {{ friend.name }}
      {{/watch}}
    </li>
  {{/each}}
</ul>
```


## The {{bound}} helper
The `{{bound}` helper is used on input elements such as `<input>` or `<textarea>` elements. The parameter passed will sync the value attribute to the value, and on `input` event update the value.

```html
<input type="text" {{ bound "name.first" }} />
```

an item that is bound will automatically get a ref added as the path of the property. this is used for resetting focus and cursor position after a re-render. If you have more than one item with the same bound property, you may need to add another reference

You can pass in a ref as a prop to this helper should you need something more specific.

```html
<input type="text" {{ bound "name.first" ref="firstName" }} />
```

## The {{method}} helper
This allows you to bind your component's methods to events in your template.

```html
<button {{ method "save:click" "param1" "param2" }}>Save</button>
```

```javascript
methods: {
  save(event, arg1, arg1) {
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

### Passing Methods as props
You can pass methods to child components as well, they will be merged into the child's methods.

**Parent component:**

```html
<ul>
  {{#watch friends }}
    {{#each friends as | friend | }}
      {{
        component "friend"
        friend=friend
        index=@index
        deleteFriend=$methods.deleteFriend
      }}
    {{/each}}
  {{/watch}}
</ul>
```

```javascript
methods: {
  deleteFriend(event, index) {
    this.friends.splice(index, 1)
  },
}
```

**Child component:**

```html
<button {{ method "remove" }}>Delete Joe</button>
```

```javascript
methods: {
  remove(event, name) {
    this.$props.deleteFriend(this.$props.index)
  }
}
```
on clicking of the button, the friend would be deleted in the parent. Any watch blocks watching the `friends.*` or `friend[index]` would be re-rendered.

## The {{debug}} helper
this helper allows you to view the state of your data in the template.

To output all data for your template, use the Handlebars `.` reference.

```html
<!-- full debug -->
{{ debug . }}
<!-- debug name object -->
{{ debug name }}
```

