/**
 * Alih aksara Latin ⇄ aksara Jawa (Unicode blok Javanese, U+A980–U+A9DF).
 *
 * Arah Latin → Jawa mengikuti kaidah umum penulisan modern:
 * - setiap konsonan membawa vokal a; vokal lain ditulis dengan sandhangan (wulu, suku, taling, taling tarung, pepet);
 * - h, r, dan ng di akhir suku kata ditulis dengan panyigeg (wignyan, layar, cecak);
 * - konsonan mati lain yang diikuti konsonan memakai pasangan (konsonan + pangkon + konsonan; bentuk pasangannya
 *   digambar oleh fon), dan konsonan mati di akhir kalimat memakai pangkon;
 * - konsonan + r memakai cakra (atau keret bila vokalnya ê), konsonan + y memakai pengkal;
 * - rê dan lê di awal suku kata memakai pa cêrêk dan nga lêlêt;
 * - kata yang diawali vokal ditulis dengan ha.
 */

export const PANGKON = "꧀";
const CAKRA = "ꦿ";
const KERET = "ꦽ";
const PENGKAL = "ꦾ";
const WIGNYAN = "ꦃ";
const LAYAR = "ꦂ";
const CECAK = "ꦁ";
const CECAK_TELU = "꦳";
const PA_CEREK = "ꦉ";
const NGA_LELET = "ꦊ";
const PADA_LINGSA = "꧈";
const PADA_LUNGSI = "꧉";

/** Dua puluh aksara carakan, urut "ha na ca ra ka". */
export const CARAKAN: { latin: string; jawa: string }[] = [
  ["ha", "ꦲ"],
  ["na", "ꦤ"],
  ["ca", "ꦕ"],
  ["ra", "ꦫ"],
  ["ka", "ꦏ"],
  ["da", "ꦢ"],
  ["ta", "ꦠ"],
  ["sa", "ꦱ"],
  ["wa", "ꦮ"],
  ["la", "ꦭ"],
  ["pa", "ꦥ"],
  ["dha", "ꦝ"],
  ["ja", "ꦗ"],
  ["ya", "ꦪ"],
  ["nya", "ꦚ"],
  ["ma", "ꦩ"],
  ["ga", "ꦒ"],
  ["ba", "ꦧ"],
  ["tha", "ꦛ"],
  ["nga", "ꦔ"],
].map(([latin, jawa]) => ({ latin, jawa }));

/** Konsonan Latin → aksara dasar. Huruf serapan memakai cecak telu. */
const KONSONAN: Record<string, string> = {
  ...Object.fromEntries(CARAKAN.map((c) => [c.latin.slice(0, -1), c.jawa])),
  f: "ꦥ" + CECAK_TELU,
  v: "ꦮ" + CECAK_TELU,
  z: "ꦗ" + CECAK_TELU,
  kh: "ꦏ" + CECAK_TELU,
  q: "ꦏ",
  x: "ꦏ" + PANGKON + "ꦱ",
};
/** Penanda ha untuk kata berawalan vokal: bukan "h" sungguhan, jadi tidak pernah menjadi wignyan. */
const HA_AWAL = "_ha";
KONSONAN[HA_AWAL] = "ꦲ";

export type Vokal = "a" | "i" | "u" | "é" | "ê" | "o";
const SANDHANGAN: Record<Vokal, string> = {
  a: "",
  i: "ꦶ", // wulu
  u: "ꦸ", // suku
  é: "ꦺ", // taling
  ê: "ꦼ", // pepet
  o: "ꦺꦴ", // taling tarung
};

/** Urutan pencocokan: digraf lebih dulu. */
const DIGRAF = ["ng", "ny", "dh", "th", "kh"];

type Token = { jenis: "K"; k: string } | { jenis: "V"; v: Vokal } | { jenis: "batas" } | { jenis: "tanda"; s: string };

export type Pilihan = {
  /** Cara membaca huruf e polos: "ê" (pepet, seperti "sêkar") atau "é" (taling, seperti "saté"). */
  e: "ê" | "é";
  /** Tanpa spasi seperti penulisan tradisional (scriptio continua). */
  tanpaSpasi: boolean;
};

