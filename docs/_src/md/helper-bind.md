## The Bind Helper

The bind helper is very simimar to the [on helper](#the-on-helper) with one exception. It saves you from having to write a method in your app when all you want to do is set a value.

For example:

```handlebars
<input type="text" {{ bind input="name.last" }} />
```

```javascript
data: {
  name: {
    first: "David",
    last: "Morrow"
  }
}
```

As opposed to:

```handlebars
<input type="text" {{ on input="updateLastName" }} />
```

```javascript
data: {
  name: {
    first: "David",
    last: "Morrow"
  }
},

methods: {
  updateLastName({ event }) {
    this.name.last = event.target.value;
  }
}
```

On each input event of the text input, the last name will be updated to the input's current value. This is merely a convienance, and could be accomplished by defining a method. But is useful in many common cases.
