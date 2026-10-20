"""
Built-in tool tests (fix #3): the calculator's safe parser, actionable errors, no key leaks, clamping.
"""

import time
from unittest.mock import MagicMock, patch

import pytest
import requests

from api_agents.agents.services.agent_tools_service import AgentToolsService


@pytest.fixture
def tools():
    service = AgentToolsService()
    service.youtube_api_key = 'AIzaSECRETKEY123'
    service.serpapi_key = 'serpSECRET'
    return service


@pytest.mark.parametrize('expression, expected', [
    ('2 + 2', 4), ('sqrt(16)', 4.0), ('2^3', 8), ('10 * (5 + 3)', 80),
    ('log(100, 10)', 2.0), ('round(pi, 2)', 3.14), ('-3 ** 2', -9), ('6 × 7', 42),
])
def test_calculator_supports_what_it_advertises(tools, expression, expected):
    result = tools.calculate(expression)
    assert result['success'] and abs(result['data']['result'] - expected) < 1e-9


@pytest.mark.parametrize('expression', [
    "__import__('os').system('ls')", '().__class__', 'x + 1', '9 ** 9 ** 9', '1/0', 'sqrt(-1)', '2 +', "open('f')",
])
def test_calculator_rejects_bad_input_quickly_with_a_next_step(tools, expression):
    start = time.monotonic()
    result = tools.calculate(expression)
    assert not result['success'] and 'Next step:' in result['error']
    assert time.monotonic() - start < 1


def http_error(status):
    response = MagicMock(status_code=status)
    return requests.exceptions.HTTPError(
        f'{status} Error for url: https://www.googleapis.com/youtube/v3/search?q=x&key=AIzaSECRETKEY123',
        response=response,
    )


@pytest.mark.parametrize('status, advice', [(403, 'Do not retry'), (429, 'rate limit'), (500, 'Retry once')])
def test_api_errors_are_actionable_and_never_leak_the_key(tools, status, advice):
    with patch('api_agents.agents.services.agent_tools_service.requests.get', side_effect=http_error(status)):
        for result in (tools.search_youtube('cats'), tools.web_search('cats')):
            assert 'SECRET' not in result['error'] and advice in result['error']


def test_result_counts_are_clamped_and_output_trimmed(tools):
    response = MagicMock()
    response.json.return_value = {'organic_results': [
        {'title': str(i), 'link': f'https://r/{i}', 'snippet': 's', 'position': i} for i in range(30)]}
    with patch('api_agents.agents.services.agent_tools_service.requests.get', return_value=response) as get:
        result = tools.web_search('cats', num_results=100)
    assert get.call_args.kwargs['params']['num'] == 10
    assert len(result['data']['results']) == 10 and set(result['data']['results'][0]) == {'title', 'url', 'snippet'}


def test_execute_tool_errors_help_the_model(tools):
    assert 'get_weather' in tools.execute_tool('send_email')['error']
    assert 'city' in tools.execute_tool('get_weather', city='London')['error']
