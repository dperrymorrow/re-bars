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
