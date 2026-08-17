import json
import sys
from collections import Counter

def validate_chunk(path):
    data = json.load(open(path, encoding='utf-8'))
    words = []
    for i, q in enumerate(data):
        assert isinstance(q.get('word'), str) and q['word'], f"{path} #{i}: missing word"
        assert isinstance(q.get('phonetic'), str) and q['phonetic'], f"{path} #{i}: missing phonetic"
        assert q.get('difficulty') in ('basic', 'intermediate', 'advanced'), f"{path} #{i}: bad difficulty"
        choices = q.get('choices')
        assert isinstance(choices, list) and len(choices) == 4, f"{path} #{i}: need 4 choices"
        correct = sum(1 for c in choices if c.get('isCorrect') is True)
        assert correct == 1, f"{path} #{i}: need exactly 1 correct, got {correct}"
        for c in choices:
            assert isinstance(c.get('text'), str) and c['text'] and 'isCorrect' in c, f"{path} #{i}: bad choice {c}"
        words.append(q['word'].lower())
    dup = {w: c for w, c in Counter(words).items() if c > 1}
    assert not dup, f"{path}: duplicate words in chunk {dup}"
    print(f"OK {path}: {len(data)} questions, words unique")

if __name__ == '__main__':
    validate_chunk(sys.argv[1])