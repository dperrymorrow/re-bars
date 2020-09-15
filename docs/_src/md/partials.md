## Partials

The partials object in a ReBars app is simply a way to use Handlebars built in [partials](https://handlebarsjs.com/guide/partials.html) functionality in a ReBars application.

This lets you break up your templates into pieces.


> This is another great candidate for using `ReBars.load` to have separate files for your partials.

```handlebars
<!-- person.hbs -->
<ul>
  </li>{{ fullName }}</li>
  </li>{{ person.profession }}</li>
</ul>
```

```javascript
// app.js
const { ReBars } = window;

export default {
  template: /*html*/ `
    <h1>All the people</h1>
    {{#each people as | person | }}
      {{> Person person=person }}
    {{/each}}
  `,

  data: {
    people: [
      { firstName: "Mike", lastName: "Jones", profession: "Doctor" },
      { firstName: "David", lastName: "Smith", profession: "Programmer" },
    ]
  },

  partials: {
    Person: ReBars.load("./person.hbs")
  }
}
```

This is simply a convenience method giving you access to Handlebar's `registerPartial` method. Just like with helpers, if you would like to work directly with Handlebars, you simply reference the instance passed back after you create your application. See [Handlebars Partials](https://handlebarsjs.com/guide/partials.html) for more info.

```javascript
const app = ReBars.app(...);
app.instance.registerPartial("myPartial", "<h1><{{ name }}</h1>");
```