const DIGIT_JAWA = (d: string) => String.fromCharCode(0xa9d0 + Number(d));

function tokenisasi(teks: string, p: Pilihan): Token[] {
  const t: Token[] = [];
  const s = teks.toLowerCase().normalize("NFC");
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    const dg = DIGRAF.find((d) => s.startsWith(d, i));
    if (dg) {
      t.push({ jenis: "K", k: dg });
      i += 2;
      continue;
    }
    if (/[aiuo]/.test(c)) t.push({ jenis: "V", v: c as Vokal });
    else if (c === "e") t.push({ jenis: "V", v: p.e });
    else if (c === "é" || c === "è") t.push({ jenis: "V", v: "é" });
    else if (c === "ê" || c === "ě") t.push({ jenis: "V", v: "ê" });
    else if (KONSONAN[c]) t.push({ jenis: "K", k: c });
    else if (/\s/.test(c)) t.push({ jenis: "batas" });
    else if (c === ",") t.push({ jenis: "tanda", s: PADA_LINGSA });
    else if (c === "." || c === "!" || c === "?") t.push({ jenis: "tanda", s: PADA_LUNGSI });
    else if (/[0-9]/.test(c)) t.push({ jenis: "tanda", s: DIGIT_JAWA(c) });
    else if (c === "-" || c === "'") {
      /* tanda hubung dan apostrof diabaikan */
    } else t.push({ jenis: "tanda", s: c });
    i++;
  }
  // Vokal di awal kata ditulis dengan ha.
  const hasil: Token[] = [];
  for (const x of t) {
    const sebelum = hasil[hasil.length - 1];
    if (x.jenis === "V" && (!sebelum || sebelum.jenis !== "K")) hasil.push({ jenis: "K", k: HA_AWAL });
    hasil.push(x);
  }
  return hasil;
}

/** Satu potongan hasil, kira-kira satu suku kata, beserta penjelasan cara penulisannya. */
export type Segmen = { jawa: string; latin: string; catatan: string[] };

const NAMA_SANDHANGAN: Record<Vokal, string> = { a: "", i: "wulu (i)", u: "suku (u)", é: "taling (é)", ê: "pepet (ê)", o: "taling tarung (o)" };
const PANYIGEG: Record<string, [string, string]> = { h: [WIGNYAN, "wignyan (h mati)"], r: [LAYAR, "layar (r mati)"], ng: [CECAK, "cecak (ng mati)"] };
const latinK = (k: string) => (k === HA_AWAL ? "" : k);
const namaAksara = (k: string) => (k === HA_AWAL ? "ha" : `${k}a`);

