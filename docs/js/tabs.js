export default {
  init() {
    document.querySelectorAll("nav.tabs button").forEach($el => {
      const $tabs = $el.parentElement.querySelectorAll("*");
      const $containers = $el.parentElement.parentElement.querySelectorAll(".tab-content *");

      $el.addEventListener("click", event => {
        event.preventDefault();

        $tabs.forEach($tab => $tab.classList.remove("active"));
        $containers.forEach($content => $content.classList.remove("active"));

        $el.classList.add("active");
        document.getElementById($el.dataset.target).classList.add("active");
      });
    });
  },
};
