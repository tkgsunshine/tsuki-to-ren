"""各コラムの「この記事の結論」（answer）を、記事データに反映する（2026-10）。

使い方: python3 scripts/apply_column_answers.py <ans_out*.json のフォルダ> [--check]
  [{"slug": "…", "answer": "…"}] を検査し、公開済みは src/data/columnsData.ts、公開待ちは scripts/column-pool.json に answer を入れる。
  書き直し済みの記事には、updatedAt（本文を書き直した日）も入れる。
"""
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(ROOT, "src", "data", "columnsData.ts")
POOL = os.path.join(ROOT, "scripts", "column-pool.json")
UPDATED = "2026-10-26T12:00:00+09:00"
BANNED = ["比和", "支合", "相生", "相剋", "干合", "三合", "六沖", "日干", "十干", "地支", "通変星", "蔵干", "心理機能分析"]


def main():
    src_dir = sys.argv[1]
    check = "--check" in sys.argv
    entries = []
    for f in sorted(glob.glob(os.path.join(src_dir, "ans_out*.json"))):
        entries += json.load(open(f, encoding="utf-8"))
    src = open(TS, encoding="utf-8").read()
    i = src.index("= [", src.index("export const COLUMNS_DATA")) + 2
    j = src.rindex("]") + 1
    cols = json.loads(src[i:j])
    pool = json.load(open(POOL, encoding="utf-8"))
    by = {c["slug"]: c for c in cols}
    bp = {p["slug"]: p for p in pool}
    bad = 0
    seen = set()
    for e in entries:
        s, a = e.get("slug"), (e.get("answer") or "").strip()
        errs = []
        if s not in by and s not in bp:
            errs.append("記事が見つからない")
        if s in seen:
            errs.append("重複")
        seen.add(s)
        if not 60 <= len(a) <= 140:
            errs.append(f"長さ（{len(a)}字）")
        if a.count("。") < 2:
            errs.append("2文にする")
        if any(w in a for w in BANNED):
            errs.append("禁止語")
        if errs:
            bad += 1
            print("NG", s, " / ".join(errs))
    missing = (set(by) | set(bp)) - seen
    print(f"{len(entries)}本 検査NG {bad}本 / 未対応 {len(missing)}本")
    if check or bad:
        sys.exit(1 if bad else 0)
    for e in entries:
        a = e["answer"].strip()
        if e["slug"] in by:
            by[e["slug"]]["answer"] = a
            by[e["slug"]]["updatedAt"] = UPDATED
        if e["slug"] in bp:
            bp[e["slug"]]["answer"] = a
    open(TS, "w", encoding="utf-8").write(src[:i] + json.dumps(cols, ensure_ascii=False, indent=2) + src[j:])
    open(POOL, "w", encoding="utf-8").write(json.dumps(pool, ensure_ascii=False, indent=2))
    print("反映しました。")


if __name__ == "__main__":
    main()
