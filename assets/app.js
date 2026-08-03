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
