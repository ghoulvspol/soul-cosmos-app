#!/usr/bin/env python3
"""List all possible transit fingerprint combinations for template generation."""
import json
import itertools

# Five Element interactions (day element + user birth element)
ELEMENTS = ['木', '火', '土', '金', '水']
INTERACTIONS = [f"{a}+{b}" for a in ELEMENTS for b in ELEMENTS]

# Shishen (energy types)
SHISHEN = ['wealth', 'career', 'creativity', 'challenge', 'learning', 'insight', 'expression', 'self', 'competition']

# Moon house themes
MOON_HOUSES = ['self', 'money', 'communication', 'home', 'creativity', 'health',
               'relationships', 'transformation', 'adventure', 'career', 'community', 'spirituality']

# Tones
TONES = ['fortunate', 'caution', 'neutral']

# Conflict/harmony
CONFLICT_HARMONY = [(False, True), (True, False), (True, True), (False, False)]

def generate_daily_combos():
    combos = []
    for interaction in INTERACTIONS:
        for shishen in SHISHEN:
            for tone in TONES:
                for has_conflict, has_harmony in CONFLICT_HARMONY:
                    for moon_house in MOON_HOUSES[:3]:  # subset for manageable count
                        combos.append({
                            'interaction': interaction,
                            'shishen': shishen,
                            'tone': tone,
                            'hasConflict': has_conflict,
                            'hasHarmony': has_harmony,
                            'moonHouseTheme': moon_house,
                        })
    return combos

def generate_weekly_combos():
    combos = []
    for shishen in SHISHEN:
        for tone in ['transformative', 'expansive', 'challenging', 'harmonious']:
            for has_conflict in [True, False]:
                for has_harmony in [True, False]:
                    combos.append({
                        'dominantShishen': shishen,
                        'tone': tone,
                        'hasConflict': has_conflict,
                        'hasHarmony': has_harmony,
                    })
    return combos

def generate_monthly_combos():
    combos = []
    for shishen in SHISHEN:
        for tone in ['complex', 'expansive', 'intense']:
            for conflict_level in ['low', 'medium', 'high']:
                combos.append({
                    'dominantShishen': shishen,
                    'tone': tone,
                    'conflictLevel': conflict_level,
                })
    return combos

if __name__ == '__main__':
    daily = generate_daily_combos()
    weekly = generate_weekly_combos()
    monthly = generate_monthly_combos()

    result = {
        'daily': {'count': len(daily), 'sample': daily[:5]},
        'weekly': {'count': len(weekly), 'sample': weekly[:5]},
        'monthly': {'count': len(monthly), 'sample': monthly[:5]},
        'total': len(daily) + len(weekly) + len(monthly),
    }
    print(json.dumps(result, indent=2, ensure_ascii=False))
