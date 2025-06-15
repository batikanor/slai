# 🎶 Smart Track Matcher & Beat Sync

This tool lets you pick one track, and it automatically finds a compatible second track from a pool — matching **sound**, **tempo**, and **key** — and outputs a seamless two-track mix.

Powered by AI-inspired audio analysis using MFCC, chroma, and beat tracking.

---

## 🚀 How It Works

### 1. 🔊 From Audio to Sound Fingerprints

When we hear music, we notice things like:
- Texture (e.g. warm vs. sharp)
- Rhythm (BPM)
- Musical key (e.g. C major)

To make a computer understand this, we extract **audio features** from each track:

#### 🎤 MFCC (Mel-Frequency Cepstral Coefficients)
- Captures **timbral fingerprint** (how the sound *feels* — dark, bright, mellow, etc.)
- Inspired by **how humans hear** sound
- Extracted from the **spectrum** of short audio frames

We average the MFCCs across time to get a compact vector (like a sound signature).

#### 🎼 Chroma Features
- Capture **harmonic content** — the musical notes being played
- Used to estimate **key compatibility**
- Helps avoid clashing melodies or chords

#### 🥁 Beat Tracking
- Detects the **tempo (BPM)** and **beat positions**
- Used to:
  - Match tempo via **time-stretching**
  - Align downbeats via **phase sync**

---

### 2. 🧠 Track Matching Logic

1. **Input**: A reference track A
2. The system scans a folder of candidate tracks (B, C, D…)
3. For each candidate:
   - Compare MFCCs with A (timbre similarity)
   - Compare chroma vectors (harmonic compatibility)
   - Compute tempo ratio (must be within 15% warp limit)
4. Score and rank each candidate
5. Select the **best match** for mixing

---

### 3. 🔁 Sync and Export

- The chosen track B is **time-stretched** to match the tempo of track A
- Then, the **first beat** is aligned so rhythms match
- Finally, A and B are **mixed 50/50** and exported as `synced_mix.wav`

---

## 📁 How to Use

1. Put your reference file as:  
   ```
   ./pool/track_A.wav
   ```

2. Put other candidates (B, C, D…) in the same `pool/` folder.

3. Run the script:
   ```bash
   python find_and_sync.py
   ```

4. Get your smart-matched mix:
   ```
   synced_mix.wav
   ```

---

## 🧠 Technical Highlights

| Feature         | Description                                  |
|----------------|----------------------------------------------|
| MFCC            | Timbral fingerprint for sound similarity     |
| Chroma          | Harmonic profile for key matching            |
| Tempo + Beats   | Intelligent alignment of rhythm and timing   |
| Cosine Distance | Used for comparing feature vectors           |
| Time-stretching | Tempo adjustment without changing pitch      |
| Phase Sync      | Aligns downbeats for seamless transitions    |

---

## 🔧 Requirements

```bash
pip install librosa soundfile numpy scipy
```

---

## ✨ Inspired By

- Music Information Retrieval (MIR)
- DJ tools like Ableton Live and Rekordbox
- Audio fingerprinting and recommendation systems
