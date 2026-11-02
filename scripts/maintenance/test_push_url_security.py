"""Network-free regression checks for the retained, disabled submission tool."""
import importlib.util
import pathlib
import ssl
import sys
import types
import unittest
from unittest.mock import Mock, patch


class PushSecurityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        default_context = ssl._create_default_https_context
        path = pathlib.Path(__file__).resolve().parents[2] / 'pushUrl.py'
        spec = importlib.util.spec_from_file_location('push_url_under_test', path)
        cls.script = importlib.util.module_from_spec(spec)
        requests_stub = types.SimpleNamespace(RequestException=type('RequestException', (Exception,), {}), get=Mock(), post=Mock())
        with patch.dict(sys.modules, {'requests': requests_stub}):
            spec.loader.exec_module(cls.script)
        if ssl._create_default_https_context is not default_context:
            raise AssertionError('Import changed global TLS verification')

    def test_credentials_use_https_with_no_redirects_and_timeout(self):
        response = Mock(status_code=200)
        response.json.return_value = {'success': 1}
        with patch.object(self.script.requests, 'post', return_value=response) as post:
            self.script.push_to_bing('https://example.com', [], 'synthetic')
            self.script.push_to_baidu('https://example.com', [], 'synthetic')
        for call in post.call_args_list:
            self.assertTrue(call.args[0].startswith('https://'))
            self.assertFalse(call.kwargs['allow_redirects'])
            self.assertEqual(call.kwargs['timeout'], 20)
            self.assertNotIn('verify', call.kwargs)

    def test_network_error_does_not_log_credential_url(self):
        failure = self.script.requests.RequestException('https://example.com?token=synthetic-secret')
        with patch.object(self.script.requests, 'post', side_effect=failure), patch('builtins.print') as output:
            self.script.push_to_baidu('https://example.com', [], 'synthetic')
        self.assertNotIn('synthetic-secret', str(output.call_args_list))


if __name__ == '__main__':
    unittest.main()
