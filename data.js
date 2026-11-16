const originalSite = "https://shinobukai2019.amebaownd.com";
const starterPosts = [
  {
    id: "cup-2026", category: "大会結果", date: "2026-09-10", title: "2026 忍杯 全関東空手道選手権大会",
    body: "2026年の忍杯の開催報告です。道場ブログに当日の写真と映像が掲載されています。",
    links: [{ label: "開催報告・当日の写真と映像", url: "https://ameblo.jp/hytoo0218/entry-12978307433.html" }],
  },
  {
    id: "cup-result", category: "大会結果", date: "2024-09-11", title: "2024 忍杯の大会結果",
    body: "忍杯の大会結果は、道場の元記事でご確認いただけます。",
    links: [{ label: "大会結果の元記事", url: originalSite + "/posts/55233350" }],
  },
  {
    id: "cup-rounds", category: "大会案内", date: "2024-08-23", title: "2024 忍杯トーナメント",
    body: "2024年大会の組み合わせを掲載した過去のお知らせです。",
    links: [{ label: "トーナメントの元記事", url: originalSite + "/posts/55069620" }],
  },
  {
    id: "cup-call", category: "大会案内", date: "2024-06-19", title: "2024 忍杯 全関東空手道選手権大会",
    body: "2024年大会の開催案内と申込資料です。",
    links: [
      { label: "大会案内の元記事", url: originalSite + "/posts/54170167" },
      { label: "2024年の申込案内", url: "https://drive.google.com/file/d/1otKucgr85K2UAsoBMpe8YyzLePgbdUbg/view" },
      { label: "2024年の申込書", url: "https://drive.google.com/file/d/1cGQievI5gBNyrdVbEfD13UUs83dcB3_p/view" },
    ],
  },
  {
    id: "personal", category: "お知らせ", date: "2023-07-04", title: "パーソナルレッスンの案内",
    body: "申込みや現在の受付状況は道場へお問い合わせください。",
    links: [{ label: "道場の案内を見る", url: originalSite + "/posts/45507499" }],
  },
];
const starterLinks = [
  { label: "ふじみ野本部・上福岡教室の稽古日", url: originalSite + "/pages/2640041/gallery" },
  { label: "稽古スケジュール", url: "https://calendar.google.com/calendar/embed?src=shinobukairevive%40gmail.com&ctz=Asia%2FTokyo" },
  { label: "道場の活動ブログ", url: "https://ameblo.jp/hytoo0218" },
  { label: "現行サイトの記事一覧", url: originalSite + "/" },
];

function openStorage() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("shinokai-site-preview", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("posts", { keyPath: "id" });
      request.result.createObjectStore("links", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error("別のタブを閉じてからお試しください。"));
  });
}

async function records(name, method, value) {
  const db = await openStorage();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(name, method === "getAll" ? "readonly" : "readwrite");
      const store = tx.objectStore(name);
      const request = value === undefined ? store[method]() : store[method](value);
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error || request.error);
      tx.onerror = () => reject(tx.error || request.error);
    });
  } finally {
    db.close();
  }
}

function webAddress(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw Error("URLを https:// から入力してください。");
  }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw Error("リンクには通常のWebサイトのURLを入力してください。");
  }
  return url.href;
}

function textElement(tag, value, className) {
  const node = document.createElement(tag);
  node.textContent = value;
  if (className) node.className = className;
  return node;
}

function externalLink(item) {
  const anchor = textElement("a", item.label + " ↗");
  anchor.href = webAddress(item.url);
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  return anchor;
}
