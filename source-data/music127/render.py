"""Render 3NU's original piano miniature '광장의 오후' (Afternoon on the Lawn).

Run: python3 render.py OUTPUT.m4a
Requires NumPy and either ffmpeg or Apple's afconvert. No sampled instruments.
The score is in 3/4. Each right-hand event is beat:pitch:length in quarter notes.
"""

import argparse
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

RATE = 32000
BPM = 110
PITCHES = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

# Bass and upper voices are written separately so inversions keep an audible line.
VOICINGS = {
    "D6": ("D3", "A3", "B3", "F#4"),
    "A/C#": ("C#3", "A3", "B3", "E4"),
    "G6/B": ("B2", "G3", "D4", "E4"),
    "Asus": ("A2", "E3", "B3", "D4"),
    "Bm7": ("B2", "F#3", "A3", "D4"),
    "D/A": ("A2", "F#3", "A3", "E4"),
    "Em9": ("E3", "G3", "B3", "F#4"),
    "A6": ("A2", "E3", "F#3", "C#4"),
    "G9": ("G2", "D3", "A3", "B3"),
    "D/F#": ("F#2", "D3", "A3", "E4"),
    "Em7": ("E3", "G3", "B3", "D4"),
    "A7": ("A2", "G3", "B3", "C#4"),
    "F#m7": ("F#2", "C#3", "A3", "E4"),
    "Gm6": ("G2", "D3", "Bb3", "E4"),
    "G/A": ("A2", "G3", "B3", "D4"),
    "D9": ("D3", "F#3", "A3", "E4"),
}

# Left hand figures: (beat, index in the voicing, length, relative velocity).
FIGURES = {
    "wide": [(0, 0, 1.71, .81), (1.03, 2, .73, .65), (2.01, 3, .69, .57)],
    "step": [(0, 0, 1.38, .78), (.98, 1, .95, .65), (2.01, 2, .76, .59)],
    "rest": [(.08, 0, 2.18, .69)],
    "lift": [(0, 0, 1.48, .78), (.54, 1, .72, .53), (1.04, 2, .70, .63), (2.03, 3, .75, .56)],
    "held": [(0, 0, 2.57, .72), (.10, 1, 2.42, .57), (.16, 3, 2.41, .53)],
    "echo": [(0, 0, 1.82, .76), (2.00, 1, .76, .61), (2.06, 2, .77, .53)],
    "turn": [(0, 0, 1.31, .77), (1.01, 2, .65, .63), (1.57, 1, .38, .49), (2.04, 3, .69, .58)],
}

# Five eight-bar phrases and a four-bar coda. A short lower-register answer
# makes room for the melody to return to its original register and opening fourth.
SCORE = [
    ("D6",   "wide", "0.62:A4:0.6 1.55:D5:1.25"),
    ("A/C#", "step", "0.05:C#5:1.35 1.88:A4:0.8"),
    ("G6/B", "lift", "0.12:B4:1.75 2.25:F#4:0.58"),
    ("Asus", "echo", "0.08:E4:2.15"),
    ("Bm7",  "wide", "0.62:F#4:0.70 1.55:A4:1.18"),
    ("D/A",  "step", "0.06:E5:0.89 1.12:D5:1.51"),
    ("Em9",  "lift", "0.17:B4:1.26 1.70:G4:0.61 2.53:A4:0.35"),
    ("A6",   "rest", "0.11:F#4:1.94"),
    ("G9",   "step", "0.30:B4:0.75 1.24:D5:0.60 2.02:F#5:1.10"),
    ("D/F#", "wide", "0.49:E5:1.50 2.28:A4:0.62"),
    ("Em7",  "held", "0.10:G4:0.86 1.22:B4:1.56"),
    ("A7",   "echo", "0.02:C#5:2.24"),
    ("D6",   "lift", "0.51:A4:0.59 1.43:D5:0.60 2.20:E5:0.73"),
    ("F#m7", "wide", "0.06:F#5:1.57 1.95:C#5:0.83"),
    ("G9",   "step", "0.18:B4:1.32 1.85:G4:1.04"),
    ("G/A",  "rest", "0.08:A4:1.83"),
    ("Bm7",  "held", "0.31:D5:0.70 1.26:F#5:1.28"),
    ("F#m7", "lift", "0.06:C#5:1.69 2.01:A4:0.78"),
    ("G9",   "wide", "0.05:B4:0.69 0.95:D5:1.02 2.12:A4:0.77"),
    ("D/F#", "rest", "0.13:F#4:2.31"),
    ("Em7",  "lift", "0.54:G4:0.81 1.63:B4:0.92"),
    ("Gm6",  "held", "0.05:Bb4:1.84 2.27:G4:0.60"),
    ("D/A",  "wide", "0.03:A4:1.13 1.48:F#4:0.74"),
    ("A7",   "echo", "0.40:E4:1.67"),
    ("Em7",  "step", "0.04:E4:0.83 1.20:G4:0.62 2.15:B4:0.61"),
    ("D/F#", "echo", "0.06:A4:1.55 2.20:F#4:0.62"),
    ("G9",   "turn", "0.48:G4:0.51 1.04:B4:1.38"),
    ("A6",   "rest", "0.08:C#5:1.14 1.74:A4:0.92"),
    ("Bm7",  "wide", "0.06:F#4:1.39 1.96:D4:0.74"),
    ("G6/B", "turn", "0.04:E4:0.87 1.14:G4:0.62 2.09:A4:0.63"),
    ("Em9",  "lift", "0.10:B4:1.46 1.94:F#4:0.77"),
    ("A7",   "rest", "0.04:E4:1.77 2.53:G4:0.36"),
    ("D6",   "wide", "0.62:A4:0.60 1.55:D5:1.25"),
    ("A/C#", "lift", "0.05:C#5:0.97 1.28:E5:0.52 2.00:A4:0.79"),
    ("G6/B", "wide", "0.12:B4:1.70 2.14:D5:0.64"),
    ("Asus", "echo", "0.06:E5:1.89"),
    ("G9",   "step", "0.39:D5:0.87 1.58:B4:0.80"),
    ("D/F#", "wide", "0.12:A4:1.12 1.67:F#4:0.95"),
    ("Em7",  "lift", "0.18:G4:1.22 1.74:B4:0.95"),
    ("A6",   "rest", "0.07:A4:1.68"),
    ("D9",   "echo", "0.67:F#4:0.71 1.69:A4:0.91"),
    ("G6/B", "held", "0.06:B4:1.62"),
    ("G/A",  "rest", "0.52:A4:0.91 1.75:E4:0.86"),
    ("D6",   "rest", "0.10:D4:2.43"),
]

