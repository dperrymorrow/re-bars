export default {
  template: /*html*/ `
    <nav class="docs main-nav">
      <ul class="nav">
        {{#each pages as |page| }}
          <li>
            <a class="{{ active page.path }}" href="#{{ page.path }}">{{ page.label }}</a>
            {{#if page.pages }}
              <ul>
                {{#each page.pages as |subPage| }}
                  <li>
                    <a class="{{ active subPage.path }}" href="#{{ subPage.path }}">{{ subPage.label }}</a>
                  </li>
                {{/each}}
              </ul>
            {{/if}}
          </li>
        {{/each}}
      </ul>
    </nav>
  `,

  name: "nav",

  helpers: {
    active: (val, { data }) => (data.root.$props.currentHash.startsWith(val) ? "active" : ""),
  },

  data() {
    return {
      pages: [
        {
          label: "A ReBars Application",
          path: "application",
        },
        {
          label: "A ReBars Component",
          path: "components",
          pages: [
            { label: "Template", path: "components/template" },
            { label: "Name", path: "components/name" },
            { label: "Date", path: "components/data" },
            { label: "Methods", path: "components/methods" },
          ],
        },
        {
          label: "ReBars Helpers",
          path: "helpers",
          pages: [
            { label: "watch", path: "helpers/the-watch-helper" },
            { label: "ref", path: "helpers/the-ref-helper" },
            { label: "bound", path: "helpers/bound" },
            { label: "method", path: "helpers/method" },
            { label: "component", path: "helpers/component" },
            { label: "debug", path: "helpers/debug" },
          ],
        },
      ],
    };
  },
};
