---
id: astro-milky-way
type: scene
title: Astrophotography — Milky Way
tags: [astro, night, low-light, photo, long-exposure]
last_updated: 2026-04-07
sources:
  - key: manual
    name: S5II Owner's Manual
    type: official
  - key: bell
    name: Ewen Bell — Lumix S5 Getting Started
    type: creator
  - key: stalman
    name: Tyler Stalman — How I Shoot the Lumix S5II
    type: creator
scene_category: astro
difficulty: advanced
applies_to: photo
summary: "Manual mode, Dual Native ISO HIGH, Starlight AF or focus peaking, 14–24mm at f/1.4–f/2.8, 15–25 second exposures."
exposure:
  iso_min: 1600
  iso_max: 6400
  shutter_min: "15s"
  shutter_max: "30s"
  aperture_pref: wide
autofocus:
  focus_mode: AFS
  af_area: "1-area (use Starlight AF if available)"
  detection: "off"
stabilization: "OFF (tripod work)"
white_balance: "Manual — 3800K to 4200K typical"
recommended_lens_categories: [ultra-wide, fast-prime]
warnings:
  - "Starlight AF doesn't work at the frame edges — keep your target star in the central area, then recompose"
  - "Focus Peaking does not work while Live View Boost is active — toggle Live View Boost OFF for critical focus, then back ON for composition"
  - "Long Exposure NR doubles your wait time (a 30s exposure becomes 60s total) — worth it for dark sky work, off for star trail composites"
custom_mode_recipe: "C3 — Astro"
conflicts: []
---

## Gear & lens

A tripod is non-negotiable. A remote shutter release (DMW-RS2) is strongly recommended for bulb work — failing that, use the **2-second self-timer**.

The wider and faster, the better. Bell rates the **Sigma 14mm f/1.4 DG DN Art** as one of the best astro lenses available [^bell]. The Lumix 16-35mm f/4 at 16mm works too — you'll just need longer exposures or higher ISO to compensate for the slower aperture.

## Mode & exposure

Mode dial → **M (Manual)**. Astrophotography is full manual territory.

- **Shutter type:** Mechanical or Electronic Front Curtain. Beyond 60 seconds, use **B (Bulb)**.
- **Long Exposure NR:** ON. Doubles your wait time but the noise reduction is worth it for dark sky stills [^manual].
- **Dual Native ISO:** Set to **HIGH**. This forces the clean high-sensitivity circuit with a base of ISO 640. Push to **ISO 3200–6400** depending on sky brightness. Stalman confirms the dual-gain sensor cleans up noticeably at ISO 4000 [^stalman].

For a 14mm lens on full frame, your maximum exposure before stars trail is around 25–35 seconds (500 Rule). At 24mm, 15–20 seconds.

## Autofocus — Starlight AF

The S5II can autofocus on individual stars. Set the camera to **AFS** and point it at a bright star or planet *away from the edges of the frame*. Half-press the shutter. The camera first activates **Low Illumination AF** (a `LOW` icon), then if it detects stars, switches to **Starlight AF** (a `STAR` icon) and locks onto the specific star [^manual].

**Limitation:** Starlight AF doesn't work at the frame edges. Aim at a star in the central portion, then recompose if needed.

If Starlight AF isn't cooperating (thin cloud, bright moon), switch to **Manual Focus**:

- **Focus Peaking:** Bell's tip — when peaking colour shifts so stars "twinkle blue instead of white," that colour shift is your confirmation of critical focus [^bell].
- **MF Assist:** Press in the joystick to punch in and check focus on a bright star at high magnification.

**Caveat:** Focus Peaking does not work while Live View Boost is active. Switch Live View Boost off for critical focus, then back on for composition [^manual].

## Display setup

- **Night Mode:** ON. Shifts the monitor and viewfinder to a red display, preserving dark-adapted vision. Each display can be set independently [^manual].
- **Live View Boost:** MODE2 (maximum visibility). Amplifies the live view so you can compose in near-total darkness. Restrict to M mode only.

## Image quality

Shoot **RAW**. Always. The 14-bit files give you the dynamic range to recover shadows and manage noise in post.

## In the field workflow

1. Set up your tripod. Frame your composition using **Live View Boost MODE2**.
2. Turn off Live View Boost. Switch to **MF**. Focus on a bright star using focus peaking and MF Assist magnification (or try Starlight AF in AFS).
3. Once focused, **do not touch the focus ring**. Use the lens AF/MF switch to prevent accidental adjustment.
4. Set exposure: start with **14mm, f/1.4 (or f/2.8), 20s, ISO 3200**. Review. Adjust ISO up or down.
5. Use the 2-second self-timer or remote shutter to eliminate vibration.
6. Check each frame using **Blinking Highlights** to make sure you haven't clipped anything.
