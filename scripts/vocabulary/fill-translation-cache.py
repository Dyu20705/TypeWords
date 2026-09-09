#!/usr/bin/env python3
"""
fill-translation-cache.py
Multi-threaded batch translator to populate .translation-cache.json for all remaining Chinese strings.
"""

import os
import sys
import json
import time
import re
import html
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Set

PROJECT_ROOT = os.path.abspath('.')
DICT_DIR = os.path.join(PROJECT_ROOT, 'public', 'dicts', 'en', 'word')
CACHE_FILE = os.path.join(PROJECT_ROOT, 'scripts', 'vocabulary', '.translation-cache.json')
CHINESE_PATTERN = re.compile(r'[\u4e00-\u9fff\u3400-\u4dbf]')

DOMAIN_REPLACEMENTS = [
    ('[计]', '[tin học]'), ('[计算机]', '[tin học]'), ('[信息]', '[CNTT]'),
    ('[医]', '[y học]'), ('[生]', '[sinh học]'), ('[化]', '[hóa học]'),
    ('[物]', '[vật lý]'), ('[数]', '[toán học]'), ('[经]', '[kinh tế]'),
    ('[商]', '[thương mại]'), ('[法]', '[luật]'), ('[体]', '[thể thao]'),
    ('[地]', '[địa lý]'), ('[海]', '[hàng hải]'), ('[航]', '[hàng không]'),
    ('[机]', '[cơ khí]'), ('[电]', '[điện tử]'), ('[文]', '[văn học]'),
    ('[语]', '[ngôn ngữ]'), ('[植]', '[thực vật]'), ('[动]', '[động vật]'),
    ('[口]', '[khẩu ngữ]'), ('[书]', '[văn viết]'), ('[俚]', '[tiếng lóng]'),
    ('[俗]', '[thông tục]'),
    ('【名】', '(danh từ)'), ('【动】', '(động từ)'), ('【形】', '(tính từ)'),
    ('【副】', '(trạng từ)'), ('【介】', '(giới từ)'), ('【连】', '(liên từ)'),
]

def preprocess(text: str) -> str:
    res = text
    for ch, vi in DOMAIN_REPLACEMENTS:
        res = res.replace(ch, vi)
    return res.replace('\r', '').replace('\n', ' ').strip()

def call_batch(texts: List[str], max_retries: int = 3) -> List[str]:
    if not texts:
        return []
    cleaned = [preprocess(t) for t in texts]
    joined = '\n'.join(cleaned)
    url = 'https://translate.google.com/m?sl=zh-CN&tl=vi&q=' + urllib.parse.quote(joined)
    headers = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'}
    
    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=12) as res:
                raw = res.read().decode('utf-8')
                m = re.search(r'<div class="result-container">([\s\S]*?)</div>', raw)
                if m:
                    unescaped = html.unescape(m.group(1)).strip()
                    lines = [l.strip() for l in unescaped.split('\n')]
                    if len(lines) == len(texts):
                        return lines
        except Exception:
            if attempt < max_retries:
                time.sleep(0.5 * attempt)
    
    # Fallback to single translations if batch fails
    results = []
    for t in texts:
        results.append(translate_single(t))
    return results

def translate_single(text: str) -> str:
    cleaned = preprocess(text)
    url = 'https://translate.google.com/m?sl=zh-CN&tl=vi&q=' + urllib.parse.quote(cleaned)
    headers = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as res:
            raw = res.read().decode('utf-8')
            m = re.search(r'<div class="result-container">([\s\S]*?)</div>', raw)
            if m:
                res = html.unescape(m.group(1)).strip()
                if not CHINESE_PATTERN.search(res):
                    return res
    except Exception:
        pass
    return ""

def main():
    cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)

    # Collect all needed strings
    needed = set()
    for file in sorted(os.listdir(DICT_DIR)):
        if not file.endswith('.json'): continue
        with open(os.path.join(DICT_DIR, file), 'r', encoding='utf-8') as f:
            words = json.load(f)
        for w in words:
            for t in w.get('trans', []):
                cn = t.get('cn', '')
                if cn and CHINESE_PATTERN.search(cn):
                    if cn not in cache or CHINESE_PATTERN.search(cache[cn]):
                        needed.add(cn)

    needed_list = list(needed)
    print(f"Total strings needing translation: {len(needed_list)}")
    if not needed_list:
        print("All strings already translated!")
        return

    batch_size = 50
    batches = [needed_list[i:i + batch_size] for i in range(0, len(needed_list), batch_size)]
    print(f"Divided into {len(batches)} batches of {batch_size} (running 8 concurrent workers)...")

    completed = 0
    translated_count = 0
    last_save = time.time()

    with ThreadPoolExecutor(max_workers=8) as executor:
        future_to_batch = {executor.submit(call_batch, b): b for b in batches}
        for future in as_completed(future_to_batch):
            orig_batch = future_to_batch[future]
            try:
                results = future.result()
                for src, dst in zip(orig_batch, results):
                    if dst and not CHINESE_PATTERN.search(dst):
                        cache[src] = dst
                        translated_count += 1
            except Exception as e:
                pass

            completed += len(orig_batch)
            if completed % 500 == 0 or completed == len(needed_list):
                print(f"Progress: {completed}/{len(needed_list)} processed, {translated_count} translated")

            if time.time() - last_save > 10:
                tmp = CACHE_FILE + '.tmp'
                with open(tmp, 'w', encoding='utf-8') as f:
                    json.dump(cache, f, ensure_ascii=False, indent=2)
                os.replace(tmp, CACHE_FILE)
                last_save = time.time()

    # Final save
    tmp = CACHE_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    os.replace(tmp, CACHE_FILE)
    print(f"Done! Cache updated with {translated_count} new translations. Total cache entries: {len(cache)}")

if __name__ == '__main__':
    main()