/** Latin → aksara Jawa, dipotong per suku kata dengan penjelasannya. */
export function keJawaRinci(teks: string, pilihan: Partial<Pilihan> = {}): Segmen[] {
  const p: Pilihan = { e: "ê", tanpaSpasi: true, ...pilihan };
  const t = tokenisasi(teks, p);
  const seg: Segmen[] = [];
  let tunda: Segmen | null = null; // konsonan mati yang akan menjadi pasangan bagi suku berikutnya
  let i = 0;
  let sebelumVokal = false; // apakah tepat sebelumnya ada vokal (syarat panyigeg)
  const tambahPanyigeg = (k: string) => {
    const [tanda, nama] = PANYIGEG[k];
    const akhir = seg[seg.length - 1];
    akhir.jawa += tanda;
    akhir.latin += k;
    akhir.catatan.push(nama);
  };
  const tambahMati = (k: string) => {
    tunda ??= { jawa: "", latin: "", catatan: [] };
    tunda.jawa += KONSONAN[k] + PANGKON;
    tunda.latin += latinK(k);
    tunda.catatan.push(`${k} mati, aksara berikutnya ditulis sebagai pasangan`);
  };
  while (i < t.length) {
    const x = t[i];
    if (x.jenis === "batas") {
      // Dengan mode tanpa spasi, batas kata tidak memutus pasangan.
      if (!p.tanpaSpasi) {
        seg.push({ jawa: " ", latin: " ", catatan: [] });
        sebelumVokal = false;
      }
      i++;
      continue;
    }
    if (x.jenis === "tanda") {
      if (tunda) seg.push(tunda);
      tunda = null;
      seg.push({ jawa: x.s, latin: x.s === PADA_LINGSA ? "," : x.s === PADA_LUNGSI ? "." : x.s >= "\uA9D0" && x.s <= "\uA9D9" ? String(x.s.charCodeAt(0) - 0xa9d0) : x.s, catatan: [x.s === PADA_LINGSA ? "pada lingsa (koma)" : x.s === PADA_LUNGSI ? "pada lungsi (titik)" : "angka Jawa"] });
      sebelumVokal = false;
      i++;
      continue;
    }
    if (x.jenis === "V") {
      // Tidak terjadi: tokenisasi selalu menyisipkan ha sebelum vokal tanpa konsonan.
      i++;
      continue;
    }
    // Kumpulkan gugus konsonan sampai vokal, tanda, atau akhir (melewati batas kata bila tanpa spasi).
    const gugus: string[] = [];
    let j = i;
    while (j < t.length) {
      const y = t[j];
      if (y.jenis === "K") gugus.push(y.k);
      else if (y.jenis === "batas" && p.tanpaSpasi && gugus.length) {
        /* lanjut melewati spasi */
      } else break;
      j++;
    }
    const vokal = j < t.length && t[j].jenis === "V" ? (t[j] as { v: Vokal }).v : null;
    if (!vokal) {
      // Konsonan mati sebelum spasi (mode berspasi), tanda baca, atau akhir teks: panyigeg atau pangkon.
      gugus.forEach((k, n) => {
        if (n === 0 && sebelumVokal && PANYIGEG[k]) tambahPanyigeg(k);
        else {
          if (tunda) seg.push(tunda);
          tunda = null;
          seg.push({ jawa: KONSONAN[k] + PANGKON, latin: latinK(k), catatan: [`${k} mati di akhir: pangkon`] });
        }
      });
      sebelumVokal = false;
      i = j;
      continue;
    }
    // Ada vokal: konsonan terakhir menjadi awal suku kata; sisanya penutup suku sebelumnya atau gugus.
    let n = 0;
    const akhir = gugus.length - 1;
    let selesai = false;
    while (n < akhir) {
      const k = gugus[n];
      if (n === 0 && sebelumVokal && PANYIGEG[k]) {
        tambahPanyigeg(k);
        n++;
        continue;
      }
      // Gugus konsonan + r / + y sebelum vokal: cakra/keret dan pengkal.
      if (n === akhir - 1 && (gugus[akhir] === "r" || gugus[akhir] === "y") && k !== gugus[akhir]) {
        const s0: Segmen = tunda ?? { jawa: "", latin: "", catatan: [] };
        tunda = null;
        if (gugus[akhir] === "r") {
          const keret = vokal === "ê";
          s0.jawa += KONSONAN[k] + (keret ? KERET : CAKRA) + (keret ? "" : SANDHANGAN[vokal]);
          s0.catatan.push(keret ? `${namaAksara(k)} + keret (rê)` : [`${namaAksara(k)} + cakra (r)`, NAMA_SANDHANGAN[vokal]].filter(Boolean).join(" + "));
        } else {
          s0.jawa += KONSONAN[k] + PENGKAL + SANDHANGAN[vokal];
          s0.catatan.push([`${namaAksara(k)} + pengkal (y)`, NAMA_SANDHANGAN[vokal]].filter(Boolean).join(" + "));
        }
        s0.latin += latinK(k) + gugus[akhir] + vokal;
        seg.push(s0);
        selesai = true;
        break;
      }
      tambahMati(k);
      n++;
    }
    if (!selesai) {
      const k = gugus[akhir];
      const s0: Segmen = tunda ?? { jawa: "", latin: "", catatan: [] };
      tunda = null;
      if (k === "r" && vokal === "ê") {
        s0.jawa += PA_CEREK;
        s0.catatan.push("pa cêrêk (rê)");
      } else if (k === "l" && vokal === "ê") {
        s0.jawa += NGA_LELET;
        s0.catatan.push("nga lêlêt (lê)");
      } else {
        s0.jawa += KONSONAN[k] + SANDHANGAN[vokal];
        const dasar = k === HA_AWAL ? "ha untuk vokal di awal kata" : namaAksara(k) + (KONSONAN[k].includes(CECAK_TELU) ? " (dengan cecak telu)" : "");
        s0.catatan.push([dasar, NAMA_SANDHANGAN[vokal]].filter(Boolean).join(" + "));
      }
      s0.latin += latinK(k) + vokal;
      seg.push(s0);
    }
    sebelumVokal = true;
    i = j + 1;
  }
  if (tunda) seg.push(tunda);
  return seg;
}

