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
