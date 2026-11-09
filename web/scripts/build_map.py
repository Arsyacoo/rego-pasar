"""Turn geoBoundaries ADM2 polygons for DIY into SVG paths for the page map.

Source: geoBoundaries gbOpen IDN ADM2 (simplified), release 9469f09,
from BPS, WFP and OCHA ROAP via HDX. Licence: CC BY 3.0 IGO.
https://www.geoboundaries.org/  (download the *_simplified.geojson first)

Usage: python web/scripts/build_map.py <IDN-ADM2_simplified.geojson>
Writes web/src/diy-map.json.
"""

import json
import math
import sys
from pathlib import Path

NAMES = {
    "Kota Yogyakarta": "kota-yogyakarta",
    "Sleman": "sleman",
    "Bantul": "bantul",
    "Kulon Progo": "kulon-progo",
    "Gunung Kidul": "gunungkidul",
}
WIDTH = 460.0  # viewBox width of the land area

# Cartographic generalization: the simplified source draws the Bogowonto river
# mouth on Kulon Progo's west coast as a hair-thin sliver. Drop those vertices.
DROP = {"kulon-progo": lambda lon, lat: lon < 110.03 and -7.90 < lat < -7.88}
PAD = 24.0


def rings(geometry: dict) -> list[list[list[float]]]:
    polys = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
    return [poly[0] for poly in polys]  # outer rings only; DIY units have no holes worth drawing


def centroid(ring: list[list[float]]) -> tuple[float, float]:
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(ring, ring[1:]):
        cross = x0 * y1 - x1 * y0
        a += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    return cx / (3 * a), cy / (3 * a)


def main() -> None:
    features = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))["features"]
    units = {NAMES[f["properties"]["shapeName"]]: rings(f["geometry"]) for f in features if f["properties"]["shapeName"] in NAMES}
    assert len(units) == 5, units.keys()
    for rid, drop in DROP.items():
        units[rid] = [[p for p in r if not drop(*p)] for r in units[rid]]

    pts = [p for rs in units.values() for r in rs for p in r]
    lon_min, lon_max = min(p[0] for p in pts), max(p[0] for p in pts)
    lat_min, lat_max = min(p[1] for p in pts), max(p[1] for p in pts)
    kx = math.cos(math.radians((lat_min + lat_max) / 2))  # equirectangular, true at mid-latitude
    scale = WIDTH / ((lon_max - lon_min) * kx)
    height = (lat_max - lat_min) * scale

    def project(lon: float, lat: float) -> tuple[float, float]:
        return (round(PAD + (lon - lon_min) * kx * scale, 1), round(PAD + (lat_max - lat) * scale, 1))

    out = {
        "source": "geoBoundaries IDN ADM2 (BPS, WFP, OCHA ROAP), CC BY 3.0 IGO",
        "viewBox": [0, 0, round(WIDTH + 2 * PAD), round(height + 2 * PAD)],
        "projection": {"lonMin": lon_min, "latMax": lat_max, "kx": kx, "scale": scale, "pad": PAD},
        "regions": {},
    }
    for rid, rs in units.items():
        d = " ".join("M" + "L".join(f"{x},{y}" for x, y in (project(*p) for p in r[:-1])) + "Z" for r in rs)
        main_ring = max(rs, key=len)
        out["regions"][rid] = {"d": d, "label": project(*centroid(main_ring))}
    target = Path(__file__).resolve().parent.parent / "src" / "diy-map.json"
    target.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {target} ({target.stat().st_size} bytes), viewBox {out['viewBox']}")


if __name__ == "__main__":
    main()
