"""Per-node triangle / primitive (material) counts and file size of one or more synes_kit GLBs.

    python3 tools/blender/kit_stats.py public/assets/models/synes_kit.glb [other.glb ...]
        [--nodes hero,prismback] [--materials]

Pure Python (no bpy). A "primitive" is one material slot of a mesh node. In the game
(src/render/models.ts) sibling kit meshes are merged into one draw call per node, except the
boss (`prismback`, KEEP_SEPARATE): there every primitive is its own draw call. So hero changes
are draw-call neutral whatever their material count, Prismback changes are not.
With several files the columns are side by side; the first file is the reference and the later
columns show the delta in brackets.
"""
import json
import os
import struct
import sys


def read(path):
    data = open(path, "rb").read()
    jlen = struct.unpack_from("<I", data, 12)[0]
    return json.loads(data[20:20 + jlen].decode("utf-8")), len(data)


def stats(path):
    j, size = read(path)
    acc, mats = j["accessors"], [m.get("name") for m in j.get("materials", [])]
    rows = {}
    for n in j["nodes"]:
        if "mesh" not in n:
            continue
        tris, used = 0, []
        for p in j["meshes"][n["mesh"]]["primitives"]:
            src = acc[p["indices"]] if "indices" in p else acc[p["attributes"]["POSITION"]]
            tris += src["count"] // 3
            used.append(mats[p["material"]] if p.get("material") is not None else "-")
        rows[n["name"]] = (tris, used)
    return {"size": size, "total": sum(t for t, _ in rows.values()), "rows": rows, "materials": len(mats)}


def main():
    argv = sys.argv[1:]
    only = None
    if "--nodes" in argv:
        i = argv.index("--nodes")
        only = argv[i + 1].split(",")
        del argv[i:i + 2]
    files = [a for a in argv if not a.startswith("--")]
    data = [(os.path.basename(f), stats(f)) for f in files]
    names = []
    for _, s in data:
        names += [n for n in s["rows"] if n not in names]
    if only:
        names = [n for n in names if any(n == o or n.startswith(o + "_") for o in only)]
    print("| node | " + " | ".join("%s tris / prims" % f for f, _ in data) + " |")
    print("|---|" + "---:|" * len(data))
    ref = data[0][1]
    for n in names:
        cells = []
        for k, (_, s) in enumerate(data):
            t, used = s["rows"].get(n, (0, []))
            cell = "%d / %d" % (t, len(used))
            if k and n in ref["rows"]:
                cell += " (%+d / %+d)" % (t - ref["rows"][n][0], len(used) - len(ref["rows"][n][1]))
            cells.append(cell)
        print("| `%s` | %s |" % (n, " | ".join(cells)))
    if only:
        cells = []
        for k, (_, s) in enumerate(data):
            t = sum(s["rows"].get(n, (0, []))[0] for n in names)
            p = sum(len(s["rows"].get(n, (0, []))[1]) for n in names)
            rt = sum(ref["rows"].get(n, (0, []))[0] for n in names)
            rp = sum(len(ref["rows"].get(n, (0, []))[1]) for n in names)
            cells.append("%d / %d" % (t, p) + (" (%+d / %+d)" % (t - rt, p - rp) if k else ""))
        print("| **selected** | %s |" % " | ".join(cells))
    cells = []
    for k, (_, s) in enumerate(data):
        cell = "%d tris, %.1f KB, %d materials" % (s["total"], s["size"] / 1024, s["materials"])
        if k:
            cell += " (%+d tris, %+.1f KB)" % (s["total"] - ref["total"], (s["size"] - ref["size"]) / 1024)
        cells.append(cell)
    print("| **file** | %s |" % " | ".join(cells))
    if "--materials" in argv:
        for f, s in data:
            print("\n%s" % f)
            for n in names:
                if n in s["rows"]:
                    print("  %-18s %s" % (n, ", ".join(s["rows"][n][1])))


if __name__ == "__main__":
    main()
