# ReBars
A simple alternative to modern Javascript frameworks that need pre-compiled, Babeled, and a Virtial DOM.

> If you have used Handlebars, you already know ReBars

The main concept of ReBars is a `{{#watch }}` block helper that lets you tell ReBars what and when to re-render.

##### For example:

```html
{{#watch "name.first" }}
  {{ name.first }}
{{/watch}}
```

Each time that `name.first` is changed, just that Handlebars block will re-render. No Virtial DOM patching, the block function from the helper is stored, and simply invoked again. Still interested? Cool, let's get to it...

## A ReBars Application

A ReBars application is a collection of components rendered to a DOM element. You can have more than one app on a page if you desire.

You will need Handlebars in order to use ReBars. You can install it from NPM or use a CDN.
Your HTML page could look like such.

```html
<div id="demo-app"></div>
<script src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.5.3/handlebars.min.js"></script>

<script type="module">
  import ReBars from "re-bars";
  import RootComponent from "./app.js";

  ReBars({
    $el: document.getElementById("demo-app"),
    root: RootComponent,
  });
</script>
```

To start and app, there is minimal code on the page. You create a new ReBars app with an Object containing two keys.

- `$el` the Element that your app will be rendered into
- `root` to top level component in your app.

## ReBars Components

Components are where everything happens. Each component has it's own `Handlebars.instance` so their helpers are isolated from other components/applications.

### An component's properties:
```javascript
export default {
  template: `<div></div>`, // your Handlebars template
  name: "myComponent", // must have a name
  data() { return {} }, // data for your template
  methods: {}, // event handlers
  hooks: {}, // lifecycle hooks
  watchers: {}, // methods to fire on change of data
  helpers: {} // Handlebars helpers just for this component
}
```

## Template:

The template is the Handlebars template that will be rendered. What is defined as the return from your `data()` function will be the root scope of the template when rendering. Any Handlebars helpers methods you define in `helpers` will be automatically added to the instance rendering the component, and be available for use. ReBars includes several helpers as well.

## ReBars Built In helpers

### `{{#watch}}` helper

The watch helper tells ReBars to re-render this block on change of the item you pass in as the second parameter.

Suppose we can a component with data as such.

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

- `{{#watch name }}` this will watch all props on `name`
- `{{#watch "name.*" }}` this is the string equvilent of the above
- `{{#watch "name.first" }}` will only watch for changes to `name.first`
- `{{#watch "name.*,hobby" }}` will watch for any change to name or hobby
- `{{#watch "friends.*.hobby" }}` will watch for any friend index hobby change

## Watch Element wrappers

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

> Be sure to add a `{{ ref }}` to each item enabling ReBars to only re-render changed items. _Each ref must be unique_

```html
<ul>
  {{#watch friends }}
    {{#each friends as | friend | }}
      <li {{ ref friend.name }}>
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

## The `{{ref}}` helper

ReBars comes with a `{{ref}}` helper built in. This gives you the ability to save a reference to an element. This also gives a key for Array loop items so that the Array can be patched instead of re-rendered entirely.

- takes one param, the `String` for the reference

> The ref helper is also needed on any input or other elements that need focused restored after a re-render.

```html
<div>
  <h1 {{ ref "header" }}>Header</h1>
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

## The `{{bound}}` helper

The `{{bound}` helper is used on input elements such as `<input>` or `<textarea>` elements. The parameter passed will sync the value attribute to the value, and on `input` event update the value.

```html
<input type="text" {{ bound "name.first" }} />
```

an item that is bound will automatically get a ref added as the path of the property. this is used for resetting focus and cursor position after a re-render. If you have more than one item with the same bound property, you may need to add another reference

You can pass in a ref as a prop to this helper should you need something more specific.

```html
<input type="text" {{ bound "name.first" ref="firstName" }} />
```

## The `{{method}}` helper

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

> You method, when invoked, the first argument will always be the event, followed by any additional parameters. Params must be primiteve and not full Objects or Arrays. 

- the first param is the methodName separated by `:eventType`, if none is specified `click` will be the event
- you can add as many other parameters as you would like to your method call

## The `{{component}}` helper

This allows you to render child components from withing the compnent you are in. It takes one parameter, the name of the component to render. This will render a registered component to the DOM of the parent component.

> The "name" of the component is the name property in the component's definition. Not the name you imported it as.

```html
{{ component "myComponentName" }}
```

You can pass props to the component. Any props sent in will be merged with the component's data. If a prop is a method, it will be merged into the child component's methods.

the "friend" component will have friend defined in it's data.

```html
<ul>
  {{#each friends as | friend | }}
    {{ component "friend" friend=friend }}
  {{/each}}
</ul>
```

You can pass methods to child components as well, they will be merged into the child's methods.

**Parent component:**

```javascript
template: `
<ul>
  {{#watch friends }}
    {{#each friends as | friend | }}
      {{
        component "friend"
        friend=friend
        index=@index
        deleteFriend=methods.deleteFriend
      }}
    {{/each}}
  {{/watch}}
</ul>`,

methods: {
  deleteFriend(event, idnex) {
    this.friends.splice(index, 1)
  },
}
```

**Child component:**

```javascript
template: `
  <div>
    {{ friend.name }} {{ friend.hobby }}
    <button {{ action "deleteFriend" index }}>Delete</button>
  </div>
`
```
on clicking of the button, the friend would be deleted in the parent.

## The `{{debug}}` helper

this helper allows you to view the state of your data in the template.

> The debug helper is reactive by default, no watch wrapper necessary.

To output all data available to your tempalte, use the Handlebars `.` reference.

```html
<!-- full debug -->
{{ debug . }}
<!-- debug name object -->
{{ debug name }}
```
