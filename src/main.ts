import "@fontsource/noto-sans-javanese/400.css";
import "@fontsource/noto-sans-javanese/700.css";
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";
import "@fontsource-variable/nunito-sans";
import "./gaya.css";
import { CARAKAN, CONTOH, PANGKON, type Pilihan, keJawa, keJawaRinci, keLatin } from "./aksara";

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const $$ = <T extends Element = HTMLElement>(s: string) => [...document.querySelectorAll<T>(s)];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/* ---------- keadaan ---------- */
const hash = new URLSearchParams(location.hash.slice(1));
const pilihan: Pilihan = { e: hash.get("e") === "é" ? "é" : "ê", tanpaSpasi: hash.get("spasi") !== "1" };
const masuk = $<HTMLInputElement>("#latin");
masuk.value = hash.get("t") ?? "Hanacaraka";

function simpanHash() {
  const p = new URLSearchParams({ t: masuk.value });
  if (pilihan.e === "é") p.set("e", "é");
  if (!pilihan.tanpaSpasi) p.set("spasi", "1");
  history.replaceState(null, "", `#${p}`);
}

/* ---------- alih aksara ---------- */
function perbarui() {
  const teks = masuk.value;
  const segmen = keJawaRinci(teks, pilihan);
  const jawa = segmen.map((s) => s.jawa).join("");
  const kotak = $("[data-jawa]");
  kotak.textContent = jawa || "ꦲꦏ꧀ꦱꦫ";
  kotak.classList.toggle("kosong", !jawa);
  // Ukuran huruf mengecil untuk teks panjang supaya tetap muat.
  const n = [...jawa].length;
  kotak.style.setProperty("--ukuran", `${n > 60 ? 0.42 : n > 30 ? 0.6 : n > 14 ? 0.8 : 1}`);
  $("[data-rinci]").innerHTML = segmen
    .filter((s) => s.jawa.trim())
    .map(
      (s) => `<li><span class="rinci-jawa jawa" lang="jv-Java">${esc(s.jawa)}</span><span class="rinci-latin">${esc(s.latin)}</span><span class="rinci-catatan">${esc(s.catatan.join("; "))}</span></li>`,
    )
    .join("");
  $$<HTMLButtonElement>("[data-e]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.e === pilihan.e)));
  $<HTMLInputElement>("#spasi").checked = !pilihan.tanpaSpasi;
  simpanHash();
}

masuk.addEventListener("input", perbarui);
$$<HTMLButtonElement>("[data-e]").forEach((b) =>
  b.addEventListener("click", () => {
    pilihan.e = b.dataset.e as Pilihan["e"];
    perbarui();
  }),
);
$<HTMLInputElement>("#spasi").addEventListener("change", (e) => {
  pilihan.tanpaSpasi = !(e.target as HTMLInputElement).checked;
  perbarui();
});
$("[data-contoh]").innerHTML = CONTOH.map((c) => `<button type="button" data-isi="${esc(c)}">${esc(c)}</button>`).join("");
$("[data-contoh]").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("[data-isi]");
  if (!b) return;
  masuk.value = b.dataset.isi!;
  perbarui();
});

async function sementara(tombol: HTMLButtonElement, teks: string) {
  const asal = tombol.textContent;
  tombol.textContent = teks;
  setTimeout(() => (tombol.textContent = asal), 1800);
}

$("#salin").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(keJawa(masuk.value, pilihan));
    sementara($<HTMLButtonElement>("#salin"), "Tersalin");
  } catch {
    sementara($<HTMLButtonElement>("#salin"), "Gagal menyalin");
  }
});

/** Kartu gambar 1200×630 untuk dibagikan: aksara besar, teks Latin, dan alamat situs. */
$("#unduh").addEventListener("click", async () => {
  const jawa = keJawa(masuk.value, pilihan);
  if (!jawa) return;
  await document.fonts.load('700 120px "Noto Sans Javanese"', jawa);
  await document.fonts.load('700 44px "Kalam"');
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 630;
  const g = c.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  // Selembar buku tulis: garis biru tiap 42 px dan margin merah di kiri.
  g.fillStyle = v("--kertas");
  g.fillRect(0, 0, 1200, 630);
  g.fillStyle = v("--garis");
  for (let y = 41; y < 630; y += 42) g.fillRect(0, y, 1200, 2);
  g.fillStyle = v("--margin");
  g.fillRect(96, 0, 3, 630);
  g.fillStyle = v("--tinta");
  g.textAlign = "center";
  g.textBaseline = "middle";
  let ukuran = 150;
  g.font = `700 ${ukuran}px "Noto Sans Javanese"`;
  while (g.measureText(jawa).width > 1000 && ukuran > 40) {
    ukuran -= 6;
    g.font = `700 ${ukuran}px "Noto Sans Javanese"`;
  }
  g.fillText(jawa, 648, 270);
  g.font = '700 46px "Kalam", cursive';
  g.fillStyle = v("--aksen");
  g.fillText(masuk.value.trim(), 648, 470);
  g.font = '400 24px "Kalam", cursive';
  g.fillStyle = v("--samar");
  g.fillText("aksara.raffstw.my.id", 648, 578);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `aksara-${masuk.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "jawa"}.png`;
  a.click();
});

