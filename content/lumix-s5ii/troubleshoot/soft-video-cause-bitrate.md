---
id: soft-video-cause-bitrate
type: troubleshoot
title: Low bitrate codec is destroying detail
tags: [video, codec, bitrate]
last_updated: 2026-04-07
sources:
  - key: manual
    name: S5II Owner's Manual
    type: official
node_type: cause
cause_summary: "Heavy compression at low bitrates discards fine detail before it ever reaches your edit."
parent: soft-video-q-codec
children: [soft-video-fix-bitrate]
applies_to: video
---

H.264 Long-GOP at low bitrates compresses aggressively between keyframes. Fine detail — hair, fabric texture, foliage — is the first thing the codec throws away. After your editor re-encodes for export, the softness compounds.