# A few answering notes on a softer, high glass tone. The gaps are intentional.
GLASS = [
    (3, 2.10, "B5"), (7, 1.48, "A5"), (8, 2.67, "D6"),
    (13, 2.57, "A5"), (15, 1.80, "E5"), (19, 1.62, "A5"),
    (21, 2.19, "D5"), (23, 2.09, "E5"), (25, 2.45, "D5"),
    (28, 2.42, "F#5"), (34, 1.07, "B5"), (35, 2.36, "F#5"),
    (38, 2.58, "G5"), (41, 2.20, "D5"),
]


def frequency(name):
    letter, octave = name[0], int(name[-1])
    step = PITCHES[letter] + name.count("#") - name.count("b")
    return 440 * 2 ** ((12 * (octave + 1) + step - 69) / 12)


def key_sound(freq, seconds, velocity, rng):
    t = np.arange(round((seconds + 1.80) * RATE)) / RATE
    held = np.minimum(t, seconds)
    release = np.maximum(0, t - seconds)
    tone = np.zeros_like(t)
    hammer = [1.0, .57, .33, .15, .115, .071, .040, .022]
    detune = .00040 + freq * .00000020
    for partial, weight in enumerate(hammer, 1):
        stretched = partial * freq * (1 + .000034 * partial * partial)
        phase = 2 * np.pi * stretched * t
        decay = .44 + .28 * partial + .30 * freq / 523
        env = (.48 * np.exp(-held * decay * 3.2) + .52 * np.exp(-held * decay * .75))
        env *= np.exp(-release * (4.6 + .28 * partial))
        strike = 1 - np.exp(-t * (145 + 40 * partial))
        gain = weight * velocity ** (.75 + .21 * partial)
        tone += gain * strike * env * (
            .67 * np.sin(phase) + .33 * np.sin(phase * (1 + detune))
        )
    # A damped hammer has a brief, soft noise component before the string speaks.
    length = int(.042 * RATE)
    knock = np.convolve(rng.standard_normal(length), np.ones(11) / 11, mode="same")
    tone[:length] += .034 * velocity * knock * (1 - np.exp(-t[:length] * 500)) * np.exp(-t[:length] * 128)
    return tone * .32


def reed_sound(freq, seconds, voice):
    t = np.arange(round((seconds + 1.70) * RATE)) / RATE
    phase = 2 * np.pi * freq * t
    bend = .054 * np.sin(2 * np.pi * (.42 + .037 * voice) * t + voice)
    env = (1 - np.exp(-t / .68)) ** 1.5
    env *= np.exp(-np.maximum(0, t - seconds) * 2.9)
    slow = .93 + .07 * np.cos(2 * np.pi * .21 * t - voice)
    return env * slow * (.54 * np.sin(phase + bend) + .37 * np.sin(phase * .99931 - bend)
                         + .12 * np.sin(2 * phase + .12) + .073 * np.sin(3 * phase + bend))


def glass_sound(freq):
    t = np.arange(round(3.5 * RATE)) / RATE
    phase = 2 * np.pi * freq * t
    return (1 - np.exp(-t * 45)) * (
        np.sin(phase) * np.exp(-t * 1.48)
        + .15 * np.sin(phase * 3.988) * np.exp(-t * 2.80)
        + .061 * np.sin(phase * 6.72) * np.exp(-t * 4.6)
    )


