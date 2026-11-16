const newsList = document.querySelector("#news-list");
const filters = [...document.querySelectorAll("[data-filter]")];
const article = document.querySelector("#article");
const articlePhotos = document.querySelector("#article-photos");
let posts = starterPosts;
let activeFilter = "すべて";
let photoUrls = [];

function showArticle(post) {
  document.querySelector("#article-meta").textContent = post.date.replaceAll("-", ".") + "  /  " + post.category;
  document.querySelector("#article-title").textContent = post.title;
  document.querySelector("#article-body").textContent = post.body;
  const images = (post.photos || []).map((photo, index) => {
    const image = document.createElement("img");
    const url = URL.createObjectURL(photo);
    photoUrls.push(url);
    image.src = url;
    image.alt = post.title + "の写真 " + (index + 1);
    return image;
  });
  articlePhotos.replaceChildren(...images);
  document.querySelector("#article-links").replaceChildren(...post.links.map(externalLink));
  article.showModal();
  article.scrollTop = 0;
}

article.addEventListener("close", () => {
  photoUrls.forEach(url => URL.revokeObjectURL(url));
  photoUrls = [];
  articlePhotos.replaceChildren();
});

function renderNews() {
  const visible = activeFilter === "すべて" ? posts : posts.filter(post => post.category === activeFilter);
  if (!visible.length) {
    newsList.replaceChildren(textElement("p", "掲載中のお知らせはありません。", "empty"));
    return;
  }
  newsList.replaceChildren(...visible.map((post, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "news-item";
    button.style.setProperty("--row-delay", Math.min(index, 6) * 32 + "ms");
    button.setAttribute("aria-haspopup", "dialog");
    const date = textElement("time", post.date.replaceAll("-", "."));
    date.dateTime = post.date;
    const arrow = textElement("span", "↗", "arrow");
    arrow.setAttribute("aria-hidden", "true");
    button.append(date, textElement("span", post.category, "category"), textElement("strong", post.title), arrow);
    button.addEventListener("click", () => showArticle(post));
    return button;
  }));
}

for (const button of filters) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filters.forEach(filter => filter.setAttribute("aria-pressed", String(filter === button)));
    renderNews();
  });
}

async function renderSite() {
  const [customPosts, customLinks] = await Promise.all([
    records("posts", "getAll").catch(() => []),
    records("links", "getAll").catch(() => []),
  ]);
  posts = [...customPosts, ...starterPosts].sort((a, b) => b.date.localeCompare(a.date));
  renderNews();
  document.querySelector("#site-links")?.replaceChildren(...[...starterLinks, ...customLinks].map(externalLink));
}
renderSite();
addEventListener("pageshow", event => { if (event.persisted) renderSite(); });
