export default {
  template: /*html*/ `
  <div>
    {{#markdown}}
      A ReBars application is a collection of components rendered to a DOM element. You can have more than one app on a page if you desire.

      > You will need Handlebars in order to use ReBars. You can install it from NPM or use a CDN.

      ~~~ html
      <div id="demo-app"></div>
      <script src="//cdnjs.cloudflare.com/ajax/libs/handlebars.js/4.5.3/handlebars.min.js"></script>

      <script type="module">
        import ReBars from "re-bars";
        import RootComponent from "./app.js";

        ReBars.app({
          $el: document.getElementById("demo-app"),
          root: RootComponent,
        });
      </script>
      ~~~

      To start and app, there is minimal code on the page. You create a new ReBars app with an Object containing two keys.

      - ^$el^ the Element that your app will be rendered into
      - ^root^ to top level component in your app.
    {{/markdown}}
  </div>
`,

  name: "application",
};
