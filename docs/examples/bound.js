export default {
  template: /*html*/ `
    <div>
      {{#watch}}
        <h2>{{ title }}</h2>
        <input type="text" {{ bound "title" ref="title1" }}>
        <input type="text" {{ bound "title" ref="title2" }}>
      {{/watch}}
    </div>
  `,
  name: "bound",
  data() {
    return { title: "Hi, I am bound" };
  },
};
