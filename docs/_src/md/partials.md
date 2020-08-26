## Partials

The partials object in a ReBars app _(or partial)_ is simply a way to use Handlebars built in [partials](https://handlebarsjs.com/guide/partials.html) functionality in a ReBars application.

This lets you break up your application into pieces. They are not isolated components however.

> Any helpers, methods, and data will be merged into your application and available everywhere. For this reason ReBars will warn you if there are any naming collisions between partials / main application.

Using native import works great for splitting up your application into seperate files.

```javascript
// person.js
export default {
  template: /*html*/ `
    <ul>
      </li>{{ fullName }}</li>
      </li>{{ person.profession }}</li>
    </ul>
  `,

  helpers: {
    fullName() {
      return `${this.person.firstName} ${this.person.lastName}`;
    }
  }
}
```

```javascript
// app.js
import Person from "./person.js";

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
    Person
  }
}
```
