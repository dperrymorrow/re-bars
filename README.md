# ReBars
A simple approach to complicated Javascript frameworks that need pre-compiled, babeled, and Virtial DOM.

> If you have used Handlebars, you already know ReBars

The main concept of ReBars is a `{{# watch }}` block helper that lets you tell ReBars what and when to re-render.

##### For example:

```html
{{#watch "name.first" }}
  {{ name.first }}
{{/watch}}
```

Each time that `name.first` is changed, just that Handlebars block will re-render. No Virtial DOM patching, the block function from the helper is stored, and simply invoked again.

### Still interested? Cool, let's get to it...

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
    }
  }
}
```

Watch allows you to re-render a block of your template on change.

```html
<div>
  <h1>Hello There</h1>
  {{#watch name }}
    <p>My name is {{ name.first }} {{ name.last }}.
  {{/watch}}
</div>
```

Anytime `name` is changed the `<p>` tag would be re-rendered with the updated data.

> If the item you are watching is a primitive instead of an object. You will need to use the path instead.

```html
<div>
  <h1>Hello There</h1>
  {{#watch "name.first" }}
    <p>My first name is {{ name.first }}
  {{/watch}}
</div>
```

You can watch more than one item as well, It must be a string and comma dilemeted though. You can always use strings for a `{{watch}}`, if an Object,
just use `*` such as `name.*`

```html
<div>
  <h1>Hello There</h1>
  {{#watch "name.*,hobby" }}
    <p>My first name is {{ name.first }}
  {{/watch}}
</div>
```

The above watch will be re-rendered when hobby or any property on name changes.
