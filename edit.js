const postForm = document.querySelector("#post-form");
const linkForm = document.querySelector("#link-form");
const postTitle = document.querySelector("#post-title");
const category = document.querySelector("#category");
const postDate = document.querySelector("#post-date");
const postBody = document.querySelector("#post-body");
const postLinks = document.querySelector("#post-links");
const photoInput = document.querySelector("#post-photos");
const photoList = document.querySelector("#photo-list");
const photoCount = document.querySelector("#photo-count");
const linkLabel = document.querySelector("#link-label");
const linkUrl = document.querySelector("#link-url");
const postHeading = document.querySelector("#post-heading");
const linkHeading = document.querySelector("#link-heading");
const postResult = document.querySelector("#post-result");
const linkResult = document.querySelector("#link-result");
let editingPost = null;
let editingLink = null;
let photos = [];
let photoUrls = [];

function status(target, message, failed = false) {
  target.textContent = message;
  target.classList.toggle("error", failed);
}

function addLinkField(link = {}) {
  const row = document.querySelector("#link-input").content.firstElementChild.cloneNode(true);
  row.querySelector(".related-label").value = link.label || "";
  row.querySelector(".related-url").value = link.url || "";
  row.querySelector("button").addEventListener("click", () => row.remove());
  postLinks.append(row);
  return row;
}

function renderPhotos() {
  photoCount.textContent = photos.length ? photos.length + "枚を追加" : "複数選択できます";
  photoUrls.forEach(url => URL.revokeObjectURL(url));
  photoUrls = [];
  photoList.replaceChildren(...photos.map((photo, index) => {
    const frame = document.createElement("figure");
    const image = document.createElement("img");
    const url = URL.createObjectURL(photo);
    photoUrls.push(url);
    image.src = url;
    image.alt = "選んだ写真 " + (index + 1);
    const remove = textElement("button", "写真を外す", "secondary");
    remove.type = "button";
    remove.addEventListener("click", () => {
      photos.splice(index, 1);
      renderPhotos();
    });
    frame.append(image, remove);
    return frame;
  }));
}

async function compressPhoto(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1500 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(Error("写真を読み込めませんでした。")), "image/webp", 0.80);
    });
  } finally {
    bitmap.close();
  }
}

photoInput.addEventListener("change", async () => {
  const selected = Array.from(photoInput.files);
  const selectedFor = photos;
  const submit = postForm.querySelector('[type="submit"]');
  photoInput.disabled = true;
  submit.disabled = true;
  try {
    let failed = 0;
    for (const [index, file] of selected.entries()) {
      status(postResult, "写真を準備中（" + (index + 1) + " / " + selected.length + "）");
      try {
        const photo = await compressPhoto(file);
        if (photos !== selectedFor) return;
        photos.push(photo);
      } catch {
        if (photos !== selectedFor) return;
        failed += 1;
      }
    }
    status(postResult, failed ? failed + "枚を読み込めませんでした。JPEGやPNGをお試しください。" : "", !!failed);
    renderPhotos();
  } finally {
    photoInput.value = "";
    photoInput.disabled = false;
    submit.disabled = false;
  }
});

function loadPost(post) {
  editingPost = post || null;
  postForm.reset();
  postHeading.textContent = post ? "記事を編集" : "記事を追加";
  category.value = post?.category || "お知らせ";
  postTitle.value = post?.title || "";
  postDate.value = post?.date || new Date().toLocaleDateString("sv-SE");
  postBody.value = post?.body || "";
  photos = [...(post?.photos || [])];
  renderPhotos();
  postLinks.replaceChildren();
  (post?.links || []).forEach(addLinkField);
  status(postResult, "");
}

function loadLink(link) {
  editingLink = link || null;
  linkForm.reset();
  linkHeading.textContent = link ? "関連リンクを編集" : "関連リンクを追加";
  linkLabel.value = link?.label || "";
  linkUrl.value = link?.url || "";
  status(linkResult, "");
}

