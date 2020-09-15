## Template

The template is a String that is your Handlebars template your application will use. It will be rendered with the helpers and data that you include in your application.

It is helpful to use a [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) so that you can have multiple lines in your template String.

```javascript
export default {
  template: /*html*/ `
    <h1>{{ myName }}</h1>
  `,
  data: {
    myName: "Dave"
  }
};
```

### Loading from external files

ReBars includes a function to load your templates from external files. This can be super handy for breaking up your application, or in working with proper syntax highlighting in your editor of choice.

> ReBars will wait for all templates to resolve before mounting your application. `ReBars.load` can also be used for loading [partials](#partials) as external files.

```handlebars
<!-- template.hbs -->
<h1>{{ myName }}</h1>
```

```javascript
const { ReBars } = window;

export default {
  template: ReBars.load("./template.hbs"),
  data: {
    myName: "Dave"
  }
};
```
