## The watch helper

The watch helper tells ReBars to re-render this block on change of the item you pass in as the second parameter.

Watch allows you to re-render a block of your template on change.
Watch takes an _optional_ arguments of what properties to watch. The arguments can be string or a regular expression. You may also as many as you like. When any change, the block will re-render.

```handlebars
{{#watch}}
  My name is {{ name.first }} {{ name.last }}.
{{/watch}}
```

```javascript
{
  data: {
    open: false,
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

The above omits the what to watch. In this situation, ReBars will pre-render the block, and captures any references used. It would evaluate to the same as.


```handlebars
{{#watch "name.first" "name.last" }}
```

### Automatic Watch pitfalls

Sometimes automatically inferring what to watch will not have the desired effect.

```handlebars
{{#watch}}
  My name is: {{ name.first }} {{ name.last }}
  {{#if open }}
    {{ hobby }}
  {{/if}}
{{/watch}}
```

In the example above, only `name.first` `name.last` will be watched. This is because open was false and hobby was not referenced. When in doubt, be specific.

> If you are unsure what to watch, ReBars traces out changes to the console when you pass `trace: true` to your application. It's best to be explicit when telling ReBars what to watch.

| Argument Example | re-renders when |
| - | - |
| `{{#watch "name(*.)" }}` | on any change to name Object |
| `{{#watch "name.first" }}` | on changes to the string `name.first` |
| `{{#watch "name(*.)" "friends(*.)" }}` | any change to name or friends |
| `{{#watch "friends[1].hobby" }}` | on changes to friends index 1 hobby change
| `{{#watch "friends(*.)hobby" }}` | on change to any friend's hobby change

> You can use any regular expression you would like. The examples above use `(*.)` which equates to any character.

### [Watch Element wrappers](#watch-element-wrappers)
Each `{{#watch}}` block gets wrapped by default in a `<span>` tag with attributes marking what outlet this represents. Sometimes this can get in the way of styling your layout.

As a solution you can add a tag, class id, any attribute you want to the watch block.

> Remember, Handlebars helper arguments must have the params before `key="value"` arguments `{{#watch "name.first" tag="h1" }}`

{{ example for-docs/watcher-tag.js }}
