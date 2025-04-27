import asyncio
import aiohttp
import json
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_wsg_api():
    """WSG Evaluation API를 테스트합니다."""
    async with aiohttp.ClientSession() as session:
        # 1. API 상태 확인
        logger.info("Checking API status...")
        async with session.get('http://localhost:8000/') as response:
            logger.info(f'API Status: {response.status}')
            logger.info(await response.json())
        
        # 2. WSG 평가 요청
        test_urls = [
            'https://me.go.kr',
            'https://www.w3.org/'
        ]
        
        for url in test_urls:
            logger.info(f'\nTesting URL: {url}')
            
            try:
                # 평가 요청
                payload = {
                    'url': url,
                    'options': {
                        'include_screenshots': False,
                        'depth': 1
                    }
                }
                
                async with session.post('http://localhost:8000/wsg/evaluate', json=payload) as response:
                    result = await response.json()
                    logger.info(f'Evaluation Request Status: {response.status}')
                    logger.info(f'Response: {json.dumps(result, indent=2)}')
                    
                    if 'request_id' in result:
                        request_id = result['request_id']
                        
                        # 결과가 준비될 때까지 상태 확인
                        for attempt in range(10):  # 최대 10번 시도
                            await asyncio.sleep(2)  # 2초 대기
                            
                            async with session.get(f'http://localhost:8000/wsg/status/{request_id}') as status_response:
                                status = await status_response.json()
                                logger.info(f'Status Check ({request_id}) - Attempt {attempt + 1}: {status["status"]}')
                                
                                if status['status'] in ['completed', 'failed']:
                                    logger.info(f'Final Result: {json.dumps(status, indent=2)}')
                                    break
                        else:
                            logger.warning(f'Evaluation did not complete within the timeout period for URL: {url}')
                    
            except Exception as e:
                logger.error(f'Error testing URL {url}: {str(e)}')

if __name__ == '__main__':
    asyncio.run(test_wsg_api())
