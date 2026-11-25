import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from xml.etree import ElementTree

EXPORTER_PATH = (
    Path(__file__).resolve().parents[1]
    / 'codex' / 'skills' / 'draw' / 'scripts' / 'export_drawio.py'
)
EXPORTER_SPEC = importlib.util.spec_from_file_location('export_drawio', EXPORTER_PATH)
exporter = importlib.util.module_from_spec(EXPORTER_SPEC)
EXPORTER_SPEC.loader.exec_module(exporter)


class SvgFallbackTests(unittest.TestCase):
    def clean(self, native_fallback):
        svg = (
            '<svg xmlns="http://www.w3.org/2000/svg"><switch>'
            '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml">Diagram label</div></foreignObject>'
            f'{native_fallback}</switch></svg>'
        )
        with TemporaryDirectory() as directory:
            path = Path(directory) / 'diagram.svg'
            path.write_text(svg)
            info = exporter.clean_svg(path)
            root = ElementTree.parse(path).getroot()
            return info, root

    def test_diagnostic_only_fallback_keeps_html_label(self):
        info, root = self.clean('<text>Text is not SVG - cannot display</text>')
        self.assertEqual(info['switches_unfolded'], 0)
        self.assertEqual(info['remaining_foreign_objects'], 1)
        self.assertEqual(info['recommended_ppt_media'], 'png')
        self.assertIn('Diagram label', ''.join(root.itertext()))
        self.assertNotIn('Text is not SVG', ''.join(root.itertext()))

    def test_native_text_fallback_is_preserved(self):
        info, root = self.clean(
            '<g><text>Diagram label</text><text>Text is not SVG - cannot display</text></g>'
        )
        self.assertEqual(info['switches_unfolded'], 1)
        self.assertEqual(info['remaining_foreign_objects'], 0)
        self.assertEqual(info['recommended_ppt_media'], 'png_or_verified_svg')
        self.assertEqual(''.join(root.itertext()), 'Diagram label')


if __name__ == '__main__':
    unittest.main()
