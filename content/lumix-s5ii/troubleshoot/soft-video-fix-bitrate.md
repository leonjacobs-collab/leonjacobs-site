---
id: soft-video-fix-bitrate
type: troubleshoot
title: Move to ALL-Intra or higher-bitrate Long-GOP
tags: [video, codec, bitrate, fix]
last_updated: 2026-04-07
sources:
  - key: manual
    name: S5II Owner's Manual
    ref: "[Rec Quality]"
    type: official
node_type: fix
parent: soft-video-cause-bitrate
children: []
applies_to: video
---

In `[Video] > [Image Quality] > [Rec Quality]`, switch to one of:

- **C4K/4K 10-bit 422 ALL-Intra 400Mbps** — best image quality, large files, needs a fast V90 SD card
- **C4K/4K 10-bit 422 Long-GOP 150Mbps** — much smaller files, still very clean

ALL-Intra encodes every frame independently (like a stack of JPEGs), so there's no inter-frame compression eating fine detail. Long-GOP at 150Mbps is a good middle ground if storage is a concern.

**Card requirement:** ALL-Intra at 400Mbps requires a V90-rated SD card. A slower card will trigger a recording stop.
