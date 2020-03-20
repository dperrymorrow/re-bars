import Nav from "./nav.js";
import Application from "./pages/application.js";

export default {
  template: /*html*/ `
  <div>
    {{#watch "currentHash" tag="main" }}
      {{ component "nav" tag="div" class="nav" currentHash=currentHash }}
      <section>
        {{#if (isComponent mainComponent) }}
          {{ component mainComponent }}
        {{else}}
          404
        {{/if}}
      </section>
    {{/watch}}
  </div>
  `,

  name: "DocsApp",
  components: [Nav, Application],

  hooks: {
    created() {
      if (window.location.hash) this.$methods.hashChange();
      window.addEventListener("hashchange", () => {
        this.$methods.hashChange();
      });
    },
  },

  data() {
    return {
      currentHash: "application",
      mainComponent: "application",
      subComponent: null,
    };
  },

  methods: {
    hashChange() {
      this.currentHash = window.location.hash.replace("#", "");
      this.mainComponent = this.currentHash.split("/")[0];
      this.subComponent = this.currentHash.split("/")[1];
    },
  },
};
