/**
 * SERP-safe meta description z on-page popisu (audit Vlna 2b, gate výhrada 2).
 *
 * Pole `desc`/`body` v common.json slouží duálně — jako hero subhead (plný text)
 * i jako meta description. Google ale snippet ořezává kolem ~157 znaků, takže se
 * plné popisy lámaly uprostřed slova na všech 31 detailních stránkách. Tento
 * helper vezme první větu a případně dořízne na hranici slova s výpustkou.
 */
export function metaDescription(text: string): string {
  const sentences = text.match(/[^.!?]*[.!?]/g)?.map((s) => s.trim()) ?? [text.trim()];
  let out = sentences[0] ?? text.trim();
  // Krátká enumerativní první věta („Banky, pojišťovny, fintech.") nenese hodnotu —
  // přibalujeme další věty, dokud je snippet pod ~90 znaky a vejde se do 160.
  let i = 1;
  while (out.length < 90 && i < sentences.length && `${out} ${sentences[i]}`.length <= 160) {
    out = `${out} ${sentences[i]}`;
    i += 1;
  }
  if (out.length <= 160) return out;
  const cut = out.lastIndexOf(' ', 157);
  return `${(cut < 0 ? out.slice(0, 157) : out.slice(0, cut)).trim()}…`;
}
