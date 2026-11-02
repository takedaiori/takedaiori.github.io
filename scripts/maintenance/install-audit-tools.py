"""Download fixed upstream security tools and verify bytes before execution."""
import hashlib
import io
import pathlib
import tarfile
import urllib.request

TOOLS = {
    'shellcheck': ('https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.xz', '8c3be12b05d5c177a04c29e3c78ce89ac86f1595681cab149b65b97c4e227198'),
    'gitleaks': ('https://github.com/gitleaks/gitleaks/releases/download/v8.30.1/gitleaks_8.30.1_linux_x64.tar.gz', '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb'),
    'actionlint': ('https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz', '8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8')
}

def main():
    target = pathlib.Path('.tmp/audit-tools')
    target.mkdir(parents=True, exist_ok=True)
    for name, (url, sha) in TOOLS.items():
        with urllib.request.urlopen(url, timeout=60) as response:
            data = response.read(30 * 1024 * 1024 + 1)
        if len(data) > 30 * 1024 * 1024 or hashlib.sha256(data).hexdigest() != sha:
            raise ValueError('Security tool checksum mismatch')
        with tarfile.open(fileobj=io.BytesIO(data), mode='r:*') as archive:
            entry = archive.getmember('shellcheck-v0.11.0/shellcheck' if name == 'shellcheck' else name)
            if not entry.isfile() or entry.size > 100 * 1024 * 1024:
                raise ValueError('Unexpected binary archive entry')
            binary = archive.extractfile(entry)
            if binary is None:
                raise ValueError('Missing tool binary')
            (target / name).write_bytes(binary.read())
        (target / name).chmod(0o755)

if __name__ == '__main__':
    main()
