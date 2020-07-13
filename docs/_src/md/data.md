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

You can also return a method as a value from your data. This is a simple yet powerful feture that lets you return calculations based off your data's state at that point in time. You can even define methods at runtime, or nest them deeply within your data Object.

{{ example for-docs/data-method.js }}

Any method defined in your data Object will be scoped to your data object `this`

> You **cannot** however `watch` a method from your data. You would need to watch the item or items in your data that the method relies on its computation for.