function getPostLinks() {
  return Array.from(postLinks.children).flatMap(row => {
    const name = row.querySelector(".related-label").value.trim();
    const url = row.querySelector(".related-url").value.trim();
    if (!name && !url) return [];
    if (!name || !url) throw Error("各リンクに表示名とURLを入力してください。");
    return [{ label: name, url: webAddress(url) }];
  });
}

async function manageList(name, resultTarget, populateForm) {
  const list = document.querySelector(name === "posts" ? "#saved-posts" : "#saved-links");
  const items = await records(name, "getAll");
  list.replaceChildren(...items.map(item => {
    const row = document.createElement("div");
    row.className = "saved-row";
    const title = item.title || item.label;
    const edit = textElement("button", "編集", "secondary");
    edit.type = "button";
    edit.addEventListener("click", () => {
      populateForm(item);
      (name === "posts" ? postTitle : linkLabel).focus();
    });
    const remove = textElement("button", "削除", "secondary");
    remove.type = "button";
    remove.addEventListener("click", async () => {
      if (!confirm("「" + title + "」を削除しますか？")) return;
      try {
        await records(name, "delete", item.id);
        if (name === "posts" && editingPost?.id === item.id) loadPost();
        if (name === "links" && editingLink?.id === item.id) loadLink();
        await manageList(name, resultTarget, populateForm);
        status(resultTarget, "削除しました。");
      } catch {
        status(resultTarget, "削除できませんでした。", true);
      }
    });
    row.append(textElement("strong", title), edit, remove);
    return row;
  }));
  if (!items.length) list.append(textElement("p", "追加した項目はここに表示されます。", "edit-hint"));
}

postForm.addEventListener("submit", async event => {
  event.preventDefault();
  const submit = event.submitter;
  submit.disabled = true;
  try {
    const title = postTitle.value.trim();
    if (!title) throw Error("タイトルを入力してください。");
    const post = {
      id: editingPost?.id || crypto.randomUUID(),
      title, category: category.value, date: postDate.value, body: postBody.value.trim(),
      links: getPostLinks(), photos,
    };
    await records("posts", "put", post);
    loadPost();
    await manageList("posts", postResult, loadPost);
    status(postResult, "保存しました。「サイトを見る」で確認できます。");
  } catch (error) {
    status(postResult, error.name === "QuotaExceededError" ? "空き容量が足りません。写真を減らして再度お試しください。" : error.message || "保存できませんでした。", true);
  } finally {
    submit.disabled = false;
  }
});

linkForm.addEventListener("submit", async event => {
  event.preventDefault();
  const submit = event.submitter;
  submit.disabled = true;
  try {
    const label = linkLabel.value.trim();
    if (!label) throw Error("表示名を入力してください。");
    await records("links", "put", { id: editingLink?.id || crypto.randomUUID(), label, url: webAddress(linkUrl.value.trim()) });
    loadLink();
    await manageList("links", linkResult, loadLink);
    status(linkResult, "保存しました。「サイトを見る」で確認できます。");
  } catch (error) {
    status(linkResult, error.message || "保存できませんでした。", true);
  } finally {
    submit.disabled = false;
  }
});

const postMode = document.querySelector("#post-mode");
const linkMode = document.querySelector("#link-mode");
function switchMode(isPost) {
  postMode.setAttribute("aria-pressed", String(isPost));
  linkMode.setAttribute("aria-pressed", String(!isPost));
  postForm.hidden = document.querySelector("#post-management").hidden = !isPost;
  linkForm.hidden = document.querySelector("#link-management").hidden = isPost;
}

postMode.addEventListener("click", () => switchMode(true));
linkMode.addEventListener("click", () => switchMode(false));
document.querySelector("#add-post-link").addEventListener("click", () => addLinkField().querySelector("input").focus());
document.querySelector("#reset-post").addEventListener("click", () => loadPost());
document.querySelector("#reset-link").addEventListener("click", () => loadLink());
loadPost();
loadLink();
manageList("posts", postResult, loadPost).catch(() => status(postResult, "このブラウザでは保存を開けません。", true));
manageList("links", linkResult, loadLink).catch(() => status(linkResult, "このブラウザでは保存を開けません。", true));
