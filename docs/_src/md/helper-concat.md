## The Concat Helper

Sometimes you need to piece together something that is a combination of a dynamic value, and a static. Thats where this simple little helper comes in handy.

In this example we are looking to not re-render the entire Array on change of any of it's items. So we use the concat helper as a [sub expression](https://handlebarsjs.com/guide/expressions.html#subexpressions)

> Notice the `()` around the sub expression. You will get a syntax error without them!

```handlebars
{{#watch "todos.length" tag="ul"}}
  {{#each todos as | todo | }}
    {{#watch (concat "todos." @index "(.*)") tag="li" }}
      {{ todo.name }}
    {{/watch}}
  {{/each}}
{{/watch}}
```

The above results in the equivalent of

```handlebars
{{#watch "todos.1(.*)" }}
```
