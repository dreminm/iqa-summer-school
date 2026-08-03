const pageKey = document.body.dataset.page || "site";

document.querySelectorAll("[data-checklist]").forEach((list, listIndex) => {
  const boxes = [...list.querySelectorAll('input[type="checkbox"]')];
  const progress = list.parentElement.querySelector("[data-progress]");
  const progressCopy = list.parentElement.querySelector("[data-progress-copy]");

  boxes.forEach((box, boxIndex) => {
    const key = `iqa-school:${pageKey}:${listIndex}:${boxIndex}`;
    box.checked = localStorage.getItem(key) === "1";
    box.addEventListener("change", () => {
      localStorage.setItem(key, box.checked ? "1" : "0");
      update();
    });
  });

  function update() {
    const done = boxes.filter(box => box.checked).length;
    const percent = boxes.length ? Math.round(done / boxes.length * 100) : 0;
    if (progress) progress.style.width = `${percent}%`;
    if (progressCopy) progressCopy.textContent = `${done} из ${boxes.length} готово`;
  }

  update();
});

const filter = document.querySelector("[data-resource-filter]");
if (filter) {
  const items = [...document.querySelectorAll("[data-resource]")];
  filter.addEventListener("input", () => {
    const query = filter.value.trim().toLowerCase();
    items.forEach(item => {
      item.hidden = query && !item.textContent.toLowerCase().includes(query);
    });
  });
}

const tocLinks = [...document.querySelectorAll('.project-toc a[href^="#"]')];
if (tocLinks.length && "IntersectionObserver" in window) {
  const sections = tocLinks
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const setCurrent = id => {
    tocLinks.forEach(link => {
      const active = link.getAttribute("href") === `#${id}`;
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setCurrent(visible.target.id);
  }, { rootMargin: "-24% 0px -64%", threshold: [0, .1, .4] });

  sections.forEach(section => observer.observe(section));
}
