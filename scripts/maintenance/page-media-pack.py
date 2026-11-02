"""Bounded, allowlisted media validation. Never extract a ZIP into the repository."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import struct
import subprocess
import zipfile

MIB = 1024 * 1024
ALIASES = {}
for count, folder, prefix, legacy, legacy_folder in [
    (3, 'hero', 'hero', 'Hero', 'hero'),
    (12, 'portfolio', 'work', 'About', 'about'),
]:
    for i in range(1, count + 1):
        target = f'public/images/insignificantia/{folder}/{prefix}-{i:02}.webp'
        for alias in [f'{legacy_folder}/{legacy}{i}.webp',
                      f'{folder}/{prefix}-{i:02}.webp', f'{legacy}{i}.webp',
                      f'{prefix}-{i:02}.webp']:
            ALIASES[alias] = target


def digest(data):
    return hashlib.sha256(data).hexdigest()


def check_webp(data):
    if (len(data) < 20 or data[:4] != b'RIFF' or data[8:12] != b'WEBP'
            or struct.unpack('<I', data[4:8])[0] + 8 != len(data)):
        raise ValueError('Invalid WebP container')
    offset, chunks = 12, []
    while offset < len(data):
        if offset + 8 > len(data) or len(chunks) >= 16:
            raise ValueError('Invalid WebP chunks')
        kind, size = data[offset:offset + 4], struct.unpack('<I', data[offset + 4:offset + 8])[0]
        if kind not in (b'VP8X', b'VP8 ', b'VP8L', b'ALPH', b'ICCP', b'PSAI'):
            raise ValueError('Unsupported WebP chunk, animation or EXIF/XMP metadata')
        # Photoshop provenance is present in all current site assets; keep it inert.
        if kind == b'PSAI' and size > 65536:
            raise ValueError('Photoshop provenance exceeds 64 KiB')
        chunks.append(kind)
        offset += 8 + size + (size % 2)
    if offset != len(data) or sum(c in (b'VP8 ', b'VP8L') for c in chunks) != 1:
        raise ValueError('Invalid WebP payload')


def read_pack(root, name):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,99}\.zip', name):
        raise ValueError('ZIP must have a plain ASCII basename at repository root')
    pack = root / name
    if pack.is_symlink() or not pack.is_file() or pack.stat().st_size > 100 * MIB:
        raise ValueError('Missing, symlinked or oversized ZIP (100 MiB maximum)')
    raw = pack.read_bytes()
    files, seen = {}, set()
    with zipfile.ZipFile(pack) as archive:
        entries = archive.infolist()
        if len(entries) > 200 or sum(x.file_size for x in entries) > 200 * MIB:
            raise ValueError('ZIP exceeds 200 entries / 200 MiB unpacked')
        for entry in entries:
            name_in = entry.orig_filename
            p = PurePosixPath(name_in)
            clean = name_in.rstrip('/')
            mode = stat.S_IFMT(entry.external_attr >> 16)
            if (name_in != entry.filename or not clean or '\\' in name_in or ':' in name_in or p.is_absolute()
                    or '..' in p.parts or str(p) != clean
                    or any(ord(c) < 32 or ord(c) == 127 for c in name_in)
                    or clean.casefold() in seen
                    or mode not in (0, stat.S_IFREG, stat.S_IFDIR)
                    or entry.flag_bits & 1
                    or entry.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)
                    or entry.file_size > 20 * MIB
                    or entry.file_size > max(1, entry.compress_size) * 100):
                raise ValueError('Unsafe ZIP entry, duplicate, encryption or compression limit')
            seen.add(clean.casefold())
            if entry.is_dir():
                continue
            target = ALIASES.get(name_in)
            if not target:
                if name_in in ('README.md', 'README.txt', '.DS_Store') or name_in.startswith('__MACOSX/'):
                    continue
                raise ValueError('Unrecognized media file; only documented image slots are accepted')
            if target in files:
                raise ValueError('Multiple aliases address the same image slot')
            with archive.open(entry) as source:
                data = source.read(20 * MIB + 1)
            if len(data) != entry.file_size or len(data) > 20 * MIB:
                raise ValueError('Invalid decompressed length')
            check_webp(data)
            files[target] = data
    if not files:
        raise ValueError('No recognized page images')
    return digest(raw), files


def manifest(pack_hash, files):
    return {'version': 1, 'zip_sha256': pack_hash,
            'files': {p: digest(data) for p, data in sorted(files.items())}}


def install(root, files):
    # Check every destination before modifying any of them. Never follow symlinks.
    for target in files:
        p = root
        for part in Path(target).parts:
            p = p / part
            if p.is_symlink():
                raise ValueError('Symlink in image destination')
            if p.exists() and p != root / target and not p.is_dir():
                raise ValueError('Non-directory image parent')
        if p.exists() and not p.is_file():
            raise ValueError('Non-file destination')
    for target, data in files.items():
        path = root / target
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['validate', 'install'])
    parser.add_argument('package')
    parser.add_argument('manifest')
    args = parser.parse_args()
    root = Path.cwd()
    pack_hash, files = read_pack(root, args.package)
    expected = manifest(pack_hash, files)
    if args.mode == 'validate':
        # Native image parsing happens only in the read-only validation job.
        for data in files.values():
            subprocess.run(['node', str(Path(__file__).with_name('validate-page-webp.cjs'))],
                           input=data, check=True, timeout=20)
        Path(args.manifest).write_text(json.dumps(expected, sort_keys=True) + '\n')
    else:
        if json.loads(Path(args.manifest).read_text()) != expected:
            raise ValueError('Validated artifact does not match this ZIP/source revision')
        install(root, files)
    print(f'{len(files)} validated image(s); original bytes preserved')


if __name__ == '__main__':
    main()
