#!/usr/bin/env python3
"""
translate-zh-to-vi.py

High-performance multi-threaded Chinese (zh-CN) -> Vietnamese batch translation
pipeline for TypeWords vocabulary dataset.

Features:
- Preserves original Chinese in `cn_source`, `t_source`, `d_source` for traceability.
- Preserves 100% of English headwords, phonetics, example sentences, phrases, and grammar.
- Translates Chinese POS tags to Vietnamese equivalents.
- Multi-threaded concurrent batch translation (4 workers, 70 lines per batch).
- Persistent disk cache (`.translation-cache.json`) shared across all dictionaries.
- Checkpoint-based resumption (`.checkpoints/<file>.done`).
- Validates JSON integrity before saving.

Usage:
  python3 scripts/vocabulary/translate-zh-to-vi.py --file nce-new-1.json
  python3 scripts/vocabulary/translate-zh-to-vi.py --priority
  python3 scripts/vocabulary/translate-zh-to-vi.py --all
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
from typing import List, Dict, Set, Any, Tuple

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DICT_DIR = os.path.join(PROJECT_ROOT, 'public', 'dicts', 'en', 'word')
CACHE_FILE = os.path.join(os.path.dirname(__file__), '.translation-cache.json')
CHECKPOINT_DIR = os.path.join(os.path.dirname(__file__), '.checkpoints')
REPORT_FILE = os.path.join(os.path.dirname(__file__), 'translation-report.json')

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

POS_MAP = {
    '名': 'danh từ', 'n.': 'd.', 'n': 'd.',
    '动': 'động từ', 'v.': 'đg.', 'v': 'đg.',
    'vt.': 'ngđ.', 'vi.': 'nđ.',
    '形': 'tính từ', 'adj.': 'tt.', 'a.': 'tt.',
    '副': 'trạng từ', 'adv.': 'trạng từ',
    '介': 'giới từ', 'prep.': 'gt.',
    '连': 'liên từ', 'conj.': 'lt.',
    '代': 'đại từ', 'pron.': 'đại từ',
    '数': 'số từ', 'num.': 'số từ',
    '冠': 'mạo từ', 'art.': 'mạo từ',
    '感': 'thán từ', 'interj.': 'thán từ',
    '助': 'trợ từ', '缩': 'viết tắt', 'abbr.': 'viết tắt',
    '叹': 'thán từ',
}

PRIORITY_DICTS = [
    'CET4_T.json',
    'CET6_T.json',
    'IELTS_3_T.json',
    'TOEFL_3_T.json',
    'Level4luan_2_T.json',      # TEM-4 / 专四
    'Level8luan_2_T.json',      # TEM-8 / 专八
    'nce-new-1.json',
    'nce-new-2.json',
    'nce-new-3.json',
    'nce-new-4.json',
    'it-words.json',            # Programmer English / 程序员常用词
    'itVocabulary.json',        # Computer English / 计算机专用英语
    'KaoYan_3_T.json',          # 考研
    'GaoKao_3500.json',         # 高考 3500 词
    'CET-4-frequency.json',     # CET-4（翻译带频率）
]

def load_cache() -> Dict[str, str]:
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_cache(cache: Dict[str, str]):
    tmp = CACHE_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)
    os.replace(tmp, CACHE_FILE)

def contains_chinese(text: Any) -> bool:
    if not isinstance(text, str):
        return False
    return bool(CHINESE_PATTERN.search(text))

def preprocess_chinese_text(text: str) -> str:
    res = text
    for ch, vi in DOMAIN_REPLACEMENTS:
        res = res.replace(ch, vi)
    return res

def translate_pos(pos: str) -> str:
    if not pos:
        return pos
    trimmed = pos.strip()
    return POS_MAP.get(trimmed, pos)

def call_google_translate_batch(texts: List[str], max_retries: int = 3) -> List[str]:
    if not texts:
        return []
    
    cleaned = [preprocess_chinese_text(t.replace('\r', '').replace('\n', ' ')).strip() for t in texts]
    joined = '\n'.join(cleaned)
    url = 'https://translate.google.com/m?sl=zh-CN&tl=vi&q=' + urllib.parse.quote(joined)
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
    }
    
    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=14) as res:
                raw = res.read().decode('utf-8')
                m = re.search(r'<div class="result-container">([\s\S]*?)</div>', raw)
                if m:
                    unescaped = html.unescape(m.group(1)).strip()
                    lines = [l.strip() for l in unescaped.split('\n')]
                    if len(lines) == len(texts):
                        return lines
                    elif len(lines) > 0:
                        break
        except Exception:
            if attempt < max_retries:
                time.sleep(1.0 * attempt)
    
    # Fallback to single translations
    results = []
    for t in texts:
        results.append(translate_single(t))
    return results

def translate_single(text: str) -> str:
    if not contains_chinese(text):
        return text
    clean = preprocess_chinese_text(text.replace('\r', '').replace('\n', ' ')).strip()
    url = 'https://translate.google.com/m?sl=zh-CN&tl=vi&q=' + urllib.parse.quote(clean)
    headers = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as res:
            raw = res.read().decode('utf-8')
            m = re.search(r'<div class="result-container">([\s\S]*?)</div>', raw)
            if m:
                return html.unescape(m.group(1)).strip()
    except Exception:
        pass
    return text

def parallel_translate_unique(
    needed_strings: List[str],
    cache: Dict[str, str],
    batch_size: int = 70,
    max_workers: int = 4
) -> int:
    if not needed_strings:
        return 0
    
    batches = [needed_strings[i:i + batch_size] for i in range(0, len(needed_strings), batch_size)]
    completed = 0
    new_translated = 0
    total = len(needed_strings)
    
    print(f"      Translating {total} unique strings in {len(batches)} parallel batches ({max_workers} workers)...")
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_batch = {
            executor.submit(call_google_translate_batch, b): b for b in batches
        }
        
        last_save_time = time.time()
        for future in as_completed(future_to_batch):
            orig_batch = future_to_batch[future]
            try:
                results = future.result()
                for src, dst in zip(orig_batch, results):
                    if dst and dst != src:
                        cache[src] = dst
                        new_translated += 1
                    else:
                        cache[src] = src
            except Exception as e:
                for src in orig_batch:
                    cache[src] = src
                    
            completed += len(orig_batch)
            print(f"\r      Progress: {min(completed, total)}/{total} strings translated ({new_translated} new)", end='', flush=True)
            
            # Periodic cache save every 15s
            if time.time() - last_save_time > 15:
                save_cache(cache)
                last_save_time = time.time()

    print()
    save_cache(cache)
    return new_translated

def translate_dictionary_file(
    file_path: str,
    cache: Dict[str, str],
    batch_size: int = 70,
    max_workers: int = 4
) -> Tuple[int, int, int]:
    with open(file_path, 'r', encoding='utf-8') as f:
        words = json.load(f)
    
    unique_chinese: Set[str] = set()
    total_chinese_fields = 0
    
    for w in words:
        for t in w.get('trans', []):
            cn = t.get('cn', '')
            if contains_chinese(cn):
                unique_chinese.add(cn)
                total_chinese_fields += 1
        for s in w.get('sentences', []):
            cn = s.get('cn', '')
            if contains_chinese(cn):
                unique_chinese.add(cn)
                total_chinese_fields += 1
        for p in w.get('phrases', []):
            cn = p.get('cn', '')
            if contains_chinese(cn):
                unique_chinese.add(cn)
                total_chinese_fields += 1
        for s in w.get('synos', []):
            cn = s.get('cn', '')
            if contains_chinese(cn):
                unique_chinese.add(cn)
                total_chinese_fields += 1
        rel_words = w.get('relWords', {})
        if isinstance(rel_words, dict):
            for r in rel_words.get('rels', []):
                for sub_w in r.get('words', []):
                    cn = sub_w.get('cn', '')
                    if contains_chinese(cn):
                        unique_chinese.add(cn)
                        total_chinese_fields += 1
        for e in w.get('etymology', []):
            t_str = e.get('t', '')
            d_str = e.get('d', '')
            if contains_chinese(t_str):
                unique_chinese.add(t_str)
                total_chinese_fields += 1
            if contains_chinese(d_str):
                unique_chinese.add(d_str)
                total_chinese_fields += 1

    needed = [s for s in unique_chinese if s not in cache]
    cached_count = len(unique_chinese) - len(needed)
    
    translated_count = 0
    if needed:
        translated_count = parallel_translate_unique(needed, cache, batch_size=batch_size, max_workers=max_workers)
    else:
        print(f"      All {len(unique_chinese)} unique strings loaded from cache.")

    # Apply translations
    for w in words:
        for t in w.get('trans', []):
            if t.get('pos') and contains_chinese(t['pos']):
                t['pos'] = translate_pos(t['pos'])
            cn = t.get('cn', '')
            if contains_chinese(cn):
                t['cn_source'] = cn
                t['cn'] = cache.get(cn, cn)
                
        for s in w.get('sentences', []):
            cn = s.get('cn', '')
            if contains_chinese(cn):
                s['cn_source'] = cn
                s['cn'] = cache.get(cn, cn)
                
        for p in w.get('phrases', []):
            cn = p.get('cn', '')
            if contains_chinese(cn):
                p['cn_source'] = cn
                p['cn'] = cache.get(cn, cn)
                
        for s in w.get('synos', []):
            if s.get('pos') and contains_chinese(s['pos']):
                s['pos'] = translate_pos(s['pos'])
            cn = s.get('cn', '')
            if contains_chinese(cn):
                s['cn_source'] = cn
                s['cn'] = cache.get(cn, cn)
                
        rel_words = w.get('relWords', {})
        if isinstance(rel_words, dict):
            for r in rel_words.get('rels', []):
                if r.get('pos') and contains_chinese(r['pos']):
                    r['pos'] = translate_pos(r['pos'])
                for sub_w in r.get('words', []):
                    cn = sub_w.get('cn', '')
                    if contains_chinese(cn):
                        sub_w['cn_source'] = cn
                        sub_w['cn'] = cache.get(cn, cn)
                        
        for e in w.get('etymology', []):
            t_str = e.get('t', '')
            if contains_chinese(t_str):
                e['t_source'] = t_str
                e['t'] = cache.get(t_str, t_str)
            d_str = e.get('d', '')
            if contains_chinese(d_str):
                e['d_source'] = d_str
                e['d'] = cache.get(d_str, d_str)

    tmp_path = file_path + '.tmp'
    with open(tmp_path, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False)
    
    with open(tmp_path, 'r', encoding='utf-8') as f:
        reloaded = json.load(f)
        assert len(reloaded) == len(words), "Word count mismatch during write"
        
    os.replace(tmp_path, file_path)
    return (total_chinese_fields, translated_count, cached_count)

def main():
    args = sys.argv[1:]
    target_files = []
    
    if '--file' in args:
        idx = args.index('--file')
        if idx + 1 < len(args):
            target_files = [args[idx + 1]]
    elif '--priority' in args:
        target_files = PRIORITY_DICTS
    elif '--all' in args:
        target_files = sorted([f for f in os.listdir(DICT_DIR) if f.endswith('.json')])
    else:
        target_files = PRIORITY_DICTS

    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    cache = load_cache()
    print(f"[CACHE] Translation Cache loaded: {len(cache)} existing mappings")
    print(f"[TARGET] Target dictionaries: {len(target_files)}")
    print()

    total_fields = 0
    total_translated = 0
    success_count = 0

    for i, fname in enumerate(target_files, 1):
        fpath = os.path.join(DICT_DIR, fname)
        if not os.path.exists(fpath):
            print(f"⏭️  [{i}/{len(target_files)}] {fname} — file not found, skipping")
            continue
            
        chk = os.path.join(CHECKPOINT_DIR, f"{fname}.done")
        if os.path.exists(chk) and '--force' not in args:
            print(f"⏭️  [{i}/{len(target_files)}] {fname} — already translated (checkpoint exists)")
            continue

        print(f"[BOOK] [{i}/{len(target_files)}] Processing {fname}...")
        t0 = time.time()
        try:
            fields, trans, cached = translate_dictionary_file(fpath, cache)
            t1 = time.time()
            total_fields += fields
            total_translated += trans
            success_count += 1
            
            with open(chk, 'w', encoding='utf-8') as f:
                f.write(f"Done at {time.ctime()}, fields={fields}, trans={trans}, cached={cached}")
                
            print(f"   [OK] Done in {t1-t0:.1f}s: {fields} fields ({trans} new translated, {cached} cached)")
        except Exception as e:
            print(f"   [FAIL] Error processing {fname}: {e}")

    print()
    print("=" * 60)
    print(f"[SUCCESS] Completed {success_count}/{len(target_files)} dictionaries")
    print(f"[SUMMARY] Total Chinese fields processed: {total_fields}")
    print(f"[SAVE] Cache now contains {len(cache)} unique translation pairs")
    print("=" * 60)

if __name__ == '__main__':
    main()
