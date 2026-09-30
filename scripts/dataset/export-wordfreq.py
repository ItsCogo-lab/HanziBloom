"""Exports wordfreq's Chinese word list as TSV, the most frequent first.

Each line is "word<TAB>frequency", the frequency being the share of all
words (0.0617 for 的). Run by fetch-sources.sh with the pinned wordfreq
version; the result is read by sources/wordfreq.ts.
"""
from wordfreq import get_frequency_dict

frequencies = get_frequency_dict("zh", wordlist="best")
for word, frequency in sorted(frequencies.items(), key=lambda entry: (-entry[1], entry[0])):
    print(f"{word}\t{frequency:.6g}")
