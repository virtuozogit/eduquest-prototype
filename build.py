#!/usr/bin/env python3
"""Compile templates/index.base.html + partials into root index.html."""
from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader
except ImportError:
    raise SystemExit("Jinja2 is not installed. Run: pip install jinja2")

ROOT = Path(__file__).resolve().parent
env = Environment(loader=FileSystemLoader(ROOT / "templates"), keep_trailing_newline=True)

rendered = env.get_template("index.base.html").render()
out_path = ROOT / "index.html"
out_path.write_text(rendered, encoding="utf-8")
print(f"Built {out_path.name} ({len(rendered.splitlines())} lines)")
