## The Key Helper

This simple little helper marks individual items with a unique identifier you provide. The main use for this is when you have a `{{#watch}}` around an Array in your data.

```handlebars
{{#watch "friends" }}
  <ul>
    {{#each friends as |friend| }}
      <li>{{ friend.name }}</li>
    {{/each}}
  </ul>
{{/watch}}
```

```javascript
{
  data: {
    friends: [
      { id: 1, name: "Fred" },
      { id: 2, name: "Mike" },
    ]
  }
}
```

In the above example, on each change of any item in your todos, the entire UL block would re-render. This is not ideal, and ReBars is smart enough to determine which elements need changed.

Alternativly:

```handlebars
{{#watch "friends" }}
  <ul>
    {{#each friends as |friend| }}
      <li {{ key friend.id }}>{{ friend.name }}</li>
    {{/each}}
  </ul>
{{/watch}}
```

Now when the Array friends is updated, ReBars will have a unique identifier to compare which items have changed and only update those items.

> Allthough it may work initially, using [@index](https://handlebarsjs.com/api-reference/data-variables.html#index) as your key value is not encouraged. Should you sort or reasign your Array, those indexes will no longer be a valid identifier for that item in the Array.
