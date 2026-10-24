"""コラムの書き直しを、記事データに反映する（2026-10）。

使い方: python3 scripts/apply_column_rewrite.py <出力JSONのフォルダ> [--check]
  フォルダ内の out*.json（slug / title / metaDescription / keywords / content / faqs の配列）を検査し、
  公開済みは src/data/columnsData.ts、公開待ちは scripts/column-pool.json に反映する。
  目次（toc）・読了時間・最後の定型2段落は、ここで作る。
"""
import glob
import html as htmllib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, "src", "data", "columnsData.ts")
POOL = os.path.join(ROOT, "scripts", "column-pool.json")
KEEP_TITLE = {"kaigou-shichutsuimei-guide"}
CTA = ("<p>相手のタイプや二人の相性を知っておくと、考え方も気持ちもぐっと整理しやすくなります。"
       "生年月日を入れて、無料で鑑定してみましょう。</p>\n"
       "<p>※占い・性格診断は、二人の関係を考えるきっかけとしてお楽しみください。結果を保証するものではありません。</p>")
BANNED = ["比和", "支合", "相生", "相剋", "干合", "三合", "六沖", "日干", "十干", "地支", "通変星", "蔵干", "心理機能分析"]


def plain(h):
    return htmllib.unescape(re.sub(r"\s+", "", re.sub(r"<[^>]+>", "", h)))


def load_ts():
    src = open(TS, encoding="utf-8").read()
    i = src.index("= [", src.index("export const COLUMNS_DATA")) + 2
    j = src.rindex("]") + 1
    return src, i, j, json.loads(src[i:j])


def validate(e, kept, slugs, published):
    errs = []
    for k in ("slug", "title", "metaDescription", "keywords", "content", "faqs"):
        if not e.get(k):
            errs.append(f"{k}が空")
    if errs:
        return errs
    text = plain(e["content"])
    if len(text) < 1900:
        errs.append(f"本文が短い（{len(text)}字）")
    if len(re.findall(r"<h3", e["content"])) < 3:
        errs.append("H3が3個未満")
    if len(re.findall(r"<h2 id=\"section-\d+\">", e["content"])) < 5:
        errs.append("H2が5個未満")
    if len(e["faqs"]) != 3 or not all(q["question"].endswith(("？", "?")) for q in e["faqs"]):
        errs.append("FAQは3問・疑問形")
    if not 4 <= len(e["keywords"]) <= 6:
        errs.append("keywordsは4〜6個")
    if not 70 <= len(e["metaDescription"]) <= 125:
        errs.append(f"metaDescriptionの長さ（{len(e['metaDescription'])}）")
    if e["slug"] not in KEEP_TITLE and len(e["title"]) > 42:
        errs.append(f"題名が長い（{len(e['title'])}）")
    blob = e["title"] + e["content"] + "".join(q["question"] + q["answer"] for q in e["faqs"])
    for w in BANNED:
        if w in blob:
            errs.append(f"禁止語: {w}")
    if "style=" in e["content"] or "<script" in e["content"]:
        errs.append("style/script")
    for s in re.findall(r'href="/column/([^"]+)"', e["content"]):
        if s not in slugs or s == e["slug"] or s not in published:
            errs.append(f"リンク先が不正: {s}")
    if "相手のタイプや二人の相性を知っておくと" in e["content"]:
        errs.append("定型段落を入れない")
    if e["slug"] in KEEP_TITLE and (e["title"] != kept["title"] or e["metaDescription"] != kept["metaDescription"]):
        errs.append("この記事の題名・メタ説明は変えない")
    return errs


def build(e, old):
    content = e["content"].strip() + "\n" + CTA
    toc = [{"id": m.group(1), "title": htmllib.unescape(re.sub(r"<[^>]+>", "", m.group(2))), "level": 1}
           for m in re.finditer(r'<h2 id="(section-\d+)">(.*?)</h2>', content, re.S)]
    new = dict(old)
    new.update({"title": e["title"], "metaDescription": e["metaDescription"], "keywords": e["keywords"],
                "toc": toc, "content": content, "faqs": e["faqs"],
                "readTimeMinutes": max(5, round(len(plain(content)) / 400))})
    return new


def main():
    src_dir = sys.argv[1]
    check = "--check" in sys.argv
    entries = []
    for f in sorted(glob.glob(os.path.join(src_dir, "out*.json"))):
        entries += json.load(open(f, encoding="utf-8"))
    ts_src, i, j, cols = load_ts()
    pool = json.load(open(POOL, encoding="utf-8"))
    by_ts = {c["slug"]: c for c in cols}
    by_pool = {p["slug"]: p for p in pool}
    slugs = set(by_ts) | set(by_pool)
    published = set(by_ts)
    bad = 0
    seen = set()
    for e in entries:
        old = by_ts.get(e.get("slug")) or by_pool.get(e.get("slug"))
        if not old:
            print("NG", e.get("slug"), "記事が見つからない")
            bad += 1
            continue
        if e["slug"] in seen:
            print("NG", e["slug"], "重複")
            bad += 1
        seen.add(e["slug"])
        errs = validate(e, old, slugs, published)
        if errs:
            bad += 1
            print("NG", e["slug"], " / ".join(errs))
    missing = (set(by_ts) | set(by_pool)) - seen
    print(f"{len(entries)}本 検査NG {bad}本 / 未対応 {len(missing)}本")
    if missing and len(missing) < 15:
        print("未対応:", sorted(missing))
    if check or bad:
        sys.exit(1 if bad else 0)
    for e in entries:
        if e["slug"] in by_ts:
            c = by_ts[e["slug"]]
            c.update(build(e, c))
        else:
            p = by_pool[e["slug"]]
            p.update(build(e, p))
    open(TS, "w", encoding="utf-8").write(ts_src[:i] + json.dumps(cols, ensure_ascii=False, indent=2) + ts_src[j:])
    open(POOL, "w", encoding="utf-8").write(json.dumps(pool, ensure_ascii=False, indent=2))
    print("反映しました。")


if __name__ == "__main__":
    main()
