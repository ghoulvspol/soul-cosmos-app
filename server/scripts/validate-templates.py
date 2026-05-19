#!/usr/bin/env python3
"""Validate template JSON files for word count, structure, and JSON validity."""
import json
import sys
import os

def count_words(text):
    return len(text.split()) if text else 0

def validate_profile(template, idx):
    errors = []
    if 'id' not in template:
        errors.append(f"[{idx}] missing 'id'")
    if 'fingerprint' not in template:
        errors.append(f"[{idx}] missing 'fingerprint'")
    if 'en' not in template:
        errors.append(f"[{idx}] missing 'en'")
        return errors

    en = template['en']
    fields = ['whoYouAre', 'howYouLove', 'whereYouThrive', 'yourShadows', 'yourSeason', 'theFullPicture']
    for field in fields:
        if field not in en:
            errors.append(f"[{idx}] missing en.{field}")
        else:
            wc = count_words(en[field])
            if wc < 80:
                errors.append(f"[{idx}] en.{field} only {wc} words (need ≥100)")
    return errors

def validate_daily(template, idx):
    errors = []
    if 'id' not in template:
        errors.append(f"[{idx}] missing 'id'")
    if 'tags' not in template:
        errors.append(f"[{idx}] missing 'tags'")
    if 'en' not in template:
        errors.append(f"[{idx}] missing 'en'")
        return errors

    en = template['en']
    for field in ['theme', 'tip']:
        if field not in en:
            errors.append(f"[{idx}] missing en.{field}")
        else:
            wc = count_words(en[field])
            min_words = 50 if field == 'theme' else 25
            if wc < min_words:
                errors.append(f"[{idx}] en.{field} only {wc} words (need ≥{min_words})")
    return errors

def validate_weekly(template, idx):
    errors = []
    if 'id' not in template:
        errors.append(f"[{idx}] missing 'id'")
    if 'en' not in template:
        errors.append(f"[{idx}] missing 'en'")
        return errors

    en = template['en']
    for field in ['theme', 'highlight', 'advice']:
        if field not in en:
            errors.append(f"[{idx}] missing en.{field}")
        else:
            wc = count_words(en[field])
            min_words = 40 if field in ['theme', 'advice'] else 25
            if wc < min_words:
                errors.append(f"[{idx}] en.{field} only {wc} words (need ≥{min_words})")
    return errors

def validate_monthly(template, idx):
    errors = []
    if 'id' not in template:
        errors.append(f"[{idx}] missing 'id'")
    if 'en' not in template:
        errors.append(f"[{idx}] missing 'en'")
        return errors

    en = template['en']
    for field in ['theme', 'focus', 'shadow']:
        if field not in en:
            errors.append(f"[{idx}] missing en.{field}")
        else:
            wc = count_words(en[field])
            min_words = 40 if field == 'shadow' else 45
            if wc < min_words:
                errors.append(f"[{idx}] en.{field} only {wc} words (need ≥{min_words})")
    return errors

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate-templates.py <file.json> [type]")
        print("  type: profile | daily | weekly | monthly (auto-detected from filename)")
        sys.exit(1)

    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        sys.exit(1)

    # Auto-detect type from filename
    basename = os.path.basename(filepath).lower()
    if len(sys.argv) > 2:
        template_type = sys.argv[2]
    elif 'daily' in basename:
        template_type = 'daily'
    elif 'weekly' in basename:
        template_type = 'weekly'
    elif 'monthly' in basename:
        template_type = 'monthly'
    else:
        template_type = 'profile'

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        sys.exit(1)

    if not isinstance(data, list):
        print("Error: root must be a JSON array")
        sys.exit(1)

    validators = {
        'profile': validate_profile,
        'daily': validate_daily,
        'weekly': validate_weekly,
        'monthly': validate_monthly,
    }
    validator = validators[template_type]

    all_errors = []
    for i, template in enumerate(data):
        errors = validator(template, i)
        all_errors.extend(errors)

    # Stats
    print(f"File: {filepath}")
    print(f"Type: {template_type}")
    print(f"Total templates: {len(data)}")

    if template_type == 'profile':
        word_counts = []
        for t in data:
            en = t.get('en', {})
            for field in ['whoYouAre', 'howYouLove', 'whereYouThrive', 'yourShadows', 'yourSeason', 'theFullPicture']:
                wc = count_words(en.get(field, ''))
                word_counts.append(wc)
        if word_counts:
            avg = sum(word_counts) / len(word_counts)
            mn = min(word_counts)
            mx = max(word_counts)
            print(f"Word count: avg={avg:.0f}, min={mn}, max={mx}")
            under_100 = sum(1 for w in word_counts if w < 100)
            print(f"Fields under 100 words: {under_100}/{len(word_counts)} ({under_100/len(word_counts)*100:.1f}%)")

    if all_errors:
        print(f"\nErrors ({len(all_errors)}):")
        for e in all_errors[:20]:
            print(f"  {e}")
        if len(all_errors) > 20:
            print(f"  ... and {len(all_errors) - 20} more")
        sys.exit(1)
    else:
        print("\n✅ All templates valid!")

if __name__ == '__main__':
    main()
