export default {
  async wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  },
};
