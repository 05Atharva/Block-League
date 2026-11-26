from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
output = root.parent / 'Block-League-v0.3-source.zip'
excluded = {'.git', '.expo', 'data', 'native-dist', 'dist', '__pycache__'}
with ZipFile(output, 'w', ZIP_DEFLATED) as z:
    for p in sorted(root.rglob('*')):
        rel = p.relative_to(root)
        if not p.is_file() or any(x in excluded for x in rel.parts): continue
        if rel.parts[0] == 'node_modules' or rel.parts[:2] == ('app', 'node_modules'): continue
        if p.name == '.env' or p.suffix in {'.log', '.zip'}: continue
        z.write(p, str(Path('block-league') / rel))
with ZipFile(output) as z:
    assert z.testzip() is None
print(output)
print(f'{output.stat().st_size:,} bytes')
