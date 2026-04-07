---
id: soft-video-q-codec
type: troubleshoot
title: What recording quality are you using?
tags: [video, codec, bitrate]
last_updated: 2026-04-07
sources:
  - key: manual
    name: S5II Owner's Manual
    ref: "[Rec Quality]"
    type: official
node_type: question
question: "Is your recording quality set to a low bitrate or a heavily compressed codec?"
parent: soft-video-root
children: [soft-video-cause-bitrate]
applies_to: video
---

Check `[Video] > [Image Quality] > [Rec Quality]`. Anything below ~100 Mbps Long-GOP H.264 will look noticeably softer than the higher-bitrate options, especially after editing and re-encoding.
