"""For every bundle record, work out the hf download command for its weights and
check on the Hub (via hf-mirror.com) that the files exist. Writes
downloads.json (current directory): {record file: {source, local_dir, include, ok, note}}.
"""
import json
import sys
import time
import urllib.request

BUNDLE = sys.argv[1]
HUB = "https://hf-mirror.com"


def tree(repo, cache={}):
    if repo in cache:
        return cache[repo]
    url = f"{HUB}/api/models/{repo}/tree/main?recursive=true"
    files = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "radeon-arena-blog"}), timeout=60) as r:
                files = [x["path"] for x in json.load(r) if x.get("type") == "file"]
            break
        except Exception as e:  # network or 404
            err = str(e)
            time.sleep(2)
    cache[repo] = files if files is not None else err
    return cache[repo]


b = json.load(open(BUNDLE))
out = {}
for dev, recs in b["records"].items():
    for r in recs:
        src = r["recipe"].get("source") or r["model"].get("source")
        path = r["recipe"].get("model") or r["model"].get("path")
        rel = path[len("/models/"):] if path.startswith("/models/") else path
        parts = rel.split("/")
        local_dir, rest = parts[0], "/".join(parts[1:])
        files = tree(src) if src else "no source"
        ok, include, note = False, None, ""
        if isinstance(files, str):
            note = "hub: " + files[:80]
        elif rest.endswith(".gguf"):
            sub = rest.rsplit("/", 1)[0] if "/" in rest else ""
            base = rest.rsplit("/", 1)[-1]
            if "-of-" in base:
                include = (sub + "/*") if sub else base.split("-00001-of-")[0] + "*"
                ok = any(f.startswith(sub + "/") for f in files) if sub else any(f.startswith(base.split("-00001-of-")[0]) for f in files)
            else:
                include = rest
                ok = rest in files
                if not ok:  # file may sit at repo root under the same name
                    ok = base in files
                    include = base if ok else include
                    note = "flat" if ok else ""
        else:
            include = None  # whole repo (safetensors directory)
            ok = any(f.endswith(".safetensors") for f in files)
        out[r["file"]] = dict(dev=dev, source=src, local_dir=local_dir, rest=rest, include=include, ok=ok, note=note)
json.dump(out, open("downloads.json (current directory)", "w"), indent=1)
bad = {k: v for k, v in out.items() if not v["ok"]}
print(len(out), "records,", len(bad), "unverified")
for k, v in list(bad.items())[:40]:
    print(v["dev"], v["source"], v["rest"], v["note"])
