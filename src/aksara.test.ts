import { describe, expect, it } from "vitest";
import { CARAKAN, keJawa, keLatin } from "./aksara";

/** Menyusun string dari daftar kode heksadesimal supaya harapan tes tidak bergantung pada tampilan fon. */
const u = (...kode: number[]) => String.fromCharCode(...kode);

describe("Latin ke aksara Jawa", () => {
  it("carakan dasar", () => {
    expect(keJawa("hanacaraka")).toBe(u(0xa9b2, 0xa9a4, 0xa995, 0xa9ab, 0xa98f));
    expect(CARAKAN).toHaveLength(20);
  });

  it("vokal di awal kata memakai ha, konsonan mati di tengah memakai pasangan", () => {
    expect(keJawa("aksara jawa")).toBe(u(0xa9b2, 0xa98f, 0xa9c0, 0xa9b1, 0xa9ab, 0xa997, 0xa9ae));
  });

  it("Ngayogyakarta: taling tarung, pengkal, layar", () => {
    expect(keJawa("Ngayogyakarta")).toBe(u(0xa994, 0xa9aa, 0xa9ba, 0xa9b4, 0xa992, 0xa9be, 0xa98f, 0xa982, 0xa9a0));
  });

  it("Surakarta dan matur nuwun", () => {
    expect(keJawa("Surakarta")).toBe(u(0xa9b1, 0xa9b8, 0xa9ab, 0xa98f, 0xa982, 0xa9a0));
    expect(keJawa("matur nuwun")).toBe(u(0xa9a9, 0xa9a0, 0xa9b8, 0xa982, 0xa9a4, 0xa9b8, 0xa9ae, 0xa9b8, 0xa9a4, 0xa9c0));
  });

  it("Jawa Têngah: pepet dan wignyan", () => {
    expect(keJawa("Jawa Têngah")).toBe(u(0xa997, 0xa9ae, 0xa9a0, 0xa9bc, 0xa994, 0xa983));
  });

  it("cakra, keret, dan pa cêrêk", () => {
    expect(keJawa("kraton")).toBe(u(0xa98f, 0xa9bf, 0xa9a0, 0xa9ba, 0xa9b4, 0xa9a4, 0xa9c0));
    expect(keJawa("krêta")).toBe(u(0xa98f, 0xa9bd, 0xa9a0));
    expect(keJawa("rêbut")).toBe(u(0xa989, 0xa9a7, 0xa9b8, 0xa9a0, 0xa9c0));
  });

  it("cecak untuk ng mati", () => {
    expect(keJawa("tangga")).toBe(u(0xa9a0, 0xa981, 0xa992));
  });

  it("kata berawalan vokal sesudah konsonan mati menjadi pasangan ha", () => {
    expect(keJawa("makan ayam")).toBe(u(0xa9a9, 0xa98f, 0xa9a4, 0xa9c0, 0xa9b2, 0xa9aa, 0xa9a9, 0xa9c0));
    expect(keJawa("makan ayam", { tanpaSpasi: false })).toBe(u(0xa9a9, 0xa98f, 0xa9a4, 0xa9c0) + " " + u(0xa9b2, 0xa9aa, 0xa9a9, 0xa9c0));
  });

  it("pilihan bacaan e, angka, tanda baca, dan huruf serapan", () => {
    expect(keJawa("sate", { e: "é" })).toBe(u(0xa9b1, 0xa9a0, 0xa9ba));
    expect(keJawa("sate", { e: "ê" })).toBe(u(0xa9b1, 0xa9a0, 0xa9bc));
    expect(keJawa("1945.")).toBe(u(0xa9d1, 0xa9d9, 0xa9d4, 0xa9d5, 0xa9c9));
    expect(keJawa("fajar")).toBe(u(0xa9a5, 0xa9b3, 0xa997, 0xa982));
  });
});

describe("aksara Jawa ke Latin", () => {
  it("membaca balik hasil alih aksara", () => {
    for (const [asal, harap] of [
      ["Ngayogyakarta", "ngayogyakarta"],
      ["Jawa Têngah", "jawatêngah"],
      ["makan ayam", "makanayam"],
      ["kraton", "kraton"],
      ["krêta", "krêta"],
      ["tangga", "tangga"],
      ["aksara", "aksara"],
      ["rawuh ing aksara", "rawuhingaksara"],
      ["abang ijo", "abangijo"],
    ]) {
      expect(keLatin(keJawa(asal))).toBe(harap);
    }
  });

  it("ha di awal kata dibaca sebagai vokal", () => {
    expect(keLatin(keJawa("hanacaraka"))).toBe("anacaraka");
  });

  it("tanda baca dan angka Jawa", () => {
    expect(keLatin(u(0xa9d1, 0xa9d9, 0xa9d4, 0xa9d5, 0xa9c9))).toBe("1945.");
  });
});

describe("rincian per suku kata", () => {
  it("memotong per suku dan menjelaskan pasangan serta panyigeg", async () => {
    const { keJawaRinci } = await import("./aksara");
    expect(keJawaRinci("aksara").map((s) => s.latin)).toEqual(["a", "ksa", "ra"]);
    const sura = keJawaRinci("Surakarta");
    expect(sura.map((s) => s.latin)).toEqual(["su", "ra", "kar", "ta"]);
    expect(sura[2].catatan).toContain("layar (r mati)");
    expect(keJawaRinci("Ngayogyakarta")[2].catatan[0]).toBe("ga + pengkal (y)");
    expect(keJawaRinci("aksara")[1].catatan[0]).toMatch(/k mati/);
  });
});
