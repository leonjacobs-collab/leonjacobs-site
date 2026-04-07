---
id: portrait-natural-light
type: scene
title: Portrait — Natural Light
tags: [portrait, people, natural-light, photo]
last_updated: 2026-04-07
sources:
  - key: manual
    name: S5II Owner's Manual
    type: official
  - key: scaife
    name: Gary Scaife — Lumix S5II Autofocus Tips
    type: creator
  - key: stalman
    name: Tyler Stalman — How I Shoot the Lumix S5II
    type: creator
  - key: bell
    name: Ewen Bell — Lumix S5 Getting Started
    type: creator
scene_category: portrait
difficulty: beginner
applies_to: photo
summary: "Aperture priority, wide open, eye AF on humans — let the camera handle the exposure triangle and focus on composition and connection."
exposure:
  iso_min: 100
  iso_max: 6400
  shutter_min: "1/200"
  aperture_pref: wide
autofocus:
  focus_mode: AFC
  af_area: "Full Area AF"
  detection: human
stabilization: "Standard hybrid IBIS — leave on"
white_balance: "AWB or fixed daylight depending on conditions"
recommended_lens_categories: [fast-prime, standard]
warnings:
  - "With multiple faces in frame the detection system flickers — switch to One Area Plus and turn detection OFF, then drag the box to your subject"
  - "For backlit subjects, use 1 Shot Spot Metering (Fn button) to meter off the face without leaving multi metering"
custom_mode_recipe: "C1 — Portraits"
conflicts:
  - claim: "Default advice is to leave human detection ON for all portrait work"
    counter: "Scaife found that with multiple faces in frame, the detection flickers between subjects — turning detection OFF and using One Area Plus is dramatically more reliable"
    resolution: "Detection ON for single subjects, OFF for groups — switch via Fn button"
    source_keys: [manual, scaife]
---

## The setup

Set the mode dial to **A (Aperture Priority)**. Portraits are an aperture-first discipline — you choose how much of the world falls away behind your subject, and the camera handles the rest. With a fast prime you'll live between f/1.8 and f/2.8 most of the time.

Turn on **Auto ISO** with a minimum shutter speed of **1/200s** or faster. People shift weight, blink, laugh — you want to freeze that. Bell recommends remapping the video record button to give direct access to minimum shutter speed selection so you can adjust on the fly without diving into menus [^bell].

## Autofocus

- Focus mode lever → **C (Continuous AF)**
- AF Detection → **ON**
- Detecting Subject → **HUMAN**, Target Parts → **Eye/Face/Body**
- AF Mode → **Full Area AF** for a single subject

The camera will find the face and lock the nearest eye. Half-press to confirm the green eye-detect cross is on the correct eye, then commit. Stalman shoots in short bursts of 2–3 frames even for "still" portraits as insurance against blinks and micro-expressions [^stalman].

> **Sources disagree on multiple-subject handling.** The default behaviour is to leave human detection ON for everything [^manual], but Scaife found that with multiple faces in frame, the detection flickers between subjects — turning detection OFF and switching to One Area Plus, then placing the box manually, is dramatically more reliable [^scaife]. For this guide: detection ON for single subjects, OFF for groups. Assign the toggle to an Fn button for quick switching.

Scaife's other essential tip: **drag the AF point, don't tap it.** Dragging the focus box across the touchscreen is dramatically more responsive than tapping a new position and waiting for the camera to re-acquire [^scaife].

## Metering

Set **Metering Mode** to **Multi**. The camera automatically prioritises exposure for detected faces when face detection is on — make sure **Face Priority In Multi Metering** is enabled in the custom menu [^manual].

For backlit subjects where the camera is overexposing the face: assign **1 Shot Spot Metering** to an Fn button. Press it, and the next exposure uses spot metering regardless of your current mode. Meter off the face, shoot, and you're back to multi automatically.

## In the field

**Single subject:** Full Area AF with eye detection. Trust it.

**Group or environmental portrait:** One Area Plus, detection OFF, drag the box to your key subject's face.

**Golden hour backlight:** Switch to spot metering temporarily, meter off the shadowed face. Let the background blow out — that's the look. The Dual Native ISO system means if the camera pushes to ISO 640 or above, it engages the cleaner high-sensitivity circuit. Don't fear the climb.
