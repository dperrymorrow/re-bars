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
