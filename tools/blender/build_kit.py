"""Synes Online - original low-poly model kit, built entirely from code with Blender (bpy).

Headless (from the repo root):
    tools/blender/.venv/bin/python tools/blender/build_kit.py [--variant r0|A|B]
    (or SYNES_CHAR_VARIANT=r0|A|B; only `hero` and `prismback` differ between variants, see CHAR_VARIANT)

Desktop Blender (4.1+) / Blender MCP: paste this whole file into the Text Editor (or the MCP
"execute code" tool) and run it. Set REPO_ROOT below (or the env var SYNES_REPO) so the
GLB lands in <repo>/public/assets/models/; otherwise it is written to ~/synes_kit.glb.
Inside a running Blender it does NOT reset the session: it only deletes objects/materials
it owns (contract node names, the "synes_kit" collection) and rebuilds them.

Conventions (spec: docs/art/ASSET_CONTRACT.md):
  * Blender is Z-up. Characters face -Y here; the glTF exporter turns that into +Z.
  * Every asset root sits at the world origin with its origin on the ground, centred.
  * Animated children keep their pivot where the game rotates them (neck, grip, ...).
  * Flat-coloured shared materials only (Principled base colour, emission on crystals).
The script is deterministic: no time/random state leaks in, so the same Blender build
produces the same GLB byte for byte.
"""
import math
import os
import random
import sys

import bpy  # must come first: the bpy wheel provides bmesh/mathutils
import bmesh
from mathutils import Euler, Matrix, Vector

REPO_ROOT = os.environ.get("SYNES_REPO", "")  # e.g. r"C:\dev\synes-online" for desktop use
# Character variant (hero + prismback only; every other asset is identical in all of them):
#   r0 = owner-approved DES-003 models (what main shipped before DES-004 steps 3-4)
#   A  = DES-004 steps 3-4, conservative edit of r0      (default on exp/stage1-chars)
#   B  = DES-004 steps 3-4, stronger silhouette change
# Pick with the env var SYNES_CHAR_VARIANT, or `--variant B` on the command line, or edit the default.
CHAR_VARIANTS = ("r0", "A", "B")
CHAR_VARIANT = os.environ.get("SYNES_CHAR_VARIANT", "A")
if "--variant" in sys.argv[:-1]:
    CHAR_VARIANT = sys.argv[sys.argv.index("--variant") + 1]
CHAR_VARIANT = {"R0": "r0", "CURRENT": "r0"}.get(CHAR_VARIANT.upper(), CHAR_VARIANT.upper())
if CHAR_VARIANT not in CHAR_VARIANTS:
    raise SystemExit("unknown character variant %r (use one of %s)" % (CHAR_VARIANT, ", ".join(CHAR_VARIANTS)))
# Arena landmark variant (DES-004 step 2: `crystal_spire` + `ruin_arch_shrine`, exp/stage1-spire-shrine):
#   A = restrained (default)   B = bolder silhouette.  Env SYNES_SPIRE_VARIANT or `--spire B`.
SPIRE_VARIANT = os.environ.get("SYNES_SPIRE_VARIANT", "A")
if "--spire" in sys.argv[:-1]:
    SPIRE_VARIANT = sys.argv[sys.argv.index("--spire") + 1]
SPIRE_VARIANT = SPIRE_VARIANT.upper()
if SPIRE_VARIANT not in ("A", "B"):
    raise SystemExit("unknown spire/shrine variant %r (use A or B)" % SPIRE_VARIANT)
# SYNES_KIT_ONLY="crystal_spire,ruin_arch_shrine" builds a side-car GLB with just those nodes (used for ?spire=B in game)
KIT_ONLY = [n for n in os.environ.get("SYNES_KIT_ONLY", "").split(",") if n]
KIT_COLLECTION = "synes_kit"
GLB_RELPATH = os.path.join("public", "assets", "models", "synes_kit.glb")

# ----------------------------------------------------------------------------- palette
# name: (sRGB hex, emission strength, roughness). The first block is the contract palette
# verbatim; the second block holds support colours derived for characters/props.
# Reserved telegraph colours (#FF7A1A orange, #FF3355 red) must never appear here.
PALETTE = {
    "lumen":          ("#5CF2E6", 0.55, 0.30),  # Synes crystals, interactive light (emissive)
    "synes_violet":   ("#A78BFA", 0.0, 0.70),   # magic cloth / trims (matte)
    "blossom":        ("#FF9EC7", 0.0, 0.80),
    "gold":           ("#FFC857", 0.0, 0.50),
    "leaf":           ("#7CCB5E", 0.0, 0.85),
    "leaf_dark":      ("#3F8F4A", 0.0, 0.85),
    "bark":           ("#8A5A3B", 0.0, 0.90),
    "path":           ("#E8C99B", 0.0, 0.90),
    "stone":          ("#B9B4C7", 0.0, 0.90),
    "cloth_teal":     ("#2BB3A3", 0.0, 0.80),
    # --- derived support colours
    "crystal_violet": ("#A78BFA", 0.45, 0.30),  # violet crystals (emissive twin of synes_violet)
    "crystal_mid":    ("#82BEF2", 0.50, 0.30),  # midpoint of the lumen -> violet gradient
    "prism_edge":     ("#DAF6FF", 0.64, 0.20),
    "prism_cyan":     ("#39CFEC", 0.62, 0.22),
    "prism_violet":   ("#7761D9", 0.36, 0.24),
    "prism_slate":    ("#4C5277", 0.0, 0.72),
    "prism_trim":     ("#DAB381", 0.0, 0.45),
    "glow_gold":      ("#FFC857", 0.80, 0.40),  # lantern glass, windows, campfire flame
    "cream":          ("#FFF3DC", 0.0, 0.85),
    "navy":           ("#33437A", 0.0, 0.85),
    "skin":           ("#FFD9BF", 0.0, 0.70),
    "hero_silver":    ("#C4C8EA", 0.0, 0.57),
    "hero_silver_tip":("#F1EDFF", 0.0, 0.52),
    "hero_silver_shade": ("#A2A6D6", 0.0, 0.6),  # DES-004 variant B: darker hair cap between the locks
    "hero_violet":    ("#6754A8", 0.0, 0.72),
    "ink":            ("#2B2440", 0.0, 0.40),
    "white":          ("#FFFFFF", 0.0, 0.40),
    "stone_dark":     ("#8F89A6", 0.0, 0.90),
    "wood_light":     ("#D2A679", 0.0, 0.85),
    "water":          ("#8FDDEB", 0.0, 0.20),
}


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_to_linear(hex_):
    h = hex_.lstrip("#")
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (1.0,)


def material(name):
    """Get-or-create one shared palette material (Principled BSDF, no textures)."""
    mat = bpy.data.materials.get(name)
    if mat is not None:
        return mat
    hex_, emit, rough = PALETTE[name]
    col = hex_to_linear(hex_)
    mat = bpy.data.materials.new(name)
    if mat.node_tree is None:  # Blender < 5.0 needs nodes switched on
        mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = col
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = 0.0
    if emit > 0.0:
        bsdf.inputs["Emission Color"].default_value = col
        bsdf.inputs["Emission Strength"].default_value = emit
    mat.diffuse_color = col  # viewport colour in desktop Blender
    return mat


# ----------------------------------------------------------------------------- math helpers
def xform(at=(0, 0, 0), rot=(0, 0, 0), scale=1.0):
    """Scale -> rotate (XYZ Euler, degrees) -> translate."""
    if isinstance(scale, (int, float)):
        scale = (scale, scale, scale)
    s = Matrix.Diagonal((scale[0], scale[1], scale[2], 1.0))
    r = Euler([math.radians(a) for a in rot], "XYZ").to_matrix().to_4x4()
    return Matrix.Translation(Vector(at)) @ r @ s


def basis(z_dir, x_hint=(1, 0, 0)):
    """Rotation whose local +Z points along z_dir, local +X as close to x_hint as possible."""
    z = Vector(z_dir).normalized()
    h = Vector(x_hint).normalized()
    if abs(h.dot(z)) > 0.95:
        h = Vector((0, 1, 0)) if abs(z.y) < 0.9 else Vector((1, 0, 0))
    x = (h - z * h.dot(z)).normalized()
    y = z.cross(x)
    return Matrix((x, y, z)).transposed().to_4x4()


def on_ellipsoid(center, radii, direction):
    """Point on an ellipsoid surface along `direction` from its centre, and the normal there."""
    d = Vector(direction).normalized()
    a, b, c = radii
    t = 1.0 / math.sqrt((d.x / a) ** 2 + (d.y / b) ** 2 + (d.z / c) ** 2)
    p = d * t
    n = Vector((p.x / a ** 2, p.y / b ** 2, p.z / c ** 2)).normalized()
    return Vector(center) + p, n


def polar(radius, deg, z=0.0):
    a = math.radians(deg)
    return Vector((radius * math.cos(a), radius * math.sin(a), z))


def linked(verts, attr):
    """Faces/edges touching `verts`, de-duplicated in a stable order (sets would make the
    element order depend on memory addresses and break byte-identical rebuilds)."""
    return list(dict.fromkeys(x for v in verts for x in getattr(v, attr)))


def cut_below(bm, verts, z):
    """Delete the part of the given geometry below world height z."""
    verts = [v for v in verts if v.is_valid]
    geom = verts + linked(verts, "link_edges") + linked(verts, "link_faces")
    bmesh.ops.bisect_plane(bm, geom=geom, dist=1e-5, plane_co=(0, 0, z), plane_no=(0, 0, 1),
                           clear_inner=True)