def add_wrap(track, at, samples):
    start = int(round(at * RATE)) % len(track)
    first = min(len(track) - start, len(samples))
    track[start:start + first] += samples[:first]
    if first < len(samples):
        track[:len(samples) - first] += samples[first:]


def place(track, at, samples, level, pan):
    angle = (.5 + pan * .5) * np.pi / 2
    for channel, gain in enumerate((np.cos(angle), np.sin(angle))):
        add_wrap(track[:, channel], at, samples * level * gain)


def room(track, rng):
    # Circular tails connect the last chord to the first even across the loop.
    mono = track.mean(axis=1)
    t = np.arange(round(1.86 * RATE)) / RATE
    block = 32768
    fft_len = 1 << (block + len(t) - 2).bit_length()
    for channel in range(2):
        cloud = np.convolve(rng.standard_normal(len(t)), np.hanning(11) / 5, mode="same")
        onset = np.maximum(0, t - .023)
        impulse = cloud * (1 - np.exp(-onset * 19)) * np.exp(-onset * 3.32)
        impulse *= .245 / np.linalg.norm(impulse)
        taps = [(.024, .085), (.041, .060), (.068, .042), (.115, .029)]
        for delay, amount in taps:
            impulse[round((delay + channel * .008) * RATE)] += amount
        response = np.fft.rfft(impulse, fft_len)
        for start in range(0, len(mono), block):
            piece = mono[start:start + block]
            wet = np.fft.irfft(np.fft.rfft(piece, fft_len) * response, fft_len)
            add_wrap(track[:, channel], start / RATE, wet[:len(piece) + len(t) - 1])


def compose():
    rng = np.random.default_rng(12723)
    # Gentle rubato within each phrase; its average remains exactly 110 BPM.
    bar_scale = np.array([1, .99, 1, 1.015, 1, .985, .995, 1.015] * 5
                         + [.995, .995, .990, 1.02])
    lengths = 3 * 60 / BPM * bar_scale
    starts = np.concatenate(([0], np.cumsum(lengths)))
    track = np.zeros((round(starts[-1] * RATE), 2))
    for bar, (chord, figure, melody) in enumerate(SCORE):
        beat = lengths[bar] / 3
        start = starts[bar]
        voices = VOICINGS[chord]
        swell = np.interp(bar, [0, 7, 13, 16, 19, 23, 24, 30, 34, 39, 43],
                          [.78, .79, .91, .84, .90, .76, .78, .86, .87, .76, .68])
        for count, (at, key, hold, v) in enumerate(FIGURES[figure]):
            freq = frequency(voices[key])
            onset = start + at * beat + rng.uniform(-.011, .012)
            sound = key_sound(freq, hold * beat, v * swell, rng)
            place(track, onset, sound, 1.08 if key == 0 else .81, -.12 - count * .09)
        for count, token in enumerate(melody.split()):
            at, note, hold = token.split(":")
            freq = frequency(note)
            strength = swell * rng.uniform(.94, 1.04) * (1.00 if count == 0 else .94)
            onset = start + float(at) * beat + rng.uniform(-.011, .013)
            place(track, onset, key_sound(freq, float(hold) * beat, strength, rng), 1.04,
                  .12 + .10 * np.log2(freq / 440))
        # Soft sustained inner voices appear between the exposed piano phrases.
        strength = np.interp(bar, [0, 4, 9, 16, 20, 24, 31, 32, 37, 43],
                             [.20, .32, .72, .60, .88, .41, .65, .53, .70, .21])
        for v, note in enumerate(voices[1:]):
            if bar % 8 in (3, 7) and v == 2:
                continue
            onset = start + (.08 + .072 * v) * beat
            place(track, onset, reed_sound(frequency(note), (2.69 - .10 * v) * beat, v),
                  .033 * strength, (-.41, .33, -.15)[v])
    for bar, at, note in GLASS:
        place(track, starts[bar] + at * lengths[bar] / 3, glass_sound(frequency(note)), .045, .37)
    room(track, rng)
    track -= np.mean(track, axis=0)
    peak = np.max(np.abs(track))
    rms = np.sqrt(np.mean(track * track))
    track *= min(.073 / rms, .73 / peak)
    return np.rint(track * 32767).astype("<i2")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="AAC-LC .m4a output file")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory() as work:
        wav = Path(work) / "lawn.wav"
        with wave.open(str(wav), "wb") as out:
            out.setparams((2, 2, RATE, 0, "NONE", "not compressed"))
            out.writeframes(compose().tobytes())
        if shutil.which("afconvert"):
            # The MP4 edit list trims encoder priming in both WebKit and Chrome.
            cmd = ["afconvert", "-f", "mp4f", "-d", "aac", "-b", "72000", "-q", "127", str(wav), str(args.output)]
        else:
            cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-c:a", "aac", "-b:a", "72k", "-movflags", "+faststart", str(args.output)]
        subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()
