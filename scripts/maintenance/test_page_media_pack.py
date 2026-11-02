"""Archive attacks, full decoder checks, and isolated Git maintenance simulation."""
import importlib.util
import json
from pathlib import Path
import stat
import subprocess
import tempfile
import unittest
import zipfile

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('media', HERE / 'page-media-pack.py')
media = importlib.util.module_from_spec(spec)
spec.loader.exec_module(media)


class MediaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.image = subprocess.check_output(['node', '-e', "require('sharp')({create:{width:32,height:24,channels:3,background:'#123456'}}).webp().toBuffer().then(b=>process.stdout.write(b))"], cwd=HERE)

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.pack = 'Insignificantia-page-media.zip'

    def archive(self, entries):
        with zipfile.ZipFile(self.root / self.pack, 'w') as z:
            for name, data in entries:
                z.writestr(name, data)

    def reject(self, entries):
        self.archive(entries)
        with self.assertRaises((ValueError, zipfile.BadZipFile)):
            media.read_pack(self.root, self.pack)
        self.assertFalse((self.root / 'public').exists())

    def test_valid_alias_and_byte_preservation(self):
        self.archive([('hero/Hero1.webp', self.image), ('about/About12.webp', self.image)])
        _, files = media.read_pack(self.root, self.pack)
        media.install(self.root, files)
        self.assertEqual(len(files), 2)
        for path in files:
            self.assertEqual((self.root / path).read_bytes(), self.image)

    def test_path_attacks(self):
        for name in ['../Hero1.webp', '/Hero1.webp', 'C:/Hero1.webp', 'hero\\Hero1.webp', './Hero1.webp', 'hero//Hero1.webp', 'Hero1.webp\n']:
            with self.subTest(name=name):
                self.reject([(name, self.image)])

    def test_unknown_and_duplicate_slots(self):
        for entries in [[('payload.js', self.image)], [('Hero1.webp', self.image), ('hero/Hero1.webp', self.image)], [('Hero1.webp', self.image), ('HERO1.webp', self.image)]]:
            with self.subTest(entries=[x[0] for x in entries]):
                self.reject(entries)

    def test_symlink_archive(self):
        item = zipfile.ZipInfo('Hero1.webp')
        item.create_system = 3
        item.external_attr = (stat.S_IFLNK | 0o777) << 16
        self.reject([(item, b'/etc/passwd')])

    def test_zip_bomb(self):
        with zipfile.ZipFile(self.root / self.pack, 'w', compression=zipfile.ZIP_DEFLATED) as z:
            z.writestr('Hero1.webp', b'0' * 1000000)
        with self.assertRaises(ValueError):
            media.read_pack(self.root, self.pack)

    def test_entry_limit(self):
        self.reject([(f'file{i}', b'') for i in range(201)])

    def test_package_names(self):
        for name in ['../a.zip', '-a.zip', 'a.zip\n', 'a/b.zip', 'a.zip;echo.zip']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                media.read_pack(self.root, name)

    def test_no_partial_write_with_symlink_destination(self):
        target = 'public/images/insignificantia/portfolio/work-01.webp'
        parent = self.root / Path(target).parent
        parent.mkdir(parents=True)
        (self.root / target).symlink_to(self.root / 'outside')
        with self.assertRaises(ValueError):
            media.install(self.root, {'public/images/insignificantia/hero/hero-01.webp': self.image, target: self.image})
        self.assertFalse((self.root / 'public/images/insignificantia/hero').exists())

    def test_header_fake_and_metadata_rejected(self):
        for data in [b'RIFF\x04\x00\x00\x00WEBP', b'bad', self.image[:-1]]:
            self.reject([('Hero1.webp', data)])
        for kind in [b'EXIF', b'XMP ', b'ANIM', b'ANMF']:
            data = bytearray(self.image + kind + b'\x00' * 4)
            data[4:8] = (len(data) - 8).to_bytes(4, 'little')
            self.reject([('Hero1.webp', bytes(data))])

    def test_real_decode_and_corruption(self):
        decoder = HERE / 'validate-page-webp.cjs'
        valid = subprocess.run(['node', str(decoder)], input=self.image, capture_output=True)
        self.assertEqual(valid.returncode, 0, valid.stderr)
        fake = b'RIFF' + (14).to_bytes(4, 'little') + b'WEBPVP8 ' + (1).to_bytes(4, 'little') + b'\0\0'
        media.check_webp(fake)  # Container valid; pixel decoder must still reject it.
        bad = subprocess.run(['node', str(decoder)], input=fake, capture_output=True)
        self.assertNotEqual(bad.returncode, 0)

    def test_current_site_images_remain_compatible(self):
        site_root = HERE.parent.parent
        images = sorted((site_root / 'public/images/insignificantia').glob('*/*.webp'))
        self.assertEqual(len(images), 15)
        self.archive([(str(p.relative_to(site_root / 'public/images/insignificantia')), p.read_bytes()) for p in images])
        result = subprocess.run(['python', str(HERE / 'page-media-pack.py'), 'validate', self.pack, str(self.root / 'manifest.json')], cwd=self.root, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_excessive_dimensions_rejected(self):
        wide = subprocess.check_output(['node', '-e', "require('sharp')({create:{width:12001,height:1,channels:3,background:'#123456'}}).webp().toBuffer().then(b=>process.stdout.write(b))"], cwd=HERE)
        result = subprocess.run(['node', str(HERE / 'validate-page-webp.cjs')], input=wide, capture_output=True)
        self.assertNotEqual(result.returncode, 0)

    def test_source_zip_changed_after_validation(self):
        self.archive([('Hero1.webp', self.image)])
        pack_hash, files = media.read_pack(self.root, self.pack)
        manifest = self.root / 'manifest.json'
        manifest.write_text(json.dumps(media.manifest(pack_hash, files)))
        self.archive([('Hero2.webp', self.image)])
        result = subprocess.run(['python', str(HERE / 'page-media-pack.py'), 'install', self.pack, str(manifest)], cwd=self.root, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.root / 'public').exists())

    def test_manifest_tamper_leaves_repository_untouched(self):
        self.archive([('Hero1.webp', self.image)])
        manifest = self.root / 'manifest.json'
        subprocess.run(['python', str(HERE / 'page-media-pack.py'), 'validate', self.pack, str(manifest)], cwd=self.root, check=True, capture_output=True)
        manifest.write_text('{}')
        result = subprocess.run(['python', str(HERE / 'page-media-pack.py'), 'install', self.pack, str(manifest)], cwd=self.root, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.root / 'public').exists())

    def test_valid_maintenance_branch_does_not_modify_main(self):
        def git(*args):
            return subprocess.check_output(['git', *args], cwd=self.root, stderr=subprocess.DEVNULL).decode().strip()
        git('init', '-b', 'main')
        git('config', 'user.name', 'Simulation')
        git('config', 'user.email', 'simulation@example.invalid')
        self.archive([('Hero1.webp', self.image)])
        git('add', self.pack)
        git('commit', '-m', 'Fixture upload')
        main = git('rev-parse', 'main')
        pack_hash, files = media.read_pack(self.root, self.pack)
        (self.root / 'manifest.json').write_text(json.dumps(media.manifest(pack_hash, files)))
        subprocess.run(['python', str(HERE / 'page-media-pack.py'), 'install', self.pack, 'manifest.json'], cwd=self.root, check=True, capture_output=True)
        git('add', '--', *files)
        git('rm', '--', self.pack)
        git('switch', '-c', 'maintenance/page-media-123-1')
        git('commit', '-m', 'Install validated fixture')
        self.assertEqual(git('rev-parse', 'main'), main)
        self.assertEqual(set(git('diff', '--name-only', 'main...HEAD').splitlines()), set(files) | {self.pack})
        git('init', '--bare', 'remote.git')
        git('push', str(self.root / 'remote.git'), 'HEAD:refs/heads/maintenance/page-media-123-1')
        refs = git('ls-remote', str(self.root / 'remote.git'))
        self.assertIn('refs/heads/maintenance/page-media-123-1', refs)
        self.assertNotIn('refs/heads/main', [line.split('\t')[-1] for line in refs.splitlines()])


if __name__ == '__main__':
    unittest.main()