# ----------------------------------------------------------------------------- mesh builder
class Part:
    """Collects bmesh primitives for ONE mesh object; materials are palette names.

    Placement conventions: box `at` = centre; cyl/cone/crystal `at` = base centre.
    """

    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.slots = []
        self.bevel = self.bm.edges.layers.float.new("bevel_weight_edge")
        self.rng = random.Random(name)  # deterministic per part

    # -- bookkeeping
    def _tag(self, verts, matrix, mat, smooth, bevel=False):
        bmesh.ops.transform(self.bm, matrix=matrix, verts=verts)
        if mat not in self.slots:
            self.slots.append(mat)
        idx = self.slots.index(mat)
        for f in linked(verts, "link_faces"):
            f.material_index = idx
            f.smooth = smooth
        if bevel:
            for e in linked(verts, "link_edges"):
                e[self.bevel] = 1.0
        return verts

    def _mesh(self, coords, faces, closed=True):
        verts = [self.bm.verts.new(c) for c in coords]
        new_faces = [self.bm.faces.new([verts[i] for i in f]) for f in faces]
        if closed:
            bmesh.ops.recalc_face_normals(self.bm, faces=new_faces)
        return verts

    def tilt(self, rot, center):
        """Rotate everything built so far (XYZ Euler degrees) around `center`."""
        m = Euler([math.radians(a) for a in rot], "XYZ").to_matrix()
        bmesh.ops.rotate(self.bm, verts=list(self.bm.verts), cent=center, matrix=m)

    def _cut_below(self, verts, z):
        cut_below(self.bm, verts, z)

    # -- primitives
    def box(self, size, at=(0, 0, 0), rot=(0, 0, 0), mat="stone", bevel=False, smooth=False):
        v = bmesh.ops.create_cube(self.bm, size=1.0)["verts"]
        return self._tag(v, xform(at, rot, size), mat, smooth, bevel)

    def cyl(self, r, h, at=(0, 0, 0), rot=(0, 0, 0), seg=8, r2=None, mat="bark",
            smooth=False, scale=1.0, caps=True, jag=0.0):
        """Cylinder/frustum/cone standing on `at` (r2=0 gives a cone). `jag` roughens the top."""
        r2 = r if r2 is None else r2
        v = bmesh.ops.create_cone(self.bm, cap_ends=caps, cap_tris=False, segments=seg,
                                  radius1=r, radius2=r2, depth=h)["verts"]
        bmesh.ops.translate(self.bm, vec=(0, 0, h / 2), verts=v)
        if jag:
            for vert in v:
                if vert.co.z > h * 0.99 and vert.co.xy.length > 1e-4:
                    vert.co.z -= self.rng.uniform(0.0, jag)
        return self._tag(v, xform(at, rot, scale), mat, smooth)

    def limb(self, p0, p1, r0, r1=None, seg=8, mat="bark", smooth=True, scale=(1, 1),
             x_hint=(1, 0, 0)):
        """Tapered cylinder from p0 to p1 (arms, legs, logs, poles). r1=0 gives a spike."""
        p0, p1 = Vector(p0), Vector(p1)
        d = p1 - p0
        r1 = r0 if r1 is None else r1
        v = bmesh.ops.create_cone(self.bm, cap_ends=True, cap_tris=False, segments=seg,
                                  radius1=r0, radius2=r1, depth=d.length)["verts"]
        bmesh.ops.translate(self.bm, vec=(0, 0, d.length / 2), verts=v)
        m = Matrix.Translation(p0) @ basis(d, x_hint) @ Matrix.Diagonal((scale[0], scale[1], 1, 1))
        return self._tag(v, m, mat, smooth)

    def sphere(self, r, at=(0, 0, 0), scale=1.0, seg=12, rings=8, mat="leaf", smooth=True,
               rot=(0, 0, 0), cut=None):
        """UV sphere; `cut` removes everything below that world Z. Built by hand because
        bmesh.ops.create_uvsphere welds its poles in a non-deterministic face order."""
        coords = [(0.0, 0.0, r)]
        for j in range(1, rings):
            phi = math.pi * j / rings
            coords += [(r * math.sin(phi) * math.cos(2 * math.pi * i / seg),
                        r * math.sin(phi) * math.sin(2 * math.pi * i / seg), r * math.cos(phi))
                       for i in range(seg)]
        coords.append((0.0, 0.0, -r))
        last, bottom = 1 + (rings - 2) * seg, len(coords) - 1
        faces = [(0, 1 + i, 1 + (i + 1) % seg) for i in range(seg)]
        for j in range(rings - 2):
            a, b = 1 + j * seg, 1 + (j + 1) * seg
            faces += [(a + i, b + i, b + (i + 1) % seg, a + (i + 1) % seg) for i in range(seg)]
        faces += [(last + (i + 1) % seg, last + i, bottom) for i in range(seg)]
        v = self._mesh(coords, faces)
        self._tag(v, xform(at, rot, scale), mat, smooth)
        if cut is not None:
            self._cut_below(v, cut)

    def ico(self, r, at=(0, 0, 0), scale=1.0, sub=1, mat="stone", smooth=False, rot=(0, 0, 0),
            jitter=0.0, cut=None):
        """Icosphere (sub=1: 20 faces, sub=2: 80); `jitter` (fraction of r) roughens it."""
        v = bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=r)["verts"]
        if jitter:
            for vert in v:
                vert.co += Vector([self.rng.uniform(-1, 1) for _ in range(3)]) * jitter * r
        self._tag(v, xform(at, rot, scale), mat, smooth)
        if cut is not None:
            self._cut_below(v, cut)

    def stud(self, center, radii, direction, size, mat, inset=0.45, sub=1, smooth=True):
        """Flattened blob sitting on an ellipsoid surface: eyes, cheeks, cap spots, moss."""
        p, n = on_ellipsoid(center, radii, direction)
        p = p - n * size[2] * inset
        v = bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=1.0)["verts"]
        m = Matrix.Translation(p) @ basis(n) @ Matrix.Diagonal((*size, 1.0))
        return self._tag(v, m, mat, smooth)

    def crystal(self, at, h, r, direction=(0, 0, 1), tip=None, mat="lumen", sides=6, yaw=0.0,
                taper=0.86, sink=0.3, facets=None):
        """Faceted Synes crystal: hexagonal prism + pointed cap, base sunk below `at`."""
        tip = r * 1.7 if tip is None else tip
        coords, faces = [], []
        for i in range(sides):
            a = math.radians(yaw) + 2 * math.pi * i / sides
            coords.append((r * math.cos(a), r * math.sin(a), -sink * h))
        for i in range(sides):
            a = math.radians(yaw) + 2 * math.pi * i / sides
            coords.append((r * taper * math.cos(a), r * taper * math.sin(a), h))
        coords.append((0.0, 0.0, h + tip))
        for i in range(sides):
            j = (i + 1) % sides
            faces.append((i, j, sides + j, sides + i))
            faces.append((sides + i, sides + j, 2 * sides))
        v = self._mesh(coords, faces, closed=False)
        self._tag(v, Matrix.Translation(Vector(at)) @ basis(direction), mat, False)
        if facets:
            for name in (*facets, "prism_edge"):
                if name not in self.slots:
                    self.slots.append(name)
            highlight = self.slots.index("prism_edge")
            for i in range(sides):
                face_material = self.slots.index(facets[i % len(facets)])
                next_i = (i + 1) % sides
                wall = self.bm.faces.get((v[i], v[next_i], v[sides + next_i], v[sides + i]))
                cap = self.bm.faces.get((v[sides + i], v[sides + next_i], v[-1]))
                wall.material_index = face_material
                cap.material_index = highlight if i % 3 == 0 else face_material
        return v

    def thorn(self, at, direction, length, width, thick, mat="leaf_dark", tip_mat="synes_violet",
              x_hint=(1, 0, 0), tip_frac=0.38):
        """Leaf-blade spike: flattened 4-sided frustum with a coloured pyramid tip."""
        m = length * (1 - tip_frac)
        ring0 = [(width / 2, 0, 0), (0, thick / 2, 0), (-width / 2, 0, 0), (0, -thick / 2, 0)]
        ring1 = [(x * 0.7, y * 0.7, m) for x, y, _ in ring0]
        coords = ring0 + ring1 + [(0, 0, length)]
        body = [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)]
        tips = [(4 + i, 4 + (i + 1) % 4, 8) for i in range(4)]
        v = self._mesh(coords, body + tips, closed=False)
        mtx = Matrix.Translation(Vector(at)) @ basis(direction, x_hint)
        self._tag(v, mtx, mat, False)
        if tip_mat not in self.slots:
            self.slots.append(tip_mat)
        for f in v[8].link_faces:
            f.material_index = self.slots.index(tip_mat)
        return v

    def blade(self, at, length, w0, w1, thick, tip, mat="lumen", rot=(0, 0, 0)):
        """Diamond-section sword blade standing on `at`, flat side facing -Y."""
        rings = [(0.0, w0), (length, w1)]
        coords = []
        for z, w in rings:
            coords += [(w / 2, 0, z), (0, -thick / 2, z), (-w / 2, 0, z), (0, thick / 2, z)]
        coords.append((0, 0, length + tip))
        faces = [(0, 3, 2, 1)]
        faces += [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)]
        faces += [(4 + i, 4 + (i + 1) % 4, 8) for i in range(4)]
        v = self._mesh(coords, faces)
        return self._tag(v, xform(at, rot), mat, False)

    def prism(self, profile, depth, at=(0, 0, 0), rot=(0, 0, 0), mat="wood_light", smooth=False,
              bevel=False):
        """Extrude a 2D (x, z) outline along Y by `depth`, centred on `at`."""
        n = len(profile)
        coords = [(u, -depth / 2, w) for u, w in profile] + [(u, depth / 2, w) for u, w in profile]
        faces = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))]
        faces += [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
        v = self._mesh(coords, faces)
        return self._tag(v, xform(at, rot), mat, smooth, bevel)

    def star_cone(self, r_out, r_in, h, at=(0, 0, 0), points=7, mat="leaf_dark", yaw=0.0):
        """Cone with a zig-zag (star) base: stylised pine tier."""
        coords = []
        for i in range(points * 2):
            r = r_out if i % 2 == 0 else r_in
            a = math.radians(yaw) + math.pi * i / points
            coords.append((r * math.cos(a), r * math.sin(a), 0.0))
        coords.append((0, 0, h))
        k = points * 2
        faces = [tuple(range(k - 1, -1, -1))] + [(i, (i + 1) % k, k) for i in range(k)]
        v = self._mesh(coords, faces)
        return self._tag(v, xform(at), mat, False)

    def flower(self, at, r, petals=5, mat="blossom", tilt=(0, 0, 0)):
        """Star-shaped flower head: raised centre on top, flat underside (18 tris for 5 petals)."""
        k = petals * 2
        coords = [((r if i % 2 == 0 else r * 0.45) * math.cos(math.pi * i / petals),
                   (r if i % 2 == 0 else r * 0.45) * math.sin(math.pi * i / petals), 0.0) for i in range(k)]
        coords.append((0, 0, r * 0.3))
        faces = [(i, (i + 1) % k, k) for i in range(k)] + [tuple(range(k - 1, -1, -1))]
        v = self._mesh(coords, faces)
        return self._tag(v, xform(at, tilt), mat, False)

    def gem(self, at, r, mat="blossom", scale=1.0):
        """Octahedron (8 tris): blossoms and berries on instanced foliage."""
        coords = [(r, 0, 0), (-r, 0, 0), (0, r, 0), (0, -r, 0), (0, 0, r), (0, 0, -r)]
        faces = [(0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)]
        v = self._mesh(coords, faces)
        return self._tag(v, xform(at, (0, 0, 0), scale), mat, False)

    def dome(self, at, r, h, seg=8, mat="lumen", under="cream"):
        """Faceted mushroom cap (two rings + apex) with a flat underside in `under` (30 tris)."""
        coords = [polar(r, 360 * i / seg) for i in range(seg)]
        coords += [polar(r * 0.72, 360 * i / seg, h * 0.62) for i in range(seg)]
        coords.append((0, 0, h))
        faces = [(i, (i + 1) % seg, seg + (i + 1) % seg, seg + i) for i in range(seg)]
        faces += [(seg + i, seg + (i + 1) % seg, 2 * seg) for i in range(seg)]
        faces.append(tuple(range(seg - 1, -1, -1)))
        v = self._mesh(coords, faces)
        self._tag(v, xform(at), mat, False)
        if under not in self.slots:
            self.slots.append(under)
        for f in v[0].link_faces:
            if len(f.verts) == seg:
                f.material_index = self.slots.index(under)
        return v

    def torus(self, R, r, at=(0, 0, 0), rot=(0, 0, 0), seg=12, seg2=6, scale=1.0, mat="cloth_teal",
              smooth=True):
        coords, faces = [], []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            for j in range(seg2):
                b = 2 * math.pi * j / seg2
                rr = R + r * math.cos(b)
                coords.append((rr * math.cos(a), rr * math.sin(a), r * math.sin(b)))
        for i in range(seg):
            for j in range(seg2):
                i2, j2 = (i + 1) % seg, (j + 1) % seg2
                faces.append((i * seg2 + j, i2 * seg2 + j, i2 * seg2 + j2, i * seg2 + j2))
        v = self._mesh(coords, faces)
        return self._tag(v, xform(at, rot, scale), mat, smooth)

    def tube(self, r_out, r_in, h, at=(0, 0, 0), seg=10, mat="stone", smooth=False):
        """Thick ring (basin walls)."""
        coords = []
        for z in (0.0, h):
            for r in (r_out, r_in):
                coords += [(r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)
                           for i in range(seg)]
        ob, ib, ot, it = 0, seg, 2 * seg, 3 * seg
        faces = []
        for i in range(seg):
            j = (i + 1) % seg
            faces += [(ob + i, ob + j, ot + j, ot + i), (ib + j, ib + i, it + i, it + j),
                      (ot + i, ot + j, it + j, it + i), (ob + j, ob + i, ib + i, ib + j)]
        v = self._mesh(coords, faces)
        return self._tag(v, xform(at), mat, smooth)

    def arch(self, rx, rz, thick, depth, at=(0, 0, 0), seg=10, mat="stone", span=(0.0, 1.0)):
        """Semi-elliptical band in the XZ plane (gate arches), extruded along Y. `span` keeps only that
        fraction of the half-ellipse (0 = right springing, 1 = left): a broken arch."""
        def ring(dr):
            if span == (0.0, 1.0):  # unchanged maths for the existing gates (byte-identical GLB)
                return [((rx + dr) * math.cos(math.pi * i / seg), (rz + dr) * math.sin(math.pi * i / seg))
                        for i in range(seg + 1)]
            a0, a1 = span
            return [((rx + dr) * math.cos(math.pi * (a0 + (a1 - a0) * i / seg)),
                     (rz + dr) * math.sin(math.pi * (a0 + (a1 - a0) * i / seg))) for i in range(seg + 1)]

        outer, inner = ring(thick / 2), ring(-thick / 2)
        coords = []
        for y in (-depth / 2, depth / 2):
            coords += [(x, y, z) for x, z in outer] + [(x, y, z) for x, z in inner]
        n = seg + 1
        fo, fi, bo, bi = 0, n, 2 * n, 3 * n
        faces = []
        for i in range(seg):
            faces += [(fo + i, fo + i + 1, fi + i + 1, fi + i), (bo + i + 1, bo + i, bi + i, bi + i + 1),
                      (fo + i + 1, fo + i, bo + i, bo + i + 1), (fi + i, fi + i + 1, bi + i + 1, bi + i)]
        faces += [(fo, fi, bi, bo), (fo + seg, bo + seg, bi + seg, fi + seg)]
        v = self._mesh(coords, faces)
        return self._tag(v, xform(at), mat, False)

    def ribbon(self, points, widths, thick, mat="cloth_teal", smooth=False):
        """Flat strip along a polyline (scarf tails); width stays roughly horizontal."""
        pts = [Vector(p) for p in points]
        coords = []
        for i, p in enumerate(pts):
            t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            side = Vector((0, 0, 1)).cross(t).normalized()
            up = t.cross(side).normalized()
            w = widths[i] / 2
            coords += [p + side * w + up * thick / 2, p - side * w + up * thick / 2,
                       p - side * w - up * thick / 2, p + side * w - up * thick / 2]
        faces = [(0, 1, 2, 3)]
        for i in range(len(pts) - 1):
            a, b = 4 * i, 4 * (i + 1)
            faces += [(a + k, a + (k + 1) % 4, b + (k + 1) % 4, b + k) for k in range(4)]
        last = 4 * (len(pts) - 1)
        faces.append((last + 3, last + 2, last + 1, last))
        v = self._mesh(coords, faces)
        return self._tag(v, Matrix.Identity(4), mat, smooth)

    # -- DES-004 character primitives (used by the A/B variants only)
    def _slot(self, name):
        if name not in self.slots:
            self.slots.append(name)
        return self.slots.index(name)

    def strip(self, points, widths, thick, mats, normal=(0, 1, 0)):
        """Thick cloth strip (capes, scarf ends) along a polyline. Unlike `ribbon`, the flat side
        faces `normal` (one vector, or one per point), so strips can hang down a back or twist.
        `mats`: one palette name, or one per segment (a cheap colour gradient along the cloth)."""
        pts = [Vector(p) for p in points]
        nrms = [Vector(n).normalized() for n in (normal if isinstance(normal[0], (tuple, list)) else
                                                 [normal] * len(pts))]
        mats = [mats] * (len(pts) - 1) if isinstance(mats, str) else list(mats)
        coords = []
        for i, p in enumerate(pts):
            t = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
            side = t.cross(nrms[i]).normalized()
            up = side.cross(t).normalized()
            w = widths[i] / 2
            coords += [p + side * w + up * thick / 2, p - side * w + up * thick / 2,
                       p - side * w - up * thick / 2, p + side * w - up * thick / 2]
        faces = [(0, 1, 2, 3)]
        for i in range(len(pts) - 1):
            a, b = 4 * i, 4 * (i + 1)
            faces += [(a + k, a + (k + 1) % 4, b + (k + 1) % 4, b + k) for k in range(4)]
        last = 4 * (len(pts) - 1)
        faces.append((last + 3, last + 2, last + 1, last))
        v = self._mesh(coords, faces)
        self._tag(v, Matrix.Identity(4), mats[0], False)
        index = {vert: i for i, vert in enumerate(v)}
        for f in linked(v, "link_faces"):
            seg = min(min(index[x] for x in f.verts) // 4, len(pts) - 2)
            f.material_index = self._slot(mats[seg])
        return v

    def lock(self, base, d1, d2, length, width, thick, mat="hero_silver_tip", up=(0, 0, 1), bend=0.55,
             mid=0.62):
        """Curved hair lock / spike with a diamond section: from `base` along d1, bending at `bend`
        of its length towards d2. `up` is the surface normal at the root: the lock lies flat on it
        (its width runs along the surface), so overlapping locks read as layered hair."""
        base, up = Vector(base), Vector(up).normalized()
        d1, d2 = Vector(d1).normalized(), Vector(d2).normalized()

        def ring(c, d, s):
            w = d.cross(up)
            if w.length < 1e-4:
                w = d.cross(Vector((1, 0, 0)))
            w.normalize()
            t = w.cross(d).normalized()
            return [c + w * width * s / 2, c + t * thick * s / 2, c - w * width * s / 2, c - t * thick * s / 2]

        m = base + d1 * length * bend
        tip = m + d2 * length * (1 - bend)
        coords = ring(base, d1, 1.0) + ring(m, (d1 + d2).normalized(), mid) + [tip]
        faces = [(3, 2, 1, 0)] + [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)]
        faces += [(4 + i, 4 + (i + 1) % 4, 8) for i in range(4)]
        v = self._mesh(coords, faces)
        return self._tag(v, Matrix.Identity(4), mat, False)

    def shard(self, at, h, r, direction=(0, 0, 1), tip=None, sides=6, yaw=0.0, taper=0.86, sink=0.3,
              mats=("lumen", "crystal_mid", "crystal_violet"), split=0.38, edge=None, x_hint=(1, 0, 0),
              squash=1.0):
        """Chunky crystal with a vertical colour gradient (DES-004 step 3: lumen at the root, violet at
        the tip, done with flat materials instead of vertex colours): lower walls mats[0], upper walls
        mats[1], cap mats[2]. Each entry is a palette name or a tuple cycled facet by facet (light /
        dark facets are what make a flat-shaded crystal read as cut). `edge` paints every third cap
        facet (sparkle). `squash` < 1 flattens the section (blade-like crest crystals)."""
        tip = r * 1.5 if tip is None else tip
        rings = ((-sink * h, 1.0), (split * h, 1.0 - (1.0 - taper) * 0.5), (h, taper))
        coords = []
        for z, k in rings:
            for i in range(sides):
                a = math.radians(yaw) + 2 * math.pi * i / sides
                coords.append((r * k * math.cos(a), r * k * squash * math.sin(a), z))
        coords.append((0.0, 0.0, h + tip))
        apex = len(coords) - 1
        bands = [(m,) if isinstance(m, str) else tuple(m) for m in mats]
        faces, names = [], []
        for ring_i in range(2):
            for i in range(sides):
                j = (i + 1) % sides
                a, b = ring_i * sides, (ring_i + 1) * sides
                faces.append((a + i, a + j, b + j, b + i))
                names.append(bands[ring_i][i % len(bands[ring_i])])
        for i in range(sides):
            faces.append((2 * sides + i, 2 * sides + (i + 1) % sides, apex))
            names.append(edge if edge and i % 3 == 0 else bands[2][i % len(bands[2])])
        v = self._mesh(coords, faces, closed=False)
        self._tag(v, Matrix.Translation(Vector(at)) @ basis(direction, x_hint), names[0], False)
        for face, name in zip(faces, names):
            self.bm.faces.get([v[k] for k in face]).material_index = self._slot(name)
        return v


    def broken_spire(self, at, h, r, sides=7, yaw=0.0, direction=(0, 0, 1), sink=0.05, taper=0.7,
                     slope=0.55, peak=(0.35, 0.1, 0.9), mats=(("lumen", "prism_cyan"), "crystal_mid",
                     ("prism_edge", "crystal_violet", "crystal_mid"))):
        """Tall faceted crystal whose tip is snapped off (DES-004 `crystal_spire`): 3-ring tapered prism, the
        top ring cut along a slanted plane (`slope` = rise per metre across local +X), capped by a low faceted
        stub whose apex sits off-centre (`peak` = x, y as fractions of r, height above the cut as a fraction
        of r). Wall bands like `shard`: lower mats[0], upper mats[1], broken cap mats[2]."""
        rings = ((-sink * h, 1.0), (0.45 * h, 1.0 - (1.0 - taper) * 0.45), (h, taper))
        coords = []
        for ri, (z, k) in enumerate(rings):
            for i in range(sides):
                a = math.radians(yaw) + 2 * math.pi * i / sides
                x, y = r * k * math.cos(a), r * k * math.sin(a)
                coords.append((x, y, z + (slope * x if ri == 2 else 0.0)))
        coords.append((peak[0] * r, peak[1] * r, h + peak[2] * r))
        apex = len(coords) - 1
        bands = [(m,) if isinstance(m, str) else tuple(m) for m in mats]
        faces, names = [], []
        for ring_i in range(2):
            for i in range(sides):
                j = (i + 1) % sides
                a, b = ring_i * sides, (ring_i + 1) * sides
                faces.append((a + i, a + j, b + j, b + i))
                names.append(bands[ring_i][i % len(bands[ring_i])])
        for i in range(sides):
            faces.append((2 * sides + i, 2 * sides + (i + 1) % sides, apex))
            names.append(bands[2][i % len(bands[2])])
        v = self._mesh(coords, faces, closed=False)
        self._tag(v, Matrix.Translation(Vector(at)) @ basis(direction), names[0], False)
        for face, name in zip(faces, names):
            self.bm.faces.get([v[k] for k in face]).material_index = self._slot(name)
        return v


# ----------------------------------------------------------------------------- objects
def kit_collection():
    coll = bpy.data.collections.get(KIT_COLLECTION)
    if coll is None:
        coll = bpy.data.collections.new(KIT_COLLECTION)
        bpy.context.scene.collection.children.link(coll)
    return coll


def empty(name):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.3
    kit_collection().objects.link(obj)
    return obj


def apply_modifiers(obj):
    """Bake the modifier stack into the mesh so the GLB gets exactly what we see."""
    dg = bpy.context.evaluated_depsgraph_get()
    baked = bpy.data.meshes.new_from_object(obj.evaluated_get(dg), preserve_all_data_layers=True,
                                            depsgraph=dg)
    old = obj.data
    name = old.name
    obj.modifiers.clear()
    obj.data = baked
    bpy.data.meshes.remove(old)
    baked.name = name


def finish(part, parent=None, pivot=(0, 0, 0), bevel=0.04):
    """Turn a Part into an object. Geometry is authored in asset space (feet at origin);
    `pivot` becomes the object origin (e.g. the neck for a head, the grip for a sword)."""
    bm = part.bm
    if min(v.co.z for v in bm.verts) < -1e-4:  # nothing may poke through the ground plane
        cut_below(bm, list(bm.verts), 0.0)
    use_bevel = any(e[part.bevel] > 0 for e in bm.edges)
    if not use_bevel:
        bm.edges.layers.float.remove(part.bevel)
    bmesh.ops.translate(bm, vec=-Vector(pivot), verts=bm.verts)
    me = bpy.data.meshes.new(part.name + "_geo")
    bm.to_mesh(me)
    bm.free()
    for m in part.slots:
        me.materials.append(material(m))
    obj = bpy.data.objects.new(part.name, me)
    kit_collection().objects.link(obj)
    obj.parent = parent
    obj.location = pivot
    if use_bevel:
        mod = obj.modifiers.new("chunky_bevel", "BEVEL")
        mod.limit_method = "WEIGHT"
        mod.width = bevel
        mod.segments = 1
        apply_modifiers(obj)
        if "bevel_weight_edge" in obj.data.attributes:
            obj.data.attributes.remove(obj.data.attributes["bevel_weight_edge"])
    obj.data.set_sharp_from_angle(angle=math.radians(50))
    return obj


# ============================================================================= characters
def _hero_body_core(b):
    """Legs, tunic, shirt, belt, pouch, arms and shoulder pads (identical in every variant).
    Returns the right-hand grip position (the sword pivot)."""
    for s in (-1, 1):  # s = -1 is the hero's right side (-X when facing -Y)
        x = 0.1 * s
        b.limb((x, 0.0, 0.06), (x, 0.0, 0.34), 0.075, 0.085, seg=8, mat="navy")
        b.ico(0.1, at=(x, -0.035, 0.065), scale=(0.95, 1.3, 0.68), sub=1, mat="bark", smooth=True)
        b.cyl(0.084, 0.035, at=(x, 0, 0.19), seg=8, mat="gold")
    b.cyl(0.255, 0.27, at=(0, 0, 0.25), r2=0.205, seg=10, mat="navy", smooth=True)  # tunic skirt
    b.cyl(0.205, 0.33, at=(0, 0, 0.5), r2=0.165, seg=10, mat="cream", smooth=True)  # shirt
    b.cyl(0.218, 0.06, at=(0, 0, 0.49), seg=10, mat="bark", smooth=True)  # belt
    b.box((0.085, 0.04, 0.065), at=(0, -0.215, 0.52), mat="gold", bevel=True)  # buckle
    b.box((0.13, 0.08, 0.12), at=(0.2, 0.08, 0.42), rot=(0, 0, -20), mat="bark", bevel=True)  # pouch
    shoulder_r, hand_r = Vector((-0.185, 0.0, 0.77)), Vector((-0.29, -0.14, 0.52))
    shoulder_l, hand_l = Vector((0.185, 0.0, 0.77)), Vector((0.29, 0.03, 0.5))
    for sh, hd in ((shoulder_r, hand_r), (shoulder_l, hand_l)):
        b.limb(sh, hd + (hd - sh).normalized() * -0.03, 0.068, 0.058, seg=8, mat="cream")
        b.ico(0.066, at=hd, sub=1, mat="skin", smooth=True)
        b.ico(0.112, at=sh, scale=(1.04, 0.99, 0.62), sub=2, mat="gold", smooth=True)
        b.ico(0.101, at=sh + Vector((0, 0, 0.022)), scale=(1.0, 0.93, 0.6), sub=2,
              mat="hero_violet", smooth=True)
    return hand_r


def _hero_tails(b):
    """The owner-approved violet + silver tails streaming back to the hero's left (r0). DES-006 §3:
    not changed without an owner comparison, so every variant builds them exactly like this."""
    b.ribbon([(0.06, 0.15, 0.87), (0.2, 0.29, 0.83), (0.36, 0.4, 0.75), (0.5, 0.47, 0.67), (0.6, 0.5, 0.6)],
             [0.23, 0.25, 0.21, 0.15, 0.06], 0.04, mat="hero_violet")
    b.ribbon([(0.0, 0.17, 0.84), (0.1, 0.32, 0.76), (0.22, 0.44, 0.66), (0.3, 0.5, 0.56)],
             [0.15, 0.16, 0.13, 0.05], 0.04, mat="hero_silver")
    b.box((0.1, 0.035, 0.09), at=(0.6, 0.5, 0.57), rot=(-25, 0, 30), mat="gold", bevel=True)  # tail clasp


def _hero_face(h, hc, hr):
    for s in (-1, 1):
        h.stud(hc, hr, (0.36 * s, -1, -0.12), (0.042, 0.062, 0.026), "ink", sub=2)  # eyes
        h.stud(hc, hr, (0.30 * s, -1, -0.02), (0.015, 0.015, 0.012), "white", inset=-0.6, sub=1)
        h.stud(hc, hr, (0.66 * s, -1, -0.38), (0.045, 0.028, 0.012), "blossom")  # cheeks
    h.stud(hc, hr, (0, -1, -0.42), (0.022, 0.012, 0.01), "ink", sub=1)  # small mouth


def _hero_sword(root, g):
    """Chime Blade: lumen crystal blade, gold guard (already matches DES-004 step 4; same in every variant)."""
    s = Part("hero_sword")  # pivot: centre of the grip (in the right hand)
    s.cyl(0.028, 0.17, at=g + Vector((0, 0, -0.085)), seg=6, mat="bark")
    s.ico(0.044, at=g + Vector((0, 0, -0.11)), sub=1, mat="gold", smooth=True)  # pommel
    s.box((0.24, 0.065, 0.05), at=g + Vector((0, 0, 0.1)), mat="gold", bevel=True)  # guard
    s.ico(0.065, at=g + Vector((0, 0, 0.12)), scale=(0.8, 0.75, 1.15),
          sub=1, mat="crystal_violet")
    for sx in (-1, 1):  # the "chimes": little bells hanging from the guard
        s.cyl(0.032, 0.05, at=g + Vector((0.11 * sx, 0, 0.03)), seg=6, r2=0.012, mat="gold")
    s.blade(g + Vector((0, 0, 0.12)), 0.6, 0.12, 0.145, 0.045, 0.14, mat="lumen")
    s.box((0.03, 0.05, 0.42), at=g + Vector((0, 0, 0.36)), mat="crystal_mid")  # fuller inlay
    s.tilt((15, -22, 0), g)  # rest pose: blade leans forward and away from the face
    finish(s, parent=root, pivot=tuple(g), bevel=0.012)


def build_hero_r0():
    """r0 = the owner-approved DES-003 prismatic Wayfarer (2026-11-21), kept for reference builds."""
    root = empty("hero")

    b = Part("hero_body")  # pivot: feet
    hand_r = _hero_body_core(b)
    # scarf: chunky collar + two tails streaming back and to the hero's left
    b.torus(0.165, 0.07, at=(0, 0, 0.845), seg=12, seg2=6, scale=(1.0, 1.0, 0.9), mat="cloth_teal")
    _hero_tails(b)
    finish(b, parent=root)

    h = Part("hero_head")  # pivot: neck
    hc, hr = Vector((0, 0, 1.14)), (0.30, 0.29, 0.285)
    h.sphere(1.0, at=hc, scale=hr, seg=14, rings=9, mat="skin")
    h.sphere(1.0, at=hc + Vector((0, 0.045, 0.05)), scale=(0.318, 0.31, 0.3), seg=14, rings=9,
             mat="hero_silver")
    _hero_fringe_r0(h)
    for x, y, z, tx, ty, tz in ((0.0, 0.02, 1.4, 0.0, 0.27, 1.52), (-0.13, 0.12, 1.32, -0.17, 0.36, 1.29),
                                (0.13, 0.12, 1.32, 0.17, 0.36, 1.29), (0.0, 0.2, 1.22, 0.0, 0.38, 1.12)):
        h.limb((x, y, z), (tx, ty, tz), 0.1, 0.0, seg=5, mat="hero_silver_tip", smooth=False,
               scale=(1.0, 0.6))  # swept back, so the silhouette never reads as ears
    _hero_face(h, hc, hr)
    finish(h, parent=root, pivot=(0, 0, 0.86))

    _hero_sword(root, hand_r)
    return root


def _hero_fringe_r0(h):
    """Four faceted fringe locks over the forehead (r0; variant A keeps them)."""
    for x, tz in ((-0.17, 1.2), (-0.07, 1.22), (0.05, 1.23), (0.16, 1.21)):
        h.limb((x * 0.9, -0.17, 1.38), (x * 1.08, -0.3, tz), 0.085, 0.0, seg=5, mat="hero_silver_tip",
               smooth=False, scale=(1.0, 0.55))


def build_hero_des004(variant):
    """DES-004 step 4 (Wayfarer). Both variants keep the r0 body, face, sword and the owner-approved
    violet/silver tails, and add: spiky silver locks that break the round head outline seen from
    behind, a violet cape split into two tails, a chunkier teal scarf with a visible teal end
    (DES-006 §3) and gold trim on the belt.
    Hair: 7-9 locks in total; they run down the head from the crown and flick their tips out, so
    the outline seen from the gameplay camera (behind, ~30 deg above) is jagged, not a helmet.
      A = conservative: r0 hair cap + r0 fringe (4 locks); the four small r0 back tufts become four
          wide back locks + a crown cowlick (9); short cape (hip length); the teal scarf end hangs
          down the back, just off the cape split so both stay visible.
      B = silhouette-first: darker cap under two tiers of bigger locks, new fringe (3 + 4 + 2 = 9),
          the side locks flick far out; long cape (calf length) whose tails flare apart and turn
          outwards; long teal scarf end streaming to the hero's right (mirrors the violet tail)
          + a knot at the front."""
    bold = variant == "B"
    root = empty("hero")

    b = Part("hero_body")  # pivot: feet
    hand_r = _hero_body_core(b)
    for z in (0.484, 0.545):  # gold trim on both belt edges (DES-004: gold at shoulders and belt)
        b.cyl(0.226, 0.016, at=(0, 0, z), seg=10, mat="gold", smooth=True)
    b.torus(0.178 if bold else 0.172, 0.09 if bold else 0.082, at=(0, 0, 0.84), seg=12, seg2=6,
            scale=(1.0, 1.0, 0.95), mat="cloth_teal")  # scarf wrap, chunkier than r0
    _hero_tails(b)
    cape = ["synes_violet", "synes_violet", "hero_violet", "hero_violet"]  # light -> deep violet
    if not bold:
        for s in (-1, 1):  # two tails meeting under the collar, a V split opening from the waist down
            b.strip([(0.095 * s, 0.2, 0.8), (0.115 * s, 0.245, 0.62), (0.14 * s, 0.28, 0.45),
                     (0.16 * s, 0.3, 0.33)], [0.2, 0.19, 0.15, 0.035], 0.03, cape[1:])
        b.strip([(-0.05, 0.255, 0.83), (-0.065, 0.275, 0.72), (-0.08, 0.29, 0.63), (-0.09, 0.3, 0.57)],
                [0.14, 0.14, 0.12, 0.05], 0.035, "cloth_teal")  # scarf end down the back, off the split
    else:
        for s in (-1, 1):  # longer tails that flare apart and turn outwards
            b.strip([(0.1 * s, 0.2, 0.8), (0.13 * s, 0.26, 0.6), (0.165 * s, 0.31, 0.4), (0.2 * s, 0.35, 0.24),
                     (0.235 * s, 0.38, 0.13)], [0.21, 0.22, 0.21, 0.15, 0.03], 0.03, cape,
                    normal=[(0.0, 1, 0), (0.1 * s, 1, 0), (0.2 * s, 1, 0), (0.3 * s, 1, 0), (0.35 * s, 1, 0)])
        b.ribbon([(-0.06, 0.2, 0.85), (-0.17, 0.31, 0.79), (-0.28, 0.4, 0.71), (-0.38, 0.46, 0.63)],
                 [0.18, 0.19, 0.15, 0.05], 0.045, mat="cloth_teal")  # scarf end to the hero's right
        b.ico(0.075, at=(-0.1, -0.235, 0.8), scale=(1.1, 0.8, 0.9), sub=1, mat="cloth_teal")  # front knot
    finish(b, parent=root)

    h = Part("hero_head")  # pivot: neck
    hc, hr = Vector((0, 0, 1.14)), (0.30, 0.29, 0.285)
    h.sphere(1.0, at=hc, scale=hr, seg=14, rings=9, mat="skin")
    cap_c, cap_r = hc + Vector((0, 0.045, 0.05)), (0.318, 0.31, 0.3)

    def cap_point(polar, az):
        """Point + normal on the hair cap; polar 0 = top, az 90 = back (+Y), az 0 = hero's left (+X)."""
        t, a = math.radians(polar), math.radians(az)
        return on_ellipsoid(cap_c, cap_r, (math.sin(t) * math.cos(a), math.sin(t) * math.sin(a), math.cos(t)))

    def flow_lock(polar, az, length, width, thick, flick, lift=0.15, mat="hero_silver_tip", sink=0.03):
        """Lock rooted on the cap that runs down the head (along the meridian) and flicks its tip out."""
        p, n = cap_point(polar, az)
        t, a = math.radians(polar), math.radians(az)
        down = Vector((math.cos(t) * math.cos(a), math.cos(t) * math.sin(a), -math.sin(t)))
        down = (down - n * down.dot(n)).normalized()
        h.lock(p - n * sink, down + n * lift, down + n * flick, length, width, thick, mat=mat, up=n)

    if not bold:  # r0 cap and fringe; four wide back locks + a crown cowlick replace the four r0 tufts
        h.sphere(1.0, at=cap_c, scale=cap_r, seg=14, rings=9, mat="hero_silver")
        _hero_fringe_r0(h)
        for az in (12, 62, 118, 168):
            flow_lock(42, az, 0.36, 0.26, 0.08, flick=0.75 if az in (12, 168) else 0.5)
        flow_lock(12, 90, 0.25, 0.2, 0.08, flick=0.35, lift=0.9)  # cowlick: up, then back
    else:  # darker cap under two tiers of bigger locks, new fringe: 3 + 4 + 2 = 9 locks
        h.sphere(1.0, at=cap_c, scale=cap_r, seg=14, rings=9, mat="hero_silver_shade")
        for x in (-0.42, 0.0, 0.42):  # fringe
            p, n = on_ellipsoid(cap_c, cap_r, (x, -0.8, 0.55))
            h.lock(p - n * 0.03, (x * 0.5, -1, -0.25), (x * 0.4, -0.3, -1), 0.24, 0.2 if x else 0.22, 0.07,
                   up=n)
        for az in (8, 60, 120, 172):  # upper tier: from the crown, rising first, flicking far out
            flow_lock(24, az, 0.42, 0.3, 0.09, flick=0.85 if az in (8, 172) else 0.7, lift=0.45)
        for az in (62, 118):  # lower tier at the nape, flicking out under the upper locks
            flow_lock(80, az, 0.3, 0.24, 0.08, flick=0.9, mat="hero_silver")
    _hero_face(h, hc, hr)
    finish(h, parent=root, pivot=(0, 0, 0.86))

    _hero_sword(root, hand_r)
    return root


def build_hero():
    if CHAR_VARIANT == "r0":
        return build_hero_r0()
    return build_hero_des004(CHAR_VARIANT)


def build_puffcap():
    """Chubby mushroom critter; the cap is a cloud of puffs with cream spots."""
    root = empty("puffcap")

    st = Part("puffcap_stem")  # pivot: feet
    # the belly bulges forward so the face clears the cap rim from the high game camera
    sc, sr = Vector((0, -0.03, 0.33)), (0.33, 0.32, 0.33)
    st.sphere(1.0, at=sc, scale=sr, seg=12, rings=8, mat="cream")
    for s in (-1, 1):
        st.ico(0.08, at=(0.14 * s, -0.1, 0.035), scale=(1.0, 1.3, 0.55), sub=2, mat="path", smooth=True)
        st.ico(0.065, at=(0.32 * s, -0.04, 0.27), scale=(0.8, 0.8, 1.1), sub=1, mat="cream", smooth=True)
        st.stud(sc, sr, (0.33 * s, -1, 0.06), (0.046, 0.058, 0.04), "ink", sub=2)
        st.stud(sc, sr, (0.28 * s, -1, 0.15), (0.015, 0.015, 0.012), "white", inset=-0.9, sub=1)
        st.stud(sc, sr, (0.62 * s, -1, -0.1), (0.055, 0.034, 0.012), "blossom")
    st.stud(sc, sr, (0, -1, -0.12), (0.032, 0.024, 0.015), "ink")  # little "o" mouth
    finish(st, parent=root)

    cp = Part("puffcap_cap")  # pivot: where cap meets stem (squash point)
    dc, dr = Vector((0, 0.04, 0.6)), (0.4, 0.4, 0.31)
    cp.sphere(1.0, at=dc, scale=dr, seg=14, rings=8, mat="blossom", cut=0.6)
    cp.cyl(0.38, 0.07, at=(0, 0.04, 0.55), seg=14, mat="path")  # gills
    for i in range(7):
        p = polar(0.33, 90 + i * 360 / 7, 0.63) + Vector((0, 0.04, 0))
        cp.sphere(0.135, at=p, scale=(1, 1, 0.8), seg=10, rings=6, mat="blossom")
        if i % 2 == 0:
            cp.stud(p, (0.135, 0.135, 0.108), (p.x, p.y - 0.04, 0.9), (0.05, 0.05, 0.02), "cream", sub=1)
    for el, az in ((72, 90), (52, 215), (52, 335), (35, 150), (36, 25), (30, 270)):
        d = (math.cos(math.radians(az)) * math.cos(math.radians(el)),
             math.sin(math.radians(az)) * math.cos(math.radians(el)), math.sin(math.radians(el)))
        cp.stud(dc, dr, d, (0.07, 0.07, 0.025), "cream", sub=1, smooth=False)
    for sx in (-1, 1):  # sprout on top
        cp.limb((0, 0.04, 0.88), (0.1 * sx, 0.06, 1.0), 0.045, 0.0, seg=4, mat="leaf", smooth=False,
                scale=(1.0, 0.35))
    cp.tilt((-10, 0, 0), (0, 0, 0.56))  # jaunty tilt back: lifts the front rim off the face
    finish(cp, parent=root, pivot=(0, 0, 0.56))
    return root


def build_thornling():
    """Round seed-pod critter with swept-back leaf thorns tipped in violet."""
    root = empty("thornling")
    b = Part("thornling_body")  # pivot: feet (squash/charge lean)
    c, r = Vector((0, 0, 0.4)), (0.35, 0.33, 0.32)
    b.sphere(1.0, at=c, scale=r, seg=12, rings=8, mat="leaf")
    for sx in (-1, 1):
        for sy in (-1, 1):
            b.ico(0.085, at=(0.18 * sx, 0.12 * sy, 0.055), scale=(1, 1.2, 0.7), sub=1, mat="leaf_dark",
                  smooth=True)
    rows = ((78, 4, 0.0, 0.3), (48, 7, 0.5, 0.28), (18, 7, 0.0, 0.24))
    for el, n, phase, ln in rows:
        for i in range(n):
            az = 90 + (i + phase) * 360 / n  # azimuth 90 = +Y = back
            d = Vector((math.cos(math.radians(az)) * math.cos(math.radians(el)),
                        math.sin(math.radians(az)) * math.cos(math.radians(el)),
                        math.sin(math.radians(el))))
            if d.y < -0.45 and el < 60:
                continue  # keep the face clear
            base, nrm = on_ellipsoid(c, r, d)
            sweep = (nrm + Vector((0, 0.75, 0.25))).normalized()
            tangent = Vector((-d.y, d.x, 0)) if abs(d.z) < 0.95 else Vector((1, 0, 0))
            length = ln * b.rng.uniform(0.9, 1.1)
            b.thorn(base - nrm * 0.05, sweep, length, 0.13, 0.05, x_hint=tangent)
    b.thorn(c + Vector((0, 0.3, 0.02)), (0, 1, 0.1), 0.2, 0.1, 0.04)  # tail
    for s in (-1, 1):
        b.stud(c, r, (0.4 * s, -1, 0.15), (0.075, 0.085, 0.035), "white", sub=2)
        b.stud(c, r, (0.38 * s, -1, 0.12), (0.04, 0.05, 0.03), "ink", inset=-0.2, sub=2)
        p, n = on_ellipsoid(c, r, (0.4 * s, -1, 0.5))
        b.box((0.13, 0.05, 0.04), at=p + n * 0.01, rot=(0, -18 * s, 0), mat="leaf_dark", bevel=True)
    b.stud(c, r, (0, -1, -0.05), (0.04, 0.03, 0.03), "leaf_dark")  # snout
    finish(b, parent=root, bevel=0.012)
    return root


def build_prismback_r0():
    """r0 = the owner-approved DES-003 Prismback (2026-11-21): crystal-armored tortoise with a low,
    broad stance. Faces -Y (glTF +Z). Kept for reference builds."""
    root = empty("prismback")
    cyan = ("prism_cyan", "lumen", "crystal_mid")
    violet = ("prism_violet", "crystal_violet", "crystal_mid")

    legs = Part("prismback_legs")  # pivot: ground centre
    for y in (-1.08, 0.15, 1.22):
        for sx in (-1, 1):
            hip = Vector((1.04 * sx, y + 0.14, 1.05))
            knee = Vector((1.44 * sx, y - 0.14, 0.58))
            foot = Vector((1.58 * sx, y - 0.28, 0.19))
            legs.limb(hip, knee, 0.38, 0.32, seg=6, mat="prism_slate", smooth=False)
            legs.limb(knee, foot, 0.34, 0.28, seg=6, mat="stone_dark", smooth=False)
            legs.ico(1.0, at=knee, scale=(0.32, 0.39, 0.27), sub=1, mat="stone")
            legs.ico(1.0, at=foot, scale=(0.37, 0.41, 0.2), sub=1, mat="prism_slate")
            for toe in (-1, 0, 1):
                claw = foot + Vector((0.18 * toe, -0.25, 0.0))
                legs.crystal(claw, 0.13, 0.105, direction=(toe * 0.13, -1, -0.34),
                             tip=0.12, mat="crystal_mid", sides=4, facets=cyan)
    finish(legs, parent=root)

    body = Part("prismback_body")  # pivot: ground centre
    body.sphere(1.0, at=(0, 0.12, 0.9), scale=(1.4, 1.85, 0.45), seg=14, rings=8, mat="prism_slate")
    body.limb((0, -1.1, 0.95), (0, -1.65, 1.05), 0.5, 0.45, seg=8, mat="prism_slate", smooth=False)
    hc, hr = Vector((0, -1.86, 1.1)), (0.7, 0.6, 0.55)
    body.sphere(1.0, at=hc, scale=hr, seg=12, rings=8, mat="stone_dark", smooth=False)
    body.box((0.9, 0.64, 0.24), at=(0, -2.04, 0.74), mat="prism_slate", bevel=True)
    body.ico(1.0, at=(0, -2.27, 0.93), scale=(0.39, 0.29, 0.22), sub=1, mat="stone")
    for s in (-1, 1):
        body.stud(hc, hr, (0.59 * s, -1, 0.19), (0.15, 0.11, 0.075), "ink", sub=2)
        body.stud(hc, hr, (0.61 * s, -1, 0.19), (0.094, 0.035, 0.032), "prism_cyan", inset=-0.95)
        p, n = on_ellipsoid(hc, hr, (0.56 * s, -1, 0.56))
        body.thorn(p - n * 0.05, (s * 0.55, -0.65, 0.42), 0.36, 0.28, 0.18,
                   mat="prism_slate", tip_mat="prism_trim")
        body.stud(hc, hr, (s, -0.35, 0.03), (0.26, 0.22, 0.1), "prism_trim", smooth=False)
    hp, _ = on_ellipsoid(hc, hr, (0, -1, 0.95))
    horn_dir = Vector((0, -0.58, 1.0)).normalized()
    body.limb(hp - horn_dir * 0.08, hp + horn_dir * 0.06, 0.26, 0.23, seg=6, mat="prism_trim",
              smooth=False)
    body.limb((0, 1.9, 0.9), (0, 2.25, 0.78), 0.22, 0.0, seg=6, mat="prism_slate", smooth=False)
    finish(body, parent=root, bevel=0.05)

    shell = Part("prismback_shell")  # pivot: ground centre
    sc, sr = Vector((0, 0.12, 1.0)), (1.65, 1.9, 1.15)
    shell.sphere(1.0, at=sc, scale=sr, seg=14, rings=10, mat="prism_slate", smooth=False, cut=1.0)
    shell.torus(1.0, 0.1, at=(0, 0.12, 1.03), seg=20, seg2=4, scale=(1.64, 1.88, 1.0), mat="prism_trim")

    def on_shell(fx, fy):
        uz = math.sqrt(max(0.0, 1.0 - fx * fx - fy * fy))
        p = sc + Vector((sr[0] * fx, sr[1] * fy, sr[2] * uz))
        return p, Vector((fx / sr[0], fy / sr[1], uz / sr[2])).normalized()

    for i in range(12):
        az = math.radians(i * 30 + 15)
        p, n = on_shell(0.89 * math.cos(az), 0.89 * math.sin(az))
        for inset, radius, top_radius, height, name in (
            (-0.10, 0.39, 0.33, 0.15, "prism_trim"),
            (0.035, 0.34, 0.25, 0.13, "stone_dark"),
        ):
            plate = shell.cyl(radius, height, seg=5, mat=name, r2=top_radius)
            bmesh.ops.transform(shell.bm, matrix=Matrix.Translation(p + n * inset) @ basis(n, (0, 0, 1)),
                                verts=plate)

        shard, normal = on_shell(0.73 * math.cos(az), 0.73 * math.sin(az))
        shell.crystal(shard, 0.26 + 0.08 * (i % 3), 0.18, direction=normal + Vector((0, 0, 0.4)),
                      tip=0.24, mat="crystal_violet", yaw=i * 23, facets=violet if i % 3 else cyan)

    core, _ = on_shell(0, 0.05)
    shell.crystal(core, 0.69, 0.35, direction=(0, 0.08, 1), tip=0.54, mat="crystal_violet", facets=violet)
    for fx, fy, h, r, colors in (
        (-0.43, -0.31, 0.53, 0.29, violet), (0.43, -0.31, 0.51, 0.29, cyan),
        (-0.42, 0.31, 0.61, 0.28, cyan), (0.42, 0.31, 0.63, 0.29, violet),
        (-0.14, -0.54, 0.42, 0.21, cyan), (0.16, 0.58, 0.55, 0.21, violet),
    ):
        p, n = on_shell(fx, fy)
        shell.crystal(p, h, r, direction=n + Vector((0, 0, 0.48)), tip=h * 0.72, mat=colors[0],
                      yaw=fy * 230, facets=colors)
    finish(shell, parent=root)

    horn = Part("prismback_horn")  # pivot: base on forehead
    horn.crystal(hp, 0.49, 0.21, direction=horn_dir, tip=0.31, mat="crystal_mid", facets=cyan)
    for s in (-1, 1):
        horn.crystal(hp + Vector((s * 0.23, 0.045, -0.04)), 0.28, 0.12,
                     direction=horn_dir + Vector((s * 0.87, 0, 0)), tip=0.2,
                     mat="crystal_violet", facets=violet)
    finish(horn, parent=root, pivot=tuple(hp))
    return root


def build_prismback_des004(variant):
    """DES-004 step 3 (Prismback). Both variants: stone #B9B4C7 armour over a stone_dark body,
    armour plates with a gold (prism_trim) rim, glowing lumen cracks on the shins and flanks, fewer
    but much chunkier back crystals (lumen root -> crystal_mid -> violet tip, flat materials) rising
    to the tallest one in the middle, a bigger lighter head with a crystal crest and lumen eyes.
    The boss keeps one draw call per material per node in the game (models.ts KEEP_SEPARATE), so the
    palette per node is kept smaller than r0 (28 primitives).
      A = conservative: r0 body/legs/dome proportions, 7 plates round the lower dome, 11 crystals
          (1 + ring of 4 + ring of 6), head x1.14.
      B = silhouette-first: lower wider dome, 8 thick pentagon plates whose points jut out over the
          rim (scalloped armour edge), 9 crystals as a stepped pyramid (1 + 4 leaning diagonals +
          4 small), head x1.29 with a brow plate, chunkier legs."""
    bold = variant == "B"
    root = empty("prismback")
    grad = ("lumen", "crystal_mid", "crystal_violet")  # root -> tip (small crest crystals)
    # back crystals: the same gradient with light/dark facets alternating in every band
    cut = (("lumen", "crystal_mid"), ("crystal_mid", "prism_violet"), ("crystal_violet", "prism_violet"))

    legs = Part("prismback_legs")  # pivot: ground centre
    k = 1.12 if bold else 1.0
    for y in (-1.08, 0.15, 1.22):
        for sx in (-1, 1):
            hip = Vector((1.04 * sx, y + 0.14, 1.05))
            knee = Vector((1.44 * sx, y - 0.14, 0.58))
            foot = Vector((1.58 * sx, y - 0.28, 0.19))
            legs.limb(hip, knee, 0.38 * k, 0.32 * k, seg=6, mat="stone_dark", smooth=False)
            legs.limb(knee, foot, 0.34 * k, 0.28 * k, seg=6, mat="stone_dark", smooth=False)
            legs.ico(1.0, at=knee, scale=(0.32 * k, 0.39 * k, 0.27 * k), sub=1, mat="stone")
            legs.ico(1.0, at=foot, scale=(0.37 * k, 0.41 * k, 0.2), sub=1, mat="stone")
            out, shin = Vector((sx, 0, 0)), foot - knee
            crack = [knee + shin * f + out * (0.34 + (0.28 - 0.34) * f) * k + Vector((0, 0.07 * (-1) ** i, 0))
                     for i, f in enumerate((0.1, 0.38, 0.64, 0.9))]
            legs.strip(crack, [0.08, 0.07, 0.07, 0.03], 0.05, "lumen", normal=out)  # glowing crack
            for toe in (-1, 0, 1):
                claw = foot + Vector((0.18 * toe, -0.25, 0.0))
                legs.crystal(claw, 0.13, 0.105, direction=(toe * 0.13, -1, -0.34), tip=0.12, mat="lumen", sides=4)
    finish(legs, parent=root)

    body = Part("prismback_body")  # pivot: ground centre
    body.sphere(1.0, at=(0, 0.12, 0.9), scale=(1.4, 1.85, 0.45), seg=14, rings=8, mat="stone_dark")
    hc, hr = (Vector((0, -2.0, 1.2)), (0.9, 0.74, 0.66)) if bold else (Vector((0, -1.92, 1.14)), (0.8, 0.67, 0.6))
    hs = hr[0] / 0.7  # head scale vs r0
    body.limb((0, -1.1, 0.95), (0, hc.y + 0.2, hc.z - 0.04), 0.52, 0.48, seg=8, mat="stone_dark", smooth=False)
    body.sphere(1.0, at=hc, scale=hr, seg=12, rings=8, mat="stone", smooth=False)
    body.box((0.9 * hs, 0.64 * hs, 0.24 * hs), at=(0, hc.y - 0.17 * hs, hc.z - 0.36 * hs), mat="stone_dark",
             bevel=True)  # jaw
    body.ico(1.0, at=(0, hc.y - 0.41 * hs, hc.z - 0.17 * hs), scale=(0.39 * hs, 0.29 * hs, 0.22 * hs), sub=1,
             mat="stone_dark")  # snout
    for s in (-1, 1):
        body.stud(hc, hr, (0.55 * s, -1, 0.16), (0.18, 0.15, 0.09), "ink", sub=2)  # eye socket (dark rim)
        body.stud(hc, hr, (0.56 * s, -1, 0.16), (0.145, 0.115, 0.06), "lumen", inset=-1.0)  # glowing eye dot
        p, n = on_ellipsoid(hc, hr, (0.56 * s, -1, 0.56))
        body.thorn(p - n * 0.05, (s * 0.55, -0.65, 0.42), 0.36 * hs, 0.28 * hs, 0.18 * hs,
                   mat="stone", tip_mat="prism_trim")  # cheek spikes
        body.stud(hc, hr, (s, -0.35, 0.03), (0.26 * hs, 0.22 * hs, 0.1), "prism_trim", smooth=False)
    if bold:  # brow plate over the eyes: a heavier, armoured face
        p, n = on_ellipsoid(hc, hr, (0, -1, 0.62))
        body.box((1.15, 0.34, 0.16), at=p + n * 0.02, rot=(-38, 0, 0), mat="stone", bevel=True)
        body.box((1.24, 0.3, 0.08), at=p - n * 0.04 + Vector((0, 0, -0.02)), rot=(-38, 0, 0), mat="prism_trim")
    hp, _ = on_ellipsoid(hc, hr, (0, -1, 0.95))
    horn_dir = Vector((0, -0.58, 1.0)).normalized()
    body.limb(hp - horn_dir * 0.08, hp + horn_dir * 0.06, 0.28 * hs, 0.25 * hs, seg=6, mat="prism_trim",
              smooth=False)
    body.limb((0, 1.9, 0.9), (0, 2.25, 0.78), 0.22, 0.0, seg=6, mat="stone_dark", smooth=False)  # tail
    finish(body, parent=root, bevel=0.05)

    shell = Part("prismback_shell")  # pivot: ground centre
    sc, sr = Vector((0, 0.12, 1.0)), ((1.72, 1.98, 0.85) if bold else (1.65, 1.9, 1.0))
    shell.sphere(1.0, at=sc, scale=sr, seg=14, rings=10, mat="stone_dark", smooth=False, cut=1.0)
    shell.torus(1.0, 0.11, at=(0, 0.12, 1.03), seg=20, seg2=4, scale=(sr[0] - 0.01, sr[1] - 0.02, 1.0),
                mat="prism_trim")

    def on_shell(fx, fy):
        uz = math.sqrt(max(0.0, 1.0 - fx * fx - fy * fy))
        p = sc + Vector((sr[0] * fx, sr[1] * fy, sr[2] * uz))
        return p, Vector((fx / sr[0], fy / sr[1], uz / sr[2])).normalized()

    # armour plates: a gold rim slab under a stone face
    plates = 8 if bold else 7
    for i in range(plates):
        az = math.radians(-90 + i * 360 / plates)
        p, n = on_shell(0.8 * math.cos(az), 0.8 * math.sin(az))
        if bold:  # thick hexagons, one point down the dome so the rim reads scalloped
            layers = ((-0.1, 0.72, 0.62, 0.18, "prism_trim"), (0.06, 0.62, 0.44, 0.22, "stone"))
            sides, hint = 6, (0, 0, -1)
        else:
            layers = ((-0.08, 0.6, 0.52, 0.14, "prism_trim"), (0.05, 0.52, 0.4, 0.14, "stone"))
            sides, hint = 6, (0, 0, 1)
        for inset, radius, top, height, name in layers:
            plate = shell.cyl(radius, height, seg=sides, mat=name, r2=top)
            bmesh.ops.transform(shell.bm, matrix=Matrix.Translation(p + n * inset) @ basis(n, hint), verts=plate)
    # glowing cracks on the flanks, between the plates
    for i in (0, 1, 3, 4) if not bold else (0, 1, 4, 5):
        az = math.radians(-90 + (i + 0.5) * 360 / plates)
        pts = []
        for j, ring in enumerate((0.99, 0.93, 0.86, 0.79)):
            a = az + math.radians(5 * (-1) ** j)
            p, n = on_shell(ring * math.cos(a), ring * math.sin(a))
            pts.append(p + n * 0.02)
        nrm = on_shell(0.9 * math.cos(az), 0.9 * math.sin(az))[1]
        shell.strip(pts, [0.09, 0.08, 0.07, 0.03], 0.05, "lumen", normal=tuple(nrm))
    # back crystals: few, chunky, a stepped pyramid with the tallest in the middle
    core, _ = on_shell(0, 0.05)
    if bold:
        shell.shard(core, 0.95, 0.7, direction=(0, 0.06, 1), tip=0.62, mats=cut, edge="prism_edge")
        for i in range(4):  # big diagonals leaning well out: a broad stepped pyramid
            az = math.radians(45 + 90 * i)
            p, n = on_shell(0.44 * math.cos(az), 0.44 * math.sin(az))
            shell.shard(p, 0.6, 0.46, direction=n + Vector((0, 0, 0.45)), tip=0.44, mats=cut,
                        edge="prism_edge", yaw=15 * i)
        for i in range(4):  # small ones on the axes, low
            az = math.radians(90 * i)
            p, n = on_shell(0.66 * math.cos(az), 0.66 * math.sin(az))
            shell.shard(p, 0.36, 0.3, direction=n + Vector((0, 0, 0.35)), tip=0.3, mats=cut, yaw=20 * i)
    else:
        shell.shard(core, 0.75, 0.55, direction=(0, 0.08, 1), tip=0.55, mats=cut, edge="prism_edge")
        for fx, fy in ((-0.36, -0.3), (0.36, -0.3), (-0.36, 0.32), (0.36, 0.32)):
            p, n = on_shell(fx, fy)
            shell.shard(p, 0.55, 0.4, direction=n + Vector((0, 0, 0.6)), tip=0.4, mats=cut, edge="prism_edge",
                        yaw=fy * 200)
        for i in range(6):
            az = math.radians(30 + 60 * i)
            p, n = on_shell(0.6 * math.cos(az), 0.6 * math.sin(az))
            shell.shard(p, 0.38, 0.3, direction=n + Vector((0, 0, 0.3)), tip=0.3, mats=cut, yaw=17 * i)
    finish(shell, parent=root)

    horn = Part("prismback_horn")  # pivot: base on forehead: a crest of three crystals
    big, side = ((0.64, 0.27, 0.4), (0.4, 0.17, 0.26)) if bold else ((0.5, 0.22, 0.32), (0.3, 0.13, 0.2))
    horn.shard(hp, big[0], big[1], direction=horn_dir, tip=big[2], mats=grad, edge="prism_edge", squash=0.75)
    for s in (-1, 1):
        horn.shard(hp + Vector((s * (0.3 if bold else 0.25), 0.06, -0.05)), side[0], side[1],
                   direction=horn_dir + Vector((s * 0.8, 0, 0)), tip=side[2], mats=grad, sides=5)
    finish(horn, parent=root, pivot=tuple(hp))
    return root


def build_prismback():
    if CHAR_VARIANT == "r0":
        return build_prismback_r0()
    return build_prismback_des004(CHAR_VARIANT)


# ============================================================================= nature
# Scatter props are instanced hundreds of times in the game, so they have hard caps
# (SCATTER_CAPS below): trees <= 350 tris, small props <= 150 tris.
def build_tree_round():
    p = Part("tree_round")
    p.cyl(0.24, 1.55, r2=0.15, seg=6, mat="bark")
    for a in (20, 140, 260):
        p.limb(polar(0.1, a, 0.3), polar(0.4, a, 0.04), 0.09, 0.03, seg=3, mat="bark", smooth=False)
    p.ico(0.62, at=(0, 0, 1.6), scale=(1.5, 1.5, 0.65), sub=1, mat="leaf_dark", jitter=0.06)
    p.ico(1.0, at=(0, 0, 2.35), scale=(1.0, 1.0, 1.1), sub=2, mat="leaf", jitter=0.07)
    p.ico(0.72, at=(0.72, 0.18, 1.95), sub=2, mat="leaf", jitter=0.08)
    p.ico(0.68, at=(-0.62, -0.28, 2.05), sub=2, mat="leaf", jitter=0.08)
    finish(p)


def build_tree_round_b():
    """Variant: darker canopy dotted with blossom flowers."""
    p = Part("tree_round_b")
    p.cyl(0.2, 1.0, r2=0.15, seg=5, mat="bark")
    p.limb((0.0, 0.0, 0.95), (-0.06, 0.05, 1.95), 0.15, 0.11, seg=5, mat="bark", smooth=False)
    blobs = (((0, 0, 2.25), 0.9), ((0.5, 0.12, 2.75), 0.62), ((-0.46, -0.15, 2.72), 0.6))
    for at, r in blobs:
        p.ico(r, at=at, sub=2, mat="leaf_dark", jitter=0.08)
    for i in range(7):
        at, r = blobs[i % 3]
        el, az = 15 + (i * 37) % 60, i * 83 - 70
        d = Vector((math.cos(math.radians(az)) * math.cos(math.radians(el)),
                    math.sin(math.radians(az)) * math.cos(math.radians(el)), math.sin(math.radians(el))))
        p.gem(Vector(at) + d * r * 0.98, 0.12, mat="blossom", scale=(1, 1, 0.75))
    finish(p)


def build_tree_pine():
    p = Part("tree_pine")
    p.cyl(0.2, 1.0, r2=0.14, seg=6, mat="bark")
    for i, (z, r, h) in enumerate(((0.7, 1.35, 1.6), (1.55, 1.05, 1.45), (2.4, 0.78, 1.25), (3.15, 0.48, 0.95))):
        p.star_cone(r, r * 0.78, h, at=(0, 0, z), points=7, mat="leaf_dark", yaw=i * 13)
    finish(p)


def build_bush():
    p = Part("bush")
    p.ico(0.5, at=(0, 0, 0.44), scale=(1.25, 1.05, 0.8), sub=2, mat="leaf", jitter=0.07)
    p.ico(0.32, at=(0.46, 0.08, 0.34), sub=1, mat="leaf", jitter=0.05)
    p.ico(0.3, at=(-0.46, 0.1, 0.32), sub=1, mat="leaf_dark", jitter=0.05)
    for x, y, z in ((0.18, -0.4, 0.58), (-0.3, -0.3, 0.5), (0.05, -0.12, 0.84)):
        p.gem((x, y, z), 0.07, mat="blossom", scale=(1, 1, 0.7))
    finish(p)


def build_rock_a():
    p = Part("rock_a")
    p.ico(0.72, at=(0, 0, 0.32), scale=(1.25, 1.0, 0.85), sub=2, mat="stone", jitter=0.12, cut=0.0)
    p.ico(0.36, at=(0.1, 0.08, 0.86), scale=(1.3, 1.1, 0.45), sub=1, mat="leaf_dark", jitter=0.1)
    p.ico(0.22, at=(0.85, -0.45, 0.23), sub=1, mat="stone", jitter=0.08)
    finish(p)


def build_rock_b():
    p = Part("rock_b")
    p.ico(0.55, at=(-0.15, 0.05, 0.2), scale=(1.3, 1.0, 0.9), sub=2, mat="stone", jitter=0.14, cut=0.0)
    p.ico(0.38, at=(0.5, -0.15, 0.12), scale=(1.0, 1.1, 0.95), sub=1, mat="stone_dark", jitter=0.1, cut=0.0)
    p.ico(0.2, at=(0.1, -0.55, 0.19), sub=1, mat="stone", jitter=0.08)
    finish(p)


def build_crystal_cluster():
    p = Part("crystal_cluster")
    p.ico(0.5, at=(0, 0, 0.0), scale=(1.25, 1.1, 0.5), sub=1, mat="stone_dark", jitter=0.1, cut=0.0)
    p.crystal((0, 0, 0.2), 0.85, 0.2, direction=(0.05, 0.1, 1), tip=0.32, mat="lumen", sink=0.2)
    for az, h, r, m, lean in ((200, 0.55, 0.14, "crystal_mid", 0.5), (320, 0.48, 0.13, "crystal_violet", 0.6),
                              (80, 0.62, 0.15, "lumen", 0.45), (140, 0.32, 0.1, "crystal_violet", 0.8),
                              (20, 0.3, 0.1, "crystal_mid", 0.85), (260, 0.26, 0.09, "lumen", 0.9)):
        base = polar(0.28, az, 0.16)
        p.crystal(base, h, r, direction=polar(lean, az, 1.0), tip=r * 1.6, mat=m, yaw=az, sides=5, sink=0.12)
    finish(p)


def build_flower_patch():
    p = Part("flower_patch")
    for i in range(3):  # grass tufts
        c = polar(0.32, 30 + i * 120, 0.0)
        for k in range(3):
            tip = c + polar(0.08, i * 51 + k * 120, 0.22 + 0.06 * k)
            p.limb(c + polar(0.03, k * 120, 0.03), tip, 0.035, 0.0, seg=3, mat="leaf", smooth=False)
    for i, m in enumerate(("blossom", "cream", "synes_violet", "gold", "blossom")):
        at = polar(0.12 + 0.36 * ((i * 3) % 5) / 4, i * 72 + 10, 0.0)
        h = 0.16 + 0.03 * ((i * 2) % 5)
        p.limb(at, at + Vector((0, 0, h)), 0.018, 0.0, seg=3, mat="leaf_dark", smooth=False)  # stem
        p.flower(at + Vector((0, 0, h - 0.01)), 0.085, mat=m, tilt=(12 * ((i % 3) - 1), 10, i * 40))
    finish(p)


def build_mushroom_glow():
    p = Part("mushroom_glow")
    for (x, y), s, cap in (((0, 0), 1.0, "lumen"), ((0.27, 0.12), 0.66, "crystal_violet"),
                           ((-0.22, 0.16), 0.52, "lumen")):
        h = 0.42 * s
        p.cyl(0.065 * s, h, at=(x, y, 0), r2=0.05 * s, seg=5, mat="cream", smooth=True)
        p.dome((x, y, h - 0.02 * s), 0.22 * s, 0.15 * s, mat=cap)
    finish(p)


# ============================================================================= camp & landmarks
def build_tent():
    p = Part("tent")
    w, h, d = 1.1, 1.8, 2.3
    p.prism([(-w, 0), (w, 0), (0, h)], d, at=(0, 0, 0), rot=(0, 0, 0), mat="cream")
    p.prism([(-0.48, 0), (0.48, 0), (0, 1.15)], 0.04, at=(0, -d / 2 - 0.01, 0), mat="navy")  # doorway
    for s in (-1, 1):  # door flaps folded open
        p.prism([(0, 0), (0.42 * s, 0), (0, 1.1)][::s], 0.03, at=(0.5 * s, -d / 2 - 0.08, 0.02),
                rot=(0, 0, 25 * s), mat="cream")
        ang = math.degrees(math.atan2(h, w))
        p.box((0.04, d + 0.06, 0.18), at=(s * (w - 0.28 * math.cos(math.radians(ang))) + 0.02 * s, 0,
                                        0.28 * math.sin(math.radians(ang))),
              rot=(0, -(90 - ang) * s, 0), mat="cloth_teal")
    p.limb((0, -d / 2 - 0.15, h - 0.02), (0, d / 2 + 0.15, h - 0.02), 0.045, seg=6, mat="bark", smooth=False)
    p.limb((0, -d / 2 - 0.12, 0), (0, -d / 2 - 0.12, h + 0.25), 0.04, seg=6, mat="bark", smooth=False)
    p.ico(0.06, at=(0, -d / 2 - 0.12, h + 0.28), sub=1, mat="gold")
    p.prism([(0, 0), (0.35, -0.08), (0, -0.18)], 0.02, at=(0.02, -d / 2 - 0.12, h + 0.22), mat="synes_violet")
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((0.06, 0.06, 0.2), at=(sx * (w + 0.18), sy * (d / 2 - 0.1), 0.06), rot=(0, 15 * sx, 0), mat="bark")
    finish(p)


def build_campfire():
    p = Part("campfire")
    p.cyl(0.36, 0.03, seg=8, mat="stone_dark")
    for i in range(8):
        p.ico(0.13, at=polar(0.45, i * 45 + p.rng.uniform(-8, 8), 0.06), scale=(1.25, 1.0, 0.8), sub=1,
              mat="stone", jitter=0.15, rot=(0, 0, i * 45))
    for a in (30, 150, 270):
        p.limb(polar(0.34, a, 0.02), polar(0.03, a + 180, 0.4), 0.055, 0.045, seg=6, mat="bark", smooth=False)
    root = finish(p)
    f = Part("campfire_flame")  # pivot: flame base, so the game can flicker/scale it
    f.crystal((0, 0, 0.08), 0.22, 0.17, tip=0.36, sides=5, mat="glow_gold", sink=0.1)
    f.crystal((0.1, 0.05, 0.08), 0.12, 0.09, direction=(0.4, 0.2, 1), tip=0.2, sides=5, mat="glow_gold", sink=0.1)
    f.crystal((-0.09, -0.05, 0.08), 0.1, 0.08, direction=(-0.4, -0.1, 1), tip=0.18, sides=5, mat="glow_gold",
              sink=0.1)
    f.crystal((0, 0, 0.1), 0.1, 0.08, tip=0.2, sides=5, mat="lumen", sink=0.1)  # Synes ember core
    finish(f, parent=root, pivot=(0, 0, 0.08))


def build_signpost():
    p = Part("signpost")
    p.box((0.14, 0.14, 1.85), at=(0, 0, 0.925), mat="bark", bevel=True)
    p.cyl(0.13, 0.12, at=(0, 0, 1.85), seg=4, r2=0.0, rot=(0, 0, 45), mat="gold")
    arrow = [(0, -0.11), (0.58, -0.11), (0.72, 0.0), (0.58, 0.11), (0, 0.11)]
    p.prism(arrow, 0.05, at=(-0.08, -0.1, 1.5), rot=(0, 0, -12), mat="wood_light", bevel=True)
    p.prism(arrow, 0.05, at=(0.08, -0.1, 1.18), rot=(0, 0, 192), mat="wood_light", bevel=True)
    for x, z in ((0.0, 1.5), (0.0, 1.18)):
        p.box((0.04, 0.03, 0.04), at=(x, -0.135, z), mat="gold")
    for a in (30, 160, 280):
        p.ico(0.1, at=polar(0.15, a, 0.03), sub=1, mat="stone", jitter=0.1)
    finish(p, bevel=0.015)


def build_lantern_post():
    p = Part("lantern_post")
    p.box((0.46, 0.46, 0.3), at=(0, 0, 0.15), mat="stone", bevel=True)
    p.cyl(0.075, 1.9, at=(0, 0, 0.3), r2=0.06, seg=6, mat="bark")
    p.box((0.32, 0.32, 0.05), at=(0, 0, 2.2), mat="gold", bevel=True)
    p.box((0.22, 0.22, 0.3), at=(0, 0, 2.38), mat="glow_gold")
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((0.035, 0.035, 0.32), at=(0.12 * sx, 0.12 * sy, 2.38), mat="gold")
    p.cyl(0.25, 0.2, at=(0, 0, 2.53), seg=4, r2=0.0, rot=(0, 0, 45), mat="gold")
    p.ico(0.05, at=(0, 0, 2.76), sub=1, mat="gold")
    finish(p, bevel=0.02)


def build_crystal_pillar():
    p = Part("crystal_pillar")
    p.cyl(0.8, 0.3, seg=8, mat="stone", rot=(0, 0, 22.5))
    p.cyl(0.62, 0.22, at=(0, 0, 0.3), seg=8, mat="stone_dark", rot=(0, 0, 22.5))
    p.crystal((0, 0, 0.45), 2.85, 0.4, tip=0.72, mat="lumen", sink=0.08, facets=("prism_cyan", "lumen", "crystal_mid"))
    for az, h, r, m in ((10, 1.9, 0.21, "crystal_mid"), (85, 1.3, 0.19, "crystal_violet"),
                        (160, 1.65, 0.2, "crystal_violet"), (235, 1.1, 0.18, "crystal_mid"),
                        (300, 1.45, 0.19, "crystal_violet")):
        p.crystal(polar(0.38, az, 0.45), h, r, direction=polar(0.14, az, 1.0), tip=r * 1.8, mat=m, yaw=az,
                  facets=("prism_violet", m, "crystal_mid"))
    for az in (50, 200, 330):
        p.crystal(polar(0.6, az, 0.3), 0.26, 0.08, direction=polar(0.3, az, 1.0), mat="lumen", yaw=az)
    finish(p)


def build_crystal_gate():
    p = Part("crystal_gate")
    for s in (-1, 1):
        p.box((0.85, 1.0, 2.2), at=(2.55 * s, 0, 1.1), mat="stone", bevel=True)
        p.box((1.0, 1.15, 0.22), at=(2.55 * s, 0, 0.11), mat="stone_dark", bevel=True)
        p.box((0.98, 1.12, 0.18), at=(2.55 * s, 0, 2.1), mat="stone_dark", bevel=True)
        for az, h, r, m in ((180, 0.95, 0.22, "crystal_violet"), (250, 0.62, 0.17, "crystal_mid"),
                            (110, 0.55, 0.16, "lumen"), (215, 0.35, 0.12, "lumen")):
            base = Vector((2.55 * s, 0, 0.2)) + polar(0.5, az + (0 if s > 0 else 180), 0)
            p.crystal(base, h, r, direction=polar(0.6, az + (0 if s > 0 else 180), 1.0), mat=m, yaw=az)
    p.arch(2.55, 0.62, 0.5, 0.9, at=(0, 0, 1.85), seg=12, mat="stone")
    p.crystal((0, 0, 2.5), 0.26, 0.18, tip=0.28, mat="lumen", sink=0.25)
    for s in (-1, 1):
        p.crystal((0.5 * s, 0, 2.45), 0.18, 0.11, direction=(0.5 * s, 0, 1), mat="crystal_violet", sink=0.3)
        p.crystal((1.4 * s, 0, 2.25), 0.15, 0.1, direction=(0.8 * s, 0, 1), mat="crystal_mid", sink=0.3)
    finish(p, bevel=0.06)


def build_lumen_spring():
    p = Part("lumen_spring")
    p.tube(1.0, 0.8, 0.42, seg=10, mat="stone")
    p.cyl(0.82, 0.32, seg=10, mat="lumen")
    p.crystal((0, 0, 0.3), 0.42, 0.13, tip=0.24, mat="lumen", sink=0.2)
    p.crystal((0.12, 0.08, 0.3), 0.2, 0.07, direction=(0.5, 0.3, 1), mat="crystal_violet")
    p.crystal((-0.1, 0.1, 0.3), 0.16, 0.06, direction=(-0.5, 0.4, 1), mat="crystal_mid")
    for az in (40, 160, 285):
        c = polar(0.9, az, 0.4)
        p.crystal(c, 0.28, 0.08, direction=polar(0.5, az, 1.0), mat="crystal_violet", yaw=az)
        p.crystal(c + polar(0.1, az + 90), 0.18, 0.06, direction=polar(0.7, az + 30, 1.0), mat="lumen", yaw=az)
    for az in (100, 220, 340):
        p.ico(0.16, at=polar(1.05, az, 0.05), scale=(1.2, 1.0, 0.7), sub=1, mat="stone_dark", jitter=0.12)
    finish(p)


def build_fence():
    p = Part("fence")
    for s in (-1, 1):
        p.box((0.14, 0.14, 0.95), at=(0.95 * s, 0, 0.475), mat="bark", bevel=True)
        p.cyl(0.11, 0.13, at=(0.95 * s, 0, 0.95), seg=4, r2=0.0, rot=(0, 0, 45), mat="bark")
    for z in (0.4, 0.74):
        p.box((2.05, 0.06, 0.12), at=(0, -0.08, z), mat="wood_light", bevel=True)
    finish(p, bevel=0.02)


# ============================================================================= town tone study
def build_house_a():
    """Timber cottage, front gable with the door facing -Y."""
    p = Part("house_a")
    W, D, wall_top, ridge = 3.3, 3.1, 2.5, 3.8
    p.box((W + 0.3, D + 0.3, 0.4), at=(0, 0, 0.2), mat="stone", bevel=True)
    p.box((W, D, wall_top - 0.4), at=(0, 0, (wall_top + 0.4) / 2), mat="cream", bevel=True)
    p.prism([(-W / 2, 0), (W / 2, 0), (0, ridge - wall_top)], D, at=(0, 0, wall_top), mat="cream")
    slope = math.atan2(ridge - wall_top, W / 2)
    run = math.hypot(W / 2, ridge - wall_top) + 0.45
    for s in (-1, 1):
        n = Vector((math.sin(slope) * s, 0, math.cos(slope)))
        down = Vector((math.cos(slope) * s, 0, -math.sin(slope)))
        mid = Vector((W / 4 * s, 0, (wall_top + ridge) / 2)) + n * 0.09 + down * 0.2
        p.box((run, D + 0.6, 0.16), at=mid, rot=(0, math.degrees(slope) * s, 0), mat="synes_violet", bevel=True)
    p.box((0.22, D + 0.66, 0.16), at=(0, 0, ridge + 0.12), mat="bark", bevel=True)
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((0.2, 0.2, wall_top - 0.4), at=(sx * W / 2, sy * D / 2, (wall_top + 0.4) / 2), mat="bark")
    for sy in (-1, 1):
        p.box((W + 0.2, 0.2, 0.16), at=(0, sy * D / 2, wall_top), mat="bark")
    fy = -D / 2 - 0.04
    p.box((0.9, 0.12, 1.4), at=(0, fy, 0.4 + 0.7), mat="bark", bevel=True)
    p.cyl(0.45, 0.1, at=(0, fy + 0.05, 1.8), rot=(90, 0, 0), seg=10, mat="bark")  # recessed: no coplanar faces
    p.ico(0.05, at=(0.3, fy - 0.08, 1.1), sub=1, mat="gold")
    p.box((1.1, 0.5, 0.15), at=(0, fy - 0.3, 0.32), mat="stone", bevel=True)
    for sx in (-1, 1):
        p.box((0.72, 0.08, 0.72), at=(1.0 * sx, fy, 1.6), mat="bark", bevel=True)
        p.box((0.56, 0.1, 0.56), at=(1.0 * sx, fy - 0.02, 1.6), mat="glow_gold")
        p.box((0.06, 0.12, 0.56), at=(1.0 * sx, fy - 0.03, 1.6), mat="bark")
        p.box((0.8, 0.25, 0.16), at=(1.0 * sx, fy - 0.12, 1.15), mat="bark", bevel=True)
        for k in (-1, 0, 1):
            p.ico(0.09, at=(1.0 * sx + 0.24 * k, fy - 0.14, 1.28), sub=1, mat="blossom" if k else "cream")
        p.box((0.08, 0.6, 0.6), at=(sx * (W / 2 + 0.04), 0.2, 1.6), mat="glow_gold")
    p.cyl(0.26, 0.1, at=(0, fy + 0.02, 3.0), rot=(90, 0, 0), seg=8, mat="glow_gold")
    p.crystal((0, -D / 2 - 0.2, ridge + 0.1), 0.18, 0.08, direction=(0, -0.3, 1), mat="lumen", sink=0.2)
    p.box((0.5, 0.5, 1.3), at=(0.9, 0.7, 3.6), mat="stone", bevel=True)
    p.box((0.6, 0.6, 0.12), at=(0.9, 0.7, 4.26), mat="stone_dark", bevel=True)
    finish(p, bevel=0.04)


def build_house_b():
    """Round crystal-keeper's house with a teal cone roof."""
    p = Part("house_b")
    p.cyl(1.9, 0.45, seg=12, mat="stone")
    p.cyl(1.7, 2.25, at=(0, 0, 0.45), seg=12, mat="cream", smooth=True)
    p.cyl(1.74, 0.16, at=(0, 0, 1.35), seg=12, mat="bark")
    p.cyl(1.76, 0.18, at=(0, 0, 2.55), seg=12, mat="bark")
    p.cyl(2.15, 1.95, at=(0, 0, 2.7), r2=0.0, seg=12, mat="cloth_teal", rot=(0, 0, 15))
    p.cyl(0.08, 0.3, at=(0, 0, 4.5), seg=6, mat="gold")
    p.crystal((0, 0, 4.76), 0.24, 0.11, tip=0.22, mat="lumen", sink=0.2)
    p.box((0.95, 0.4, 1.45), at=(0, -1.6, 0.45 + 0.725), mat="bark", bevel=True)
    p.cyl(0.475, 0.38, at=(0, -1.41, 1.9), rot=(90, 0, 0), seg=10, mat="bark")  # recessed: no coplanar faces
    p.ico(0.05, at=(0.3, -1.82, 1.15), sub=1, mat="gold")
    p.box((1.2, 0.5, 0.15), at=(0, -2.0, 0.35), mat="stone", bevel=True)
    for az in (-40, 220, 120, 30):
        a = math.radians(az - 90)
        c = Vector((1.68 * math.cos(a), 1.68 * math.sin(a), 1.95))
        p.box((0.55, 0.14, 0.6), at=c, rot=(0, 0, az), mat="glow_gold")
        p.box((0.7, 0.1, 0.12), at=c + Vector((0, 0, -0.36)) + c.normalized() * 0.04, rot=(0, 0, az), mat="bark")
    finish(p, bevel=0.04)


def build_market_stall():
    p = Part("market_stall")
    p.box((2.4, 0.9, 0.85), at=(0, 0, 0.425), mat="bark", bevel=True)
    p.box((2.55, 1.0, 0.08), at=(0, 0, 0.89), mat="wood_light", bevel=True)
    p.box((2.0, 0.04, 0.12), at=(0, -0.47, 0.7), mat="gold")
    for sx in (-1, 1):
        p.cyl(0.055, 2.0, at=(1.15 * sx, -0.45, 0), seg=6, mat="bark")
        p.cyl(0.055, 2.4, at=(1.15 * sx, 0.42, 0), seg=6, mat="bark")
    slope = math.degrees(math.atan2(0.5, 1.3))
    for i in range(6):  # striped awning with a scalloped front edge
        x = -1.05 + 0.42 * i
        m = "blossom" if i % 2 == 0 else "cream"
        p.box((0.42, 1.45, 0.05), at=(x, -0.15, 2.22), rot=(slope, 0, 0), mat=m)
        p.prism([(-0.21, 0), (0.21, 0), (0, -0.2)], 0.03, at=(x, -0.83, 1.97), mat=m)
    p.box((0.5, 0.4, 0.3), at=(-0.85, 0.05, 1.08), mat="wood_light", bevel=True)
    p.box((0.42, 0.4, 0.26), at=(0.85, 0.1, 1.06), mat="wood_light", bevel=True)
    for i in range(5):
        p.ico(0.09, at=(-0.95 + 0.11 * (i % 3), -0.05 + 0.1 * (i // 3), 1.28), sub=1, mat="gold", smooth=True)
        p.ico(0.085, at=(0.75 + 0.1 * (i % 3), 0.0 + 0.1 * (i // 3), 1.24), sub=1, mat="blossom", smooth=True)
    p.cyl(0.22, 0.12, at=(0, -0.1, 0.93), seg=8, r2=0.26, mat="bark")
    for az in (0, 120, 240):
        p.crystal(Vector((0, -0.1, 1.0)) + polar(0.08, az), 0.12, 0.05, direction=polar(0.4, az, 1), mat="lumen")
    finish(p, bevel=0.03)


def build_fountain():
    p = Part("fountain")
    p.tube(1.5, 1.25, 0.55, seg=10, mat="stone")
    p.cyl(1.28, 0.42, seg=10, mat="water")
    p.cyl(0.3, 1.0, at=(0, 0, 0.4), seg=8, mat="stone", r2=0.24)
    p.cyl(0.33, 0.12, at=(0, 0, 0.85), seg=8, mat="stone_dark")
    p.cyl(0.24, 0.26, at=(0, 0, 1.36), seg=8, r2=0.66, mat="stone")
    p.cyl(0.6, 0.03, at=(0, 0, 1.6), seg=8, mat="water")
    p.crystal((0, 0, 1.6), 0.42, 0.13, tip=0.24, mat="lumen", sink=0.2)
    for s in (-1, 1):
        p.crystal((0.1 * s, 0.05, 1.6), 0.18, 0.06, direction=(0.5 * s, 0.2, 1), mat="crystal_violet")
    for az in (45, 135, 225, 315):
        p.limb(polar(0.63, az, 1.6), polar(0.85, az, 0.42), 0.04, 0.07, seg=5, mat="water", smooth=False)
    finish(p)


def build_ruin_arch():
    p = Part("ruin_arch")
    for s, h, jag in ((-1, 2.7, 0.0), (1, 1.65, 0.3)):
        x = 1.3 * s
        p.box((0.75, 0.75, 0.25), at=(x, 0, 0.125), mat="stone_dark", bevel=True)
        p.cyl(0.3, h, at=(x, 0, 0.25), seg=8, mat="stone", jag=jag)
    p.box((0.8, 0.8, 0.25), at=(-1.3, 0, 3.08), mat="stone_dark", bevel=True)
    p.box((1.7, 0.62, 0.42), at=(-0.62, 0, 3.4), rot=(0, -4, 0), mat="stone", bevel=True)
    p.box((0.6, 0.5, 0.4), at=(0.45, -0.75, 0.18), rot=(4, 8, 28), mat="stone", bevel=True)
    p.box((0.4, 0.35, 0.3), at=(1.0, 0.7, 0.14), rot=(0, -10, -15), mat="stone_dark", bevel=True)
    p.ico(0.35, at=(-0.7, 0.0, 3.6), scale=(1.6, 0.95, 0.35), sub=2, mat="leaf", jitter=0.1)
    p.ico(0.32, at=(1.3, 0.0, 1.75), scale=(1.1, 1.1, 0.4), sub=2, mat="leaf", jitter=0.1)
    p.ico(0.25, at=(-1.3, -0.3, 0.3), scale=(1.4, 1.0, 0.5), sub=2, mat="leaf_dark", jitter=0.1)
    for (x, y), d, h in (((1.55, -0.2), (0.6, -0.4, 1), 0.5), ((1.35, -0.4), (0.0, -0.6, 1), 0.36),
                         ((1.7, 0.2), (0.7, 0.3, 1), 0.3)):
        p.crystal((x, y, 0.1), h, 0.11, direction=d, mat="crystal_violet")
    p.crystal((-0.15, -0.1, 3.55), 0.2, 0.08, direction=(0.4, -0.3, 1), mat="crystal_violet")
    finish(p, bevel=0.05)


def build_ruin_column():
    p = Part("ruin_column")
    p.box((0.9, 0.9, 0.3), at=(0, 0, 0.15), mat="stone_dark", bevel=True)
    p.cyl(0.33, 2.1, at=(0, 0, 0.3), seg=8, r2=0.3, mat="stone", jag=0.35)
    p.box((0.75, 0.75, 0.26), at=(0.75, 0.45, 0.14), rot=(6, -8, 32), mat="stone", bevel=True)
    p.ico(0.36, at=(0, 0, 2.22), scale=(1.05, 1.05, 0.38), sub=2, mat="leaf", jitter=0.1)
    p.crystal((-0.4, -0.35, 0.05), 0.42, 0.1, direction=(-0.4, -0.5, 1), mat="crystal_violet")
    p.crystal((-0.5, -0.15, 0.05), 0.25, 0.07, direction=(-0.8, 0.0, 1), mat="crystal_mid")
    for x, y in ((0.5, -0.45), (-0.55, 0.45), (0.15, 0.7)):
        p.ico(0.12, at=(x, y, 0.05), sub=1, mat="stone", jitter=0.15)
    finish(p, bevel=0.05)


def build_shop_counter():
    p = Part("shop_counter")
    p.box((2.2, 0.75, 0.95), at=(0, 0, 0.475), mat="bark", bevel=True)
    for x in (-0.7, 0, 0.7):
        p.box((0.56, 0.04, 0.55), at=(x, -0.385, 0.45), mat="wood_light", bevel=True)
    p.box((2.36, 0.9, 0.08), at=(0, 0, 0.99), mat="wood_light", bevel=True)
    p.box((2.37, 0.04, 0.05), at=(0, -0.45, 0.93), mat="gold")
    top = 1.03
    p.box((0.36, 0.3, 0.08), at=(-0.65, 0, top + 0.04), mat="synes_violet", bevel=True)
    p.crystal((-0.65, 0, top + 0.08), 0.16, 0.06, tip=0.12, mat="lumen", sink=0.1)
    for i, m in enumerate(("blossom", "lumen", "crystal_violet")):
        x = 0.1 + 0.16 * i
        p.cyl(0.06, 0.13, at=(x, 0.1, top), seg=6, mat=m, smooth=True)
        p.cyl(0.025, 0.06, at=(x, 0.1, top + 0.13), seg=6, mat=m)
        p.cyl(0.03, 0.03, at=(x, 0.1, top + 0.19), seg=6, mat="bark")
    for k in range(2):
        p.cyl(0.07, 0.05 + 0.03 * k, at=(0.75 + 0.16 * k, -0.15, top), seg=8, mat="gold")
    p.box((0.3, 0.22, 0.05), at=(-0.15, -0.15, top + 0.025), rot=(0, 0, 12), mat="navy")
    p.box((0.27, 0.2, 0.03), at=(-0.15, -0.15, top + 0.06), rot=(0, 0, 12), mat="cream")
    finish(p, bevel=0.03)


def build_weapon_rack():
    p = Part("weapon_rack")
    for s in (-1, 1):
        p.box((0.1, 0.1, 1.4), at=(0.75 * s, 0, 0.7), mat="bark", bevel=True)
        p.box((0.14, 0.6, 0.1), at=(0.75 * s, 0, 0.05), mat="bark", bevel=True)
    p.box((1.62, 0.08, 0.08), at=(0, 0, 1.25), mat="wood_light", bevel=True)
    p.box((1.62, 0.08, 0.08), at=(0, 0, 0.35), mat="wood_light", bevel=True)
    for x in (-0.48, -0.18):  # swords leaning on the top bar, pommel down
        p.cyl(0.025, 0.2, at=(x, -0.08, 0.08), seg=6, mat="bark")
        p.ico(0.035, at=(x, -0.08, 0.07), sub=1, mat="gold")
        p.box((0.2, 0.05, 0.04), at=(x, -0.08, 0.3), mat="gold")
        p.blade((x, -0.08, 0.32), 0.78, 0.09, 0.1, 0.03, 0.12, mat="stone")
    p.cyl(0.025, 1.5, at=(0.2, -0.08, 0.0), seg=6, mat="wood_light")
    p.crystal((0.2, -0.08, 1.48), 0.1, 0.05, tip=0.14, sides=4, mat="stone", sink=0.2)
    p.cyl(0.03, 1.35, at=(0.5, -0.08, 0.0), seg=6, mat="bark")
    p.crystal((0.5, -0.08, 1.35), 0.14, 0.07, tip=0.12, mat="lumen", sink=0.3)
    for s in (-1, 1):
        p.crystal((0.5 + 0.05 * s, -0.08, 1.33), 0.08, 0.04, direction=(0.8 * s, 0, 1), mat="crystal_violet")
    finish(p, bevel=0.02)


def build_banner():
    p = Part("banner")
    p.box((0.5, 0.5, 0.25), at=(0, 0, 0.125), mat="stone", bevel=True)
    p.cyl(0.055, 2.95, at=(0, 0, 0.25), seg=6, mat="bark")
    p.limb((-0.52, 0, 2.85), (0.52, 0, 2.85), 0.035, seg=6, mat="bark", smooth=False)
    p.ico(0.06, at=(0, 0, 3.22), sub=1, mat="gold")
    p.crystal((0, 0, 3.24), 0.12, 0.05, tip=0.1, mat="lumen", sink=0.1)
    cloth = [(-0.45, 1.25), (0.0, 1.5), (0.45, 1.25), (0.45, 2.82), (-0.45, 2.82)]
    p.prism(cloth, 0.04, at=(0, -0.07, 0), mat="synes_violet")
    p.box((0.95, 0.06, 0.08), at=(0, -0.07, 2.78), mat="gold")
    p.cyl(0.2, 0.035, at=(0, -0.085, 2.15), rot=(90, 0, 0), seg=6, mat="gold")
    p.cyl(0.1, 0.03, at=(0, -0.105, 2.15), rot=(90, 0, 0), seg=6, mat="lumen")
    finish(p, bevel=0.03)


# ----------------------------------------------------------------------------- arena landmarks (DES-004 step 2)
SPIRE_SIDE_MATS = ("prism_violet", "crystal_violet", "crystal_mid")


def build_crystal_spire():
    """DES-004 step 2 big arena crystal (replaces the icosahedron prisms of the tall arena clusters): ~8 m
    faceted spire with a snapped, faceted tip on a stone base. A = one spire + side shards; B = a leaning
    twin spire and the broken-off tip floating above the break."""
    p = Part("crystal_spire")
    p.ico(1.0, at=(0, 0, 0.1), scale=(1.45, 1.2, 0.5), sub=1, mat="stone_dark", jitter=0.12, cut=0.0)
    p.ico(0.55, at=(0.95, -0.55, 0.05), scale=(1.0, 0.9, 0.6), sub=1, mat="stone", jitter=0.15, cut=0.0)
    if SPIRE_VARIANT == "A":
        p.broken_spire((0, 0, 0.25), 7.0, 0.72, yaw=8)
        for az, h, r, lean in ((35, 2.9, 0.34, 0.24), (150, 2.1, 0.28, 0.3), (250, 3.4, 0.36, 0.18)):
            p.shard(polar(0.62, az, 0.3), h, r, direction=polar(lean, az, 1.0), yaw=az, tip=r * 1.6,
                    mats=SPIRE_SIDE_MATS, edge="prism_edge")
        for az in (90, 200, 320):
            p.crystal(polar(1.05, az, 0.2), 0.45, 0.12, direction=polar(0.35, az, 1.0), mat="lumen", yaw=az)
    else:
        p.broken_spire((0, 0, 0.25), 6.6, 0.8, yaw=8, slope=0.75, peak=(0.45, -0.2, 0.7))
        p.broken_spire((0.5, 0.2, 0.25), 4.3, 0.46, yaw=30, direction=(0.28, 0.1, 1.0), slope=-0.6,
                       peak=(-0.3, 0.2, 0.8),
                       mats=(SPIRE_SIDE_MATS[:2], "crystal_violet", ("prism_edge", "crystal_mid")))
        # the snapped-off tip, point up, hovering above the break
        p.shard((0.05, 0.0, 7.75), 0.55, 0.42, yaw=20, tip=0.85, sink=0.4, edge="prism_edge",
                mats=("crystal_mid", "lumen", ("prism_edge", "lumen")))
        for az, h, r, lean in ((140, 2.4, 0.32, 0.3), (250, 1.8, 0.27, 0.22)):
            p.shard(polar(0.7, az, 0.3), h, r, direction=polar(lean, az, 1.0), yaw=az, tip=r * 1.6,
                    mats=SPIRE_SIDE_MATS, edge="prism_edge")
        for az in (80, 200, 310):
            p.crystal(polar(1.1, az, 0.2), 0.5, 0.13, direction=polar(0.35, az, 1.0), mat="lumen", yaw=az)
    finish(p)


SHRINE_CRYSTAL_Z = 3.65  # = SHRINE_CRYSTAL_Y in src/render/arena.ts (the glow halo anchor)


def build_ruin_arch_shrine():
    """DES-004 step 2 shrine: steps at the front (-Y here = +Z in glTF) up to a platform, two pillars and an arch,
    a gold ring inside the arch and a crystal floating in its centre at the old halo height. A = intact, ring
    inside the arch; B = ruined right side (short pillar, broken arch, fallen blocks), larger ring tilted
    through the arch, bigger crystal with four orbiting shards, one more step."""
    p = Part("ruin_arch_shrine")
    b = SPIRE_VARIANT == "B"
    steps = 4 if b else 3
    top = 0.24 * (steps + 1)  # platform one rise above the last step (no coplanar tops)
    for i in range(steps):  # solid blocks down to the ground
        p.box((5.6 - i * 0.35, 0.95, 0.24 * (i + 1)), at=(0, -1.9 + i * 0.42, 0.12 * (i + 1)), mat="stone", bevel=True)
    p.box((5.6, 2.2, top), at=(0, 0.35, top / 2), mat="stone_dark", bevel=True)
    px, ph = 2.45, SHRINE_CRYSTAL_Z - top + 0.1
    for s in (-1, 1):
        broken = b and s > 0
        h = ph * (0.55 if broken else 1.0)
        p.box((0.95, 0.95, 0.3), at=(px * s, 0.35, top + 0.15), mat="stone_dark", bevel=True)
        p.box((0.75, 0.75, h), at=(px * s, 0.35, top + 0.3 + h / 2), mat="stone", bevel=True)
        if not broken:
            p.box((0.95, 0.95, 0.22), at=(px * s, 0.35, top + 0.3 + h + 0.11), mat="stone_dark", bevel=True)
    spring = top + 0.3 + ph + 0.22
    if b:
        p.arch(px, 1.55, 0.6, 0.8, at=(0, 0.35, spring), seg=8, mat="stone", span=(0.42, 1.0))
        p.box((1.1, 0.8, 0.55), at=(3.35, -0.7, 0.27), rot=(6, 10, 32), mat="stone", bevel=True)
        p.box((0.6, 0.55, 0.4), at=(2.6, -1.4, 0.2), rot=(0, -8, -20), mat="stone_dark", bevel=True)
        p.ico(0.3, at=(px, 0.35, top + 0.3 + ph * 0.55), scale=(1.3, 1.3, 0.45), sub=1, mat="leaf", jitter=0.12)
    else:
        p.arch(px, 1.4, 0.6, 0.8, at=(0, 0.35, spring), seg=10, mat="stone")
        p.box((0.7, 0.55, 0.42), at=(0, 0.35, spring + 1.55), mat="stone_dark", bevel=True)  # keystone
    p.ico(0.35, at=(-1.4, 0.35, spring + 1.15), scale=(1.5, 1.0, 0.4), sub=1, mat="leaf", jitter=0.12)
    # gold ring (A: two struts to the pillars) and the floating crystal at the halo anchor
    ring_r = 2.2 if b else 1.75
    p.torus(ring_r, 0.12, at=(0, 0.35, SHRINE_CRYSTAL_Z), rot=(90, 8 if b else 0, 0), seg=24 if b else 20,
            seg2=5, mat="gold", smooth=False)
    if not b:
        gap = px - 0.375 - ring_r
        for s in (-1, 1):
            p.box((gap + 0.1, 0.14, 0.14), at=(s * (ring_r + gap / 2), 0.35, SHRINE_CRYSTAL_Z), mat="gold")
    cz, ch, cr = SHRINE_CRYSTAL_Z, (0.75 if b else 0.6), (0.42 if b else 0.34)
    p.shard((0, 0.35, cz), ch, cr, yaw=15, tip=cr * 1.9, sink=0.0, edge="prism_edge",
            mats=("lumen", ("prism_cyan", "lumen"), ("prism_edge", "lumen")))
    p.shard((0, 0.35, cz), ch * 0.6, cr, direction=(0, 0, -1), yaw=15, tip=cr * 1.7, sink=0.0,
            mats=("lumen", "crystal_mid", ("crystal_mid", "crystal_violet")))
    if b:
        for az, z in ((20, 0.6), (140, -0.4), (260, 0.2), (330, -0.7)):
            q = polar(1.05, az, cz + z) + Vector((0, 0.35, 0))
            p.crystal(q, 0.22, 0.1, direction=polar(0.5, az + 90, 1.0), mat="crystal_violet", yaw=az, sink=0.3)
    for (x, y), d, h in (((-2.95, -0.6), (-0.5, -0.3, 1), 0.55), ((-2.7, -1.0), (-0.1, -0.6, 1), 0.38),
                         ((2.95, 1.1), (0.6, 0.2, 1), 0.42)):
        p.crystal((x, y, 0.05), h, 0.12, direction=d, mat="crystal_violet")
    finish(p, bevel=0.05)


# ============================================================================= registry
ASSETS = [
    ("hero", build_hero), ("puffcap", build_puffcap), ("thornling", build_thornling),
    ("prismback", build_prismback),
    ("tree_round", build_tree_round), ("tree_round_b", build_tree_round_b), ("tree_pine", build_tree_pine),
    ("bush", build_bush), ("rock_a", build_rock_a), ("rock_b", build_rock_b),
    ("crystal_cluster", build_crystal_cluster), ("flower_patch", build_flower_patch),
    ("mushroom_glow", build_mushroom_glow), ("tent", build_tent), ("campfire", build_campfire),
    ("signpost", build_signpost), ("lantern_post", build_lantern_post), ("crystal_pillar", build_crystal_pillar),
    ("crystal_gate", build_crystal_gate), ("lumen_spring", build_lumen_spring), ("fence", build_fence),
    ("house_a", build_house_a), ("house_b", build_house_b), ("market_stall", build_market_stall),
    ("fountain", build_fountain), ("ruin_arch", build_ruin_arch), ("ruin_column", build_ruin_column),
    ("shop_counter", build_shop_counter), ("weapon_rack", build_weapon_rack), ("banner", build_banner),
    ("crystal_spire", build_crystal_spire), ("ruin_arch_shrine", build_ruin_arch_shrine),  # DES-004 step 2 (not in the contract yet)
]
CHARACTER_PARTS = {
    "hero": ("hero_body", "hero_head", "hero_sword"),
    "puffcap": ("puffcap_cap", "puffcap_stem"),
    "thornling": ("thornling_body",),
    "prismback": ("prismback_body", "prismback_shell", "prismback_horn", "prismback_legs"),
}
REQUIRED_NODES = [n for n, _ in ASSETS] + [c for parts in CHARACTER_PARTS.values() for c in parts]
TRI_BUDGET = 60000
SCATTER_CAPS = {  # instanced scatter props (coordinator request after the in-game test)
    "tree_round": 350, "tree_round_b": 350, "tree_pine": 350,
    "bush": 150, "rock_a": 150, "rock_b": 150, "flower_patch": 150, "mushroom_glow": 150,
    "crystal_cluster": 150,
}


# ============================================================================= pipeline
def reset_scene(factory):
    """Headless: start from an empty factory scene. Inside a running Blender (pasted / MCP):
    keep the session and add-ons alive and only remove what this script owns."""
    if factory:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        return
    owned = set(REQUIRED_NODES) | {"campfire_flame"}
    coll = bpy.data.collections.get(KIT_COLLECTION)
    doomed = [o for o in bpy.data.objects if o.name in owned or (coll and o.name in coll.objects)]
    for obj in doomed:
        data = obj.data
        bpy.data.objects.remove(obj, do_unlink=True)
        if isinstance(data, bpy.types.Mesh) and data.users == 0:
            bpy.data.meshes.remove(data)
    for name in PALETTE:
        mat = bpy.data.materials.get(name)
        if mat is not None and mat.users == 0:
            bpy.data.materials.remove(mat)
    if coll is not None:
        bpy.data.collections.remove(coll)


def triangle_count(obj):
    if obj.type != "MESH":
        return 0
    return sum(len(p.vertices) - 2 for p in obj.data.polygons)


def asset_tris(root):
    return triangle_count(root) + sum(triangle_count(c) for c in root.children_recursive)


def output_path():
    env = os.environ.get("SYNES_KIT_OUT")
    if env:
        return env
    here = globals().get("__file__", "")
    if here and os.path.isfile(here):
        repo = os.path.abspath(os.path.join(os.path.dirname(here), "..", ".."))
        if os.path.isfile(os.path.join(repo, "docs", "art", "ASSET_CONTRACT.md")):
            return os.path.join(repo, GLB_RELPATH)
    if REPO_ROOT:
        return os.path.join(REPO_ROOT, GLB_RELPATH)
    return os.path.join(os.path.expanduser("~"), "synes_kit.glb")


def export_glb(path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    wanted = dict(
        filepath=path, export_format="GLB", check_existing=False, collection=KIT_COLLECTION,
        export_yup=True, export_apply=True, export_cameras=False, export_lights=False,
        export_extras=False, export_texcoords=False, export_normals=True, export_tangents=False,
        export_materials="EXPORT", export_vertex_color="NONE", export_attributes=False,
        export_animations=False, export_skins=False, export_morph=False,
        export_draco_mesh_compression_enable=False, export_meshopt_compression_enable=False,
        export_image_format="NONE", export_shared_accessors=False,
    )
    available = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    kwargs = {k: v for k, v in wanted.items() if k in available}
    if "collection" not in kwargs:  # older Blender: fall back to exporting the selection
        kwargs["use_selection"] = True
        for obj in bpy.data.objects:
            obj.select_set(obj.name in kit_collection().all_objects)
    bpy.ops.export_scene.gltf(**kwargs)


def main(factory_reset=None):
    reset_scene(bpy.app.background if factory_reset is None else factory_reset)
    kit_collection()
    print("character variant: %s, spire/shrine variant: %s" % (CHAR_VARIANT, SPIRE_VARIANT))
    rows = []
    for name, build in ASSETS:
        if KIT_ONLY and name not in KIT_ONLY:
            continue
        build()
        root = bpy.data.objects[name]
        rows.append((name, asset_tris(root)))
    missing = [] if KIT_ONLY else [n for n in REQUIRED_NODES if bpy.data.objects.get(n) is None]
    if missing:
        raise RuntimeError("missing contract nodes: %s" % ", ".join(missing))
    total = sum(t for _, t in rows)
    for name, tris in rows:
        print("  %-16s %6d tris" % (name, tris))
    print("  %-16s %6d tris (budget %d)" % ("TOTAL", total, TRI_BUDGET))
    if total > TRI_BUDGET:
        raise RuntimeError("triangle budget exceeded: %d > %d" % (total, TRI_BUDGET))
    over = ["%s %d > %d" % (n, t, SCATTER_CAPS[n]) for n, t in rows if t > SCATTER_CAPS.get(n, t)]
    if over:
        raise RuntimeError("scatter prop caps exceeded: " + ", ".join(over))
    path = output_path()
    export_glb(path)
    print("exported %s (%.1f KB)" % (path, os.path.getsize(path) / 1024.0))


if __name__ != "build_kit":  # run when executed/pasted; stay passive when imported as a module
    main()