/** Latin → aksara Jawa. */
export function keJawa(teks: string, pilihan: Partial<Pilihan> = {}): string {
  return keJawaRinci(teks, pilihan)
    .map((s) => s.jawa)
    .join("");
}

/* ---------- Jawa → Latin ---------- */
const BALIK_KONSONAN: Record<string, string> = Object.fromEntries(CARAKAN.map((c) => [c.jawa, c.latin.slice(0, -1)]));
const BALIK_SANDHANGAN: Record<string, string> = { "ꦶ": "i", "ꦷ": "i", "ꦸ": "u", "ꦹ": "u", "ꦼ": "ê", "ꦺ": "é" };
const AKSARA_SWARA: Record<string, string> = { "ꦄ": "a", "ꦆ": "i", "ꦇ": "ii", "ꦈ": "u", "ꦌ": "é", "ꦎ": "o" };

/** Aksara Jawa → Latin (pembacaan sederhana; ha di awal suku dibaca tanpa h bila diikuti vokal di awal kata). */
export function keLatin(teks: string): string {
  const s = [...teks.normalize("NFC")];
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (BALIK_KONSONAN[c] != null || c === PA_CEREK || c === NGA_LELET) {
      let dasar = c === PA_CEREK ? "r" : c === NGA_LELET ? "l" : BALIK_KONSONAN[c];
      if (s[i + 1] === CECAK_TELU) {
        dasar = ({ p: "f", w: "v", j: "z", k: "kh" } as Record<string, string>)[dasar] ?? dasar;
        i++;
      }
      // Ha di awal kata, sebagai pasangan (sesudah pangkon), atau sesudah panyigeg dibaca sebagai vokal saja:
      // di posisi itu ha hampir selalu penanda kata yang berawalan vokal.
      const awalKata = out === "" || /[\s.,]$/.test(out) || [PANGKON, WIGNYAN, LAYAR, CECAK].includes(s[i - 1]);
      if (dasar === "h" && awalKata) dasar = "";
      let tengah = "";
      if (s[i + 1] === CAKRA) {
        tengah = "r";
        i++;
      } else if (s[i + 1] === KERET) {
        tengah = "rê";
        i++;
      } else if (s[i + 1] === PENGKAL) {
        tengah = "y";
        i++;
      }
      if (c === PA_CEREK || c === NGA_LELET) {
        out += dasar + "ê";
        continue;
      }
      if (s[i + 1] === PANGKON) {
        out += dasar + tengah;
        i++;
        continue;
      }
      let v = tengah === "rê" ? "" : "a";
      if (s[i + 1] === "ꦺ" && s[i + 2] === "ꦴ") {
        v = "o";
        i += 2;
      } else if (BALIK_SANDHANGAN[s[i + 1]]) {
        v = BALIK_SANDHANGAN[s[i + 1]];
        i++;
      }
      out += dasar + tengah + v;
    } else if (c === WIGNYAN) out += "h";
    else if (c === LAYAR) out += "r";
    else if (c === CECAK) out += "ng";
    else if (AKSARA_SWARA[c]) out += AKSARA_SWARA[c];
    else if (c === PADA_LINGSA) out += ", ";
    else if (c === PADA_LUNGSI) out += ". ";
    else if (c >= "꧐" && c <= "꧙") out += String(c.charCodeAt(0) - 0xa9d0);
    else if (c === PANGKON || c === CECAK_TELU) {
      /* sudah ditangani bersama konsonan */
    } else out += c;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Contoh siap pakai. */
export const CONTOH = ["hanacaraka", "aksara jawa", "Ngayogyakarta", "Surakarta", "sugêng énjing", "matur nuwun", "Jawa Têngah", "kraton"];
