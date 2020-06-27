




# ReBars built in helpers

ReBars comes with a few very powerful helpers. Of course you can add your own to any component, or at the application level just as you would with any Handlebars application.


## The {{#watch}} helper

The watch helper tells ReBars to re-render this block on change of the item you pass in as the second parameter.

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

Watch allows you to re-render a block of your template on change.
Watch takes an argument of what property to watch. The argument can be a string or an object.

```html
{{#watch name }}
  My name is {{ name.first }} {{ name.last }}.
{{/watch}}
```

Anytime `name` is changed the block would be re-rendered with the updated data.

> If the item you are watching is a primitive such as a `String`, or `Number`. You will need to use a string as the argument.

- `{{#watch name }}` this will watch all keys on Object `name`
- `{{#watch "name(*.)" }}` this is the string equivalent of the above
- `{{#watch "name.first" }}` will only watch for changes to `name.first`
- `{{#watch "name(*.)" "friends.(*.).hobby" }}` will watch for any change to name or hobby
- `{{#watch "friends(*.)hobby" }}` will watch for any friend index hobby change

### Watch Element wrappers
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

> Be sure to use the ref helper `{{ ref "somethingUnique" }}` on each item enabling ReBars to only re-render changed items. _Each ref must be unique_

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

## The {{on}} helper
This allows you to bind your component's methods to events in your template.

```html
<button {{ on click="save" "param1" "param2" }}>Save</button>
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

----
