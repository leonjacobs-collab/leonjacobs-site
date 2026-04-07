---
id: dual-native-iso
type: gem
title: Dual Native ISO — Two Sensor Circuits
tags: [low-light, sensor, exposure, video, photo]
last_updated: 2026-04-07
sources:
  - key: manual
    name: S5II Owner's Manual
    ref: "[Dual Native ISO Setting]"
    type: official
  - key: stalman
    name: Tyler Stalman — How I Shoot the Lumix S5II
    type: creator
  - key: bell
    name: Ewen Bell — Lumix S5 Getting Started
    type: creator
menu_path: "[Photo/Video] > [ISO Sensitivity] > [Dual Native ISO Setting]"
use_cases: [low-light, astrophotography, aurora, video, indoor]
applies_to: both
difficulty: intermediate
menu_depth: 4
why_it_matters: "The S5II has two physically distinct base sensitivities — switching between them changes the actual analog circuit, not just digital amplification. Used right, you get cleaner ISO 640 shots than the same number on a single-gain sensor."
conflicts:
  - claim: "Manual presents AUTO as the safe default for general use"
    counter: "Stalman and Bell both recommend forcing HIGH when you know you'll be in low light — the camera engages the clean circuit from the start instead of climbing into it"
    resolution: "Use AUTO for mixed light, force HIGH when you're committed to low-light or astro work"
    source_keys: [manual, stalman, bell]
---

This isn't a "high ISO mode" — it's a hardware feature. The S5II's sensor has two physically distinct base sensitivities: a **LOW** native ISO (base 100) and a **HIGH** native ISO (base 640). Switching between them changes the actual analog circuit, not just digital gain [^manual].

The practical result: shooting at ISO 640 in the HIGH circuit can produce *cleaner* images than shooting at ISO 640 in the LOW circuit, where the signal has been digitally pushed.

**When to use each setting:**

- **AUTO** — let the camera decide. Sensible default for unpredictable mixed lighting.
- **HIGH** — force the high-sensitivity circuit. Lock to ISO 640–51200 (or 320–204800 with Extended ISO). Use for committed low-light, astro, indoor, and any video where you'll be above ISO 640 anyway [^stalman] [^bell].
- **LOW** — force the low-sensitivity circuit. Lock to ISO 100–800 for maximum dynamic range in bright daylight.

> **Sources disagree on the default behaviour.** The manual presents AUTO as the safe default [^manual], but Stalman and Bell both recommend forcing HIGH when you *know* you're in low light — getting on the clean circuit from the start beats climbing into it [^stalman] [^bell]. For this guide, we recommend AUTO for mixed conditions and HIGH for committed low-light work.

When you're recording V-Log or have `[SS/Gain Operation]` set to `[SEC/dB]`, the menu renames this to **Dual Native Gain Setting**, where 0dB corresponds to ISO 100 (LOW) or ISO 640 (HIGH) [^manual].
