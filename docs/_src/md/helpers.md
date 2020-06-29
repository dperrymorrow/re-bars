
# [ReBars built in helpers](#rebars-built-in-helpers)

ReBars consists of a few very powerful Handlebars helpers. Of course you can add your own to extend even futher, but the following is what you get on install.


## The watch helper

The watch helper tells ReBars to re-render this block on change of the item you pass in as the second parameter.


Watch allows you to re-render a block of your template on change.
Watch takes an _optional_ arguments of what properties to watch. The arguments can be string or a regular expression. You may aslo as many as you like. When any change, the block will re-render.

In our explanation below, we will be referring to this data set.

```javascript
{
  data: {
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
```html
{{#watch}}
  My name is {{ name.first }} {{ name.last }}.
{{/watch}}
```

The above omits the what to watch. In this situation, ReBars will pre-render the block, and captures any references used. It would evaluate to the same as.



```html
{{#watch "name.first" "name.last" }}
```

> If you are unsure what to watch, ReBars traces out changes to the console when you pass `trace: true` to your application.

| Argument Example | re-renders when |
| - | - |
| `{{#watch "name(*.)" }}` | on any change to name Object |
| `{{#watch "name.first" }}` | on changes to the string `name.first` |
| `{{#watch "name(*.)" "friends(*.)" }}` | any change to name or friends |
| `{{#watch "friends[1].hobby" }}` | on changes to friends index 1 hobby change
| `{{#watch "friends(*.)hobby" }}` | on change to any friend's hobby change

> You can use any regular expression you would like. The examples above use `(*.)` which equates to any character.

### [Watch Element wrappers](#watch-element-wrappers)
Each `{{#watch}}` block gets wrapped by default in a `<span>` tag with attributes marking what outlet this represents. Sometimes this can get in the way of styling your layouts.

As a solution you can add a tag, class id, any attribute you want to the watch block.

> Remember, Handlebars helper arguments must have the params before `key="value"` arguments `{{#watch "name.first" tag="h1" }}`

{{ example for-docs/watcher-tag.js }}

### [Watching Arrays](#watching-arrays)
`{{#watch}}` can be used on an `Array` as well. But if one item in the Array changes, you don't want to re-render the entire block. That could have performance implications. Instead, ReBars will only update changed items in the block if every element has a [reference](#the-ref-helper)

> By using the ref helper `{{ ref "somethingUnique" }}` on each item, it enables ReBars to only re-render the changed items. _Each ref must be unique_ such as a pKey from the database or such.

```html
<ul>
  {{#watch "friends(*.)" }}
    {{#each friends as | friend | }}
      <li {{ ref friend.name }}>
        {{ friend.name }} likes to {{ friend.hobby }}
      </li>
    {{/each}}
  {{/watch}}
</ul>
```

## [The on helper](#the-on-helper)
This allows you to bind your component's methods to events in your template.

```html
<button {{ on click="save" }}>Save</button>
```

```javascript
methods: {
  save({ event }, arg1, arg1) {
    console.log(arg1, arg1);
    // param1 param2
  }
}
```

> You method, when invoked, the first argument will always be the event, followed by any additional parameters. Parameters must be primitive and not full Objects or Arrays.

- the first parameter is the methodName separated by `:eventType`, if none is specified `click` will be the event
- you can add as many other parameters as you would like to your method call
