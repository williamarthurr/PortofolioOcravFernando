const menuToggle = document.querySelector(".menu-toggle");
const navigationLinks = document.querySelector(".navigation-links");
const navigationItems = document.querySelectorAll(".navigation-link");

function closeMenu() {
  navigationLinks.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute(
    "aria-label",
    document.documentElement.lang === "id" ? "Buka navigasi" : "Open navigation",
  );
}

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute(
    "aria-label",
    document.documentElement.lang === "id"
      ? isExpanded ? "Buka navigasi" : "Tutup navigasi"
      : isExpanded ? "Open navigation" : "Close navigation",
  );
  navigationLinks.classList.toggle("is-open", !isExpanded);
});

navigationItems.forEach((item) => {
  item.addEventListener("click", () => {
    navigationItems.forEach((link) => link.classList.remove("is-active"));
    item.classList.add("is-active");
    closeMenu();
  });
});

const sections = document.querySelectorAll("main section[id]");
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const activeLink = document.querySelector(
        `.navigation-link[href="#${entry.target.id}"]`,
      );
      if (!activeLink) return;
      navigationItems.forEach((link) => link.classList.remove("is-active"));
      activeLink.classList.add("is-active");
    });
  },
  { rootMargin: "-35% 0px -55% 0px" },
);

sections.forEach((section) => sectionObserver.observe(section));
