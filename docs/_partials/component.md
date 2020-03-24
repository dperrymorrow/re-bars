

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
The template is the Handlebars template that will be rendered. What is defined as the return from your `data()` function will be the root scope of the template when rendering.


## Helpers

Any methods you define under Handlebars helpers methods you define in `helpers` will be automatically added to the instance rendering the component, and be available for use. ReBars includes several helpers as well.

## Name
Each component must define a name. This is is the string you will use to render components using the [component](helpers.html#the-component-helper) helper within your template.

## Data
The data for the component. Must be a function that retuns an Object.

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

It is also possible to return a function as a key in your data. This can be very useful.

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
Methods defined in a component are avalable for use with the [method](helpers.html#method) helper, or can be called from within another method.

> all functions are bound to the component `this`

```html
<button {{ method save "fred" }}>save</button>
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

> They can also be referenced from other Methods

```javascript
methods: {
  findFriend(name) {
    this.friends.find(friend => friend.name === name);
  },
  save(event, name) {
    const friend = this.$methods.findFriend(name);
  }
}
```