/* ---------- carakan & sandhangan ---------- */
const BARIS = [
  { arti: "Ada utusan", latin: "Hana caraka" },
  { arti: "Saling bertengkar", latin: "Data sawala" },
  { arti: "Sama-sama sakti", latin: "Padha jayanya" },
  { arti: "Inilah mayat mereka", latin: "Maga bathanga" },
];
$("[data-carakan]").innerHTML = BARIS.map(
  (b, r) => `<div class="baris-carakan">
    <div class="baris-arti"><strong>${b.latin}</strong><span>${b.arti}</span></div>
    <ol>${CARAKAN.slice(r * 5, r * 5 + 5)
      .map(
        (c) => `<li><span class="besar jawa" lang="jv-Java">${c.jawa}</span><span class="nama">${c.latin}</span><span class="pasangan jawa" lang="jv-Java" title="pasangan ${c.latin}">ꦲ${PANGKON}${c.jawa}</span></li>`,
      )
      .join("")}</ol>
  </div>`,
).join("");

const SANDHANGAN_CONTOH: [string, string][] = [
  ["ki", "wulu"],
  ["ku", "suku"],
  ["ké", "taling"],
  ["ko", "taling tarung"],
  ["kê", "pepet"],
  ["kah", "wignyan"],
  ["kar", "layar"],
  ["kang", "cecak"],
  ["kra", "cakra"],
  ["krê", "keret"],
  ["kya", "pengkal"],
  ["k", "pangkon"],
];
$("[data-sandhangan]").innerHTML = SANDHANGAN_CONTOH.map(
  ([l, nama]) => `<figure><span class="jawa" lang="jv-Java">${keJawa(l)}</span><figcaption><strong>${l}</strong>${nama}</figcaption></figure>`,
).join("");

/* ---------- baca ---------- */
const kotakBaca = $<HTMLTextAreaElement>("#jawa-masuk");
kotakBaca.value = keJawa("sugêng rawuh ing aksara jawa");
const baca = () => ($("[data-baca]").textContent = keLatin(kotakBaca.value) || "…");
kotakBaca.addEventListener("input", baca);
baca();

/* ---------- kuis ---------- */
const VOKAL = ["a", "i", "u", "é", "ê", "o"] as const;
let deret = 0;
let terbaik = 0;
try {
  terbaik = Number(localStorage.getItem("aksara:terbaik")) || 0;
} catch {
  /* penyimpanan tidak tersedia */
}
const acak = <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const suku = (k: string, v: string) => k.slice(0, -1) + v;

function soalBaru() {
  const k = acak(CARAKAN).latin;
  const v = acak(VOKAL);
  const benar = suku(k, v);
  const pilih = new Set([benar]);
  while (pilih.size < 4) pilih.add(Math.random() < 0.5 ? suku(acak(CARAKAN).latin, v) : suku(k, acak(VOKAL)));
  const opsi = [...pilih].sort(() => Math.random() - 0.5);
  $("[data-soal]").textContent = keJawa(benar);
  $("[data-jawab]").innerHTML = opsi.map((o) => `<button type="button" data-o="${o}">${o}</button>`).join("");
  $("[data-jawab]").dataset.benar = benar;
}

$("[data-jawab]").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-o]");
  const wadah = $("[data-jawab]");
  if (!b || wadah.dataset.selesai) return;
  const benar = wadah.dataset.benar!;
  wadah.dataset.selesai = "1";
  $$<HTMLButtonElement>("[data-o]").forEach((x) => x.classList.add(x.dataset.o === benar ? "benar" : x === b ? "salah" : "redup"));
  if (b.dataset.o === benar) {
    deret++;
    if (deret > terbaik) {
      terbaik = deret;
      try {
        localStorage.setItem("aksara:terbaik", String(terbaik));
      } catch {
        /* abaikan */
      }
    }
  } else deret = 0;
  $("[data-skor]").textContent = `Benar beruntun ${deret} · rekor ${terbaik}`;
  setTimeout(() => {
    delete wadah.dataset.selesai;
    soalBaru();
  }, 900);
});

/* ---------- mulai ---------- */
perbarui();
soalBaru();
$("[data-skor]").textContent = `Benar beruntun 0 · rekor ${terbaik}`;
