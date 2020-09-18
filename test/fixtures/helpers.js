export default {
  data() {
    return {
      name: {
        first: "Dave",
        last: "Morrow",
      },
      friends: [
        { id: 1, hobby: "photography", name: "Frank" },
        { id: 2, hobby: "biking", name: "Eric" },
        { id: 3, hobby: "building", name: "Matt" },
        { id: 4, hobby: "camping", name: "Tod" },
        { id: 5, hobby: "hiking", name: "Keith" },
      ],
      show: false,
      previousName: {},
    };
  },

  trace: false,

  methods: {
    changeName({ methods }, first, last) {
      methods.storePrev();
      this.name.first = first;
      this.name.last = last;
    },

    storePrev() {
      this.previousName.first = this.name.first;
      this.previousName.last = this.name.last;
    },

    restoreName() {
      this.name.first = this.previousName.first;
      this.name.last = this.previousName.last;
    },
  },

  hooks: {
    beforeRender({ methods }) {
      methods.storePrev();
    },
  },
};
