
# train_bert_mfcc.py
# ---------------------------------------------------------
# Fine‑tunes a tiny transformer (BERT‑style) to predict
# whether two MFCC embeddings represent compatible tracks.
#
# Dataset format (npz):
#   emb_a : (N, 13)
#   emb_b : (N, 13)
#   label : (N,)  float32  (1.0 = compatible, 0.0 = not)
#
# Usage:
#   python train_bert_mfcc.py --data fake_mfcc_dataset.npz
#
# Requirements:
#   pip install torch numpy
# ---------------------------------------------------------

import argparse
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

class PairDataset(Dataset):
    def __init__(self, npz_path):
        data = np.load(npz_path)
        self.a = torch.tensor(data['emb_a'], dtype=torch.float32)
        self.b = torch.tensor(data['emb_b'], dtype=torch.float32)
        self.y = torch.tensor(data['label'], dtype=torch.float32)
    def __len__(self):
        return len(self.y)
    def __getitem__(self, idx):
        return self.a[idx], self.b[idx], self.y[idx]

class TinyBERTCompat(nn.Module):
    """A minimal transformer encoder over sequence length=2 tokens."""
    def __init__(self, in_dim=13, d_model=64, nhead=4, num_layers=2):
        super().__init__()
        self.proj = nn.Linear(in_dim, d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead, dim_feedforward=128,
            activation='gelu', batch_first=True)
        self.enc = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.cls = nn.Linear(d_model, 1)
    def forward(self, emb_a, emb_b):
        # emb_a/b: (batch, in_dim) -> sequence (batch, 2, in_dim)
        seq = torch.stack([emb_a, emb_b], dim=1)
        x = self.proj(seq)  # (batch, 2, d_model)
        x = self.enc(x)     # transformer
        # Use [CLS]-style token: first position
        out = x[:, 0, :]    
        logit = self.cls(out).squeeze(-1)
        return logit

def train(args):
    ds = PairDataset(args.data)
    loader = DataLoader(ds, batch_size=32, shuffle=True)
    model = TinyBERTCompat()
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3)
    criterion = nn.BCEWithLogitsLoss()

    model.train()
    for epoch in range(args.epochs):
        total_loss = 0
        for emb_a, emb_b, y in loader:
            opt.zero_grad()
            logit = model(emb_a, emb_b)
            loss = criterion(logit, y)
            loss.backward()
            opt.step()
            total_loss += loss.item() * len(y)
        avg = total_loss / len(ds)
        print(f"Epoch {epoch+1}/{args.epochs}  loss={avg:.4f}")
    torch.save(model.state_dict(), args.out)
    print(f"Model saved to {args.out}")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument('--data', default='fake_mfcc_dataset.npz')
    p.add_argument('--epochs', type=int, default=10)
    p.add_argument('--out', default='bert_mfcc.pt')
    args = p.parse_args()
    train(args)
