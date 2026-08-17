import json
import os
import sys
from collections import Counter

TARGET_PER_LEVEL = 500
CHUNKS_DIR = os.path.join(os.path.dirname(__file__), 'vocab-chunks')

def main():
    data_path = 'src/data/vocabQuestions.json'
    data = json.load(open(data_path, encoding='utf-8'))

    existing_words = {q['word'].lower() for q in data}
    counts = Counter(q['difficulty'] for q in data)
    print(f"Existing: {len(data)} total, {dict(counts)}")

    new_ids = [q['id'] for q in data]
    next_id = max(new_ids) + 1

    chunk_files = sorted(f for f in os.listdir(CHUNKS_DIR) if f.endswith('.json'))
    added_per_level = Counter()
    skipped = {'dup_with_existing': 0, 'over_target': 0}

    for cf in chunk_files:
        chunks = json.load(open(os.path.join(CHUNKS_DIR, cf), encoding='utf-8'))
        for q in chunks:
            level = q['difficulty']
            if counts[level] >= TARGET_PER_LEVEL:
                skipped['over_target'] += 1
                continue
            word = q['word'].lower()
            if word in existing_words:
                skipped['dup_with_existing'] += 1
                continue
            new_q = {
                'id': next_id,
                'word': q['word'],
                'phonetic': q['phonetic'],
                'choices': q['choices'],
                'difficulty': level,
            }
            data.append(new_q)
            existing_words.add(word)
            counts[level] += 1
            next_id += 1

    # final validation
    ids = [q['id'] for q in data]
    assert len(ids) == len(set(ids)), 'duplicate ids!'
    words = [q['word'].lower() for q in data]
    dup = {w: c for w, c in Counter(words).items() if c > 1}
    assert not dup, f'duplicate words: {dup}'
    for q in data:
        assert len(q['choices']) == 4, f"{q['word']}: not 4 choices"
        correct = sum(1 for c in q['choices'] if c.get('isCorrect') is True)
        assert correct == 1, f"{q['word']}: correct count {correct}"

    json.dump(data, open(data_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f"Added: {dict(counts)}")
    print(f"Total: {len(data)}")
    print(f"Skipped: {skipped}")

if __name__ == '__main__':
    main()