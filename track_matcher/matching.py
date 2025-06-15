"""
find_and_sync.py
--------------------------------------------
Given a pool folder and a reference track A,
pick the most compatible track B and output
a beat-synced mash-up of A+B.

Install first:
    pip install librosa soundfile numpy scipy
"""

import os, glob, librosa, numpy as np, soundfile as sf
from scipy.spatial.distance import cosine

# ---------- USER SETTINGS ---------------------------------------------------
POOL_DIR   = "./pool"          
TRACK_A    = "./pool/track_A.wav"
OUT_MIX    = "synced_mix.wav"

N_MFCC     = 13
N_CHROMA   = 12
MAX_STRETCH = 0.15             # ±15 % tempo warp limit
TOP_N      = 5                 # show best N candidates
WEIGHTS    = dict(             # weights for composite score
    timbre=0.5, harmony=0.3, tempo=0.2
)

# ---------- HELPER FUNCTIONS ------------------------------------------------
def load_audio(path):
    y, sr = librosa.load(path, sr=None, mono=True)
    return y, sr

def mfcc_mean(y, sr):
    return librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC).mean(axis=1)

def chroma_mean(y, sr):
    return librosa.feature.chroma_cqt(y=y, sr=sr, n_chroma=N_CHROMA).mean(axis=1)

def bpm_and_beats(y, sr):
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    beat_times = librosa.frames_to_time(beats, sr=sr)
    return tempo, beat_times

def cosine_sim(a, b):
    return 1 - cosine(a, b)             # 1 = identical

def time_stretch(y, ratio):             # warp without pitch-shift
    return librosa.effects.time_stretch(y, rate=ratio)

def align_phase(y, beats_src, beats_ref, sr):
    if not len(beats_src) or not len(beats_ref):
        return y
    offset = beats_src[0] - beats_ref[0]
    offset_samples = int(offset * sr)
    return np.pad(y, (max(0, offset_samples), 0)) if offset_samples > 0 else y[-offset_samples:]

# ---------- PREP TRACK A ----------------------------------------------------
yA, srA = load_audio(TRACK_A)
mfccA   = mfcc_mean(yA, srA)
chromA  = chroma_mean(yA, srA)
tempoA, beatsA = bpm_and_beats(yA, srA)

print(f"Reference track A: {os.path.basename(TRACK_A)}  |  BPM {tempoA:.1f}")

# ---------- SCAN POOL FOR BEST B -------------------------------------------
candidates = glob.glob(os.path.join(POOL_DIR, "*"))
candidates = [p for p in candidates if p != TRACK_A]

best = None
scores = []

for path in candidates:
    try:
        y, sr = load_audio(path)
        mfcc  = mfcc_mean(y, sr)
        chrom = chroma_mean(y, sr)
        tempo, _ = bpm_and_beats(y, sr)

        # ---- compatibility metrics
        timbre_score   = cosine_sim(mfccA, mfcc)          # higher = better
        harmony_score  = cosine_sim(chromA, chrom)        # higher = better
        tempo_ratio    = abs(1 - tempo / tempoA)          # smaller = better

        if tempo_ratio > MAX_STRETCH:                     # warp too large
            continue

        # ---- composite score (higher = better overall)
        composite = (WEIGHTS["timbre"]  * timbre_score
                   + WEIGHTS["harmony"] * harmony_score
                   + WEIGHTS["tempo"]   * (1 - tempo_ratio))

        scores.append((composite, path, tempo))
    except Exception as e:
        print(f"Skip {path}: {e}")

if not scores:
    raise RuntimeError("No compatible track found within stretch limits.")

# sort best-to-worst
scores.sort(key=lambda x: x[0], reverse=True)

print("\nTop matches:")
for rank, (score, path, tempo) in enumerate(scores[:TOP_N], 1):
    print(f"{rank:>2}. {os.path.basename(path):30}  score={score:.3f}  BPM={tempo:.1f}")

# ---------- PICK BEST B -----------------------------------------------------
best_score, TRACK_B, tempoB = scores[0]
print(f"\nChosen track B → {os.path.basename(TRACK_B)}  (score {best_score:.3f})")

# ---------- WARP + PHASE-ALIGN + MIX ---------------------------------------
yB, _ = load_audio(TRACK_B)
stretch_ratio = tempoB / tempoA
yB = time_stretch(yB, stretch_ratio)

_, beatsB = bpm_and_beats(yB, srA)
yB = align_phase(yB, beatsB, beatsA, srA)

# pad to equal length
mix_len = max(len(yA), len(yB))
yA = np.pad(yA, (0, mix_len - len(yA)))
yB = np.pad(yB, (0, mix_len - len(yB)))

mix = 0.5 * yA + 0.5 * yB
mix /= np.abs(mix).max()  # normalize

sf.write(OUT_MIX, mix, srA)
print(f"\n✅  Exported synced mix → {OUT_MIX}")
