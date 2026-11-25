#!/usr/bin/env python3
"""Export one editable draw.io page to PNG/SVG without editing its source or a PPTX."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

SVG = 'http://www.w3.org/2000/svg'
XLINK = 'http://www.w3.org/1999/xlink'
ET.register_namespace('', SVG)
ET.register_namespace('xlink', XLINK)


def local(tag):
    return tag.rsplit('}', 1)[-1]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def drawio_binary(explicit):
    choices = [explicit, os.environ.get('DRAWIO_BIN'),
               '/Applications/draw.io.app/Contents/MacOS/draw.io',
               shutil.which('drawio'), shutil.which('draw.io')]
    for item in choices:
        if not item:
            continue
        found = shutil.which(str(item)) or str(Path(item).expanduser())
        if Path(found).is_file() and os.access(found, os.X_OK):
            return str(Path(found).resolve())
        if explicit:
            break
    raise ValueError('Cannot find draw.io. Pass --drawio with an installed executable.')


def is_svg_warning(value):
    return value.startswith('Text is not SVG') and 'cannot display' in value


def has_displayable_content(element):
    tag = local(element.tag)
    if tag == 'text':
        value = ''.join(element.itertext()).strip()
        return bool(value) and not is_svg_warning(value)
    if tag == 'path':
        return bool(element.get('d', '').strip())
    if tag in {'image', 'use'}:
        return bool((element.get('href') or element.get('{'+XLINK+'}href', '')).strip())
    return False


def clean_svg(path):
    tree = ET.parse(path)
    root = tree.getroot()
    if local(root.tag) != 'svg':
        raise ValueError('Export is not an SVG document')
    unfolded = 0
    for parent in list(root.iter()):
        for switch in list(parent):
            if local(switch.tag) != 'switch':
                continue
            fallback = [x for x in switch if local(x.tag) != 'foreignObject']
            # Never discard an HTML-only label just because foreignObject is less portable.
            if not any(has_displayable_content(x) for branch in fallback for x in branch.iter()):
                continue
            at = list(parent).index(switch)
            parent.remove(switch)
            for child in fallback:
                parent.insert(at, child)
                at += 1
            unfolded += 1
    removed_messages = 0
    for parent in list(root.iter()):
        for child in list(parent):
            if local(child.tag) == 'text':
                text = ''.join(child.itertext()).strip()
                if is_svg_warning(text):
                    parent.remove(child)
                    removed_messages += 1
    images = [x for x in root.iter() if local(x.tag) == 'image']
    embedded = 0
    external = []
    for image in images:
        href = image.get('href', image.get('{'+XLINK+'}href', ''))
        if href.startswith('data:image/'):
            embedded += 1
        elif not href.startswith('#'):
            external.append(href)
    html_count = sum(local(x.tag) == 'foreignObject' for x in root.iter())
    tree.write(path, encoding='utf-8', xml_declaration=True)
    return {'switches_unfolded': unfolded, 'fallback_messages_removed': removed_messages,
            'remaining_foreign_objects': html_count, 'embedded_raster_images': embedded,
            'external_image_count': len(external),
            'recommended_ppt_media': 'png' if embedded or html_count or external else 'png_or_verified_svg'}


def png_dimensions(path):
    with path.open('rb') as f:
        header = f.read(24)
    if len(header) < 24 or header[:8] != b'\x89PNG\r\n\x1a\n' or header[12:16] != b'IHDR':
        raise ValueError('Export is not a valid PNG header')
    width, height = struct.unpack('>II', header[16:24])
    if width <= 0 or height <= 0:
        raise ValueError('PNG has invalid dimensions')
    return width, height


def run(args):
    source = Path(args.source).expanduser().resolve()
    out_dir = Path(args.out_dir).expanduser().resolve()
    if not source.is_file():
        raise ValueError(f'Source does not exist: {source}')
    if source.suffix.lower() not in {'.drawio', '.xml'}:
        raise ValueError('Provide a .drawio or draw.io XML source')
    if args.width < 100 or args.page < 1 or args.timeout <= 0:
        raise ValueError('Use width >= 100, page >= 1 and a positive timeout')
    stem = args.stem or source.stem
    if stem in {'.', '..'} or Path(stem).name != stem or '/' in stem or '\\' in stem:
        raise ValueError('--stem must be a filename stem, not a path')
    targets = {fmt: out_dir/f'{stem}.{fmt}' for fmt in ['png', 'svg']}
    if not args.overwrite:
        exists = [str(p) for p in targets.values() if p.exists()]
        if exists:
            raise ValueError('Outputs already exist; use --overwrite deliberately: '+', '.join(exists))
    binary = drawio_binary(args.drawio)
    source_hash = sha(source)
    out_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='drawio-export-', dir=out_dir) as temporary:
        stage = Path(temporary)
        for fmt in ['png', 'svg']:
            command = [binary, '--export', '--theme', 'light', '--size', 'page',
                       '--format', fmt, '--page-index', str(args.page),
                       '--timeout', str(args.timeout), '--output', str(stage/f'{stem}.{fmt}')]
            command += ['--width', str(args.width)] if fmt == 'png' else [
                '--embed-svg-images', '--embed-svg-fonts', 'false']
            command += [str(source)]
            done = subprocess.run(command, capture_output=True, text=True, timeout=args.timeout+10)
            if done.returncode != 0:
                raise RuntimeError(f'draw.io {fmt} export failed: {(done.stderr or done.stdout)[-2000:]}')
            result = stage/f'{stem}.{fmt}'
            if not result.is_file() or result.stat().st_size == 0:
                raise RuntimeError(f'draw.io did not produce {fmt} output')
        width, height = png_dimensions(stage/f'{stem}.png')
        svg_info = clean_svg(stage/f'{stem}.svg')
        if sha(source) != source_hash:
            raise RuntimeError('The source changed during export; outputs were not published')
        for fmt, destination in targets.items():
            if destination.exists() and not args.overwrite:
                raise RuntimeError(f'Output appeared during export: {destination}')
        for fmt, destination in targets.items():
            os.replace(stage/f'{stem}.{fmt}', destination)
    warnings = []
    if svg_info['embedded_raster_images']:
        warnings.append('For WPS photo overlays, insert the PNG; embedded SVG photos may be omitted.')
    if svg_info['remaining_foreign_objects']:
        warnings.append('SVG still has HTML-only content; inspect labels in the actual target application.')
    if svg_info['external_image_count']:
        warnings.append('SVG contains non-embedded images; make the source self-contained and export again.')
    return {'source': str(source), 'source_sha256': source_hash, 'page': args.page,
            'drawio_executable': binary, 'png_dimensions': [width, height], 'svg': svg_info,
            'outputs': {fmt: {'path': str(p), 'sha256': sha(p)} for fmt, p in targets.items()},
            'warnings': warnings}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('--out-dir', required=True)
    parser.add_argument('--width', type=int, default=4000)
    parser.add_argument('--page', type=int, default=1, help='1-based draw.io page index')
    parser.add_argument('--stem')
    parser.add_argument('--drawio')
    parser.add_argument('--timeout', type=int, default=60)
    parser.add_argument('--overwrite', action='store_true')
    args = parser.parse_args()
    try:
        print(json.dumps(run(args), ensure_ascii=False, indent=2))
    except (ValueError, RuntimeError, OSError, ET.ParseError, subprocess.TimeoutExpired) as exc:
        print(json.dumps({'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
