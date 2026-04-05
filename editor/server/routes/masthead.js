import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import simpleGit from "simple-git";
import { SITE_ROOT } from "../utils/paths.js";

const router = Router();
const git = simpleGit(SITE_ROOT);
const MASTHEAD_PATH = path.join(SITE_ROOT, "content", "masthead.json");

/**
 * GET /api/masthead
 * Return the current masthead.json.
 */
router.get("/", (_req, res) => {
  try {
    const raw = fs.readFileSync(MASTHEAD_PATH, "utf-8");
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/masthead
 * Write updated masthead.json to disk (save without git).
 */
router.put("/", (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(MASTHEAD_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/masthead/publish
 * Write to disk, then git add + commit + push.
 */
router.post("/publish", async (req, res) => {
  try {
    const data = req.body;
    fs.writeFileSync(MASTHEAD_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");

    await git.add("content/masthead.json");
    await git.commit("masthead: update");
    await git.push();

    const log = await git.log({ maxCount: 1 });
    res.json({
      success: true,
      commit: log.latest
        ? { hash: log.latest.hash.slice(0, 7), message: log.latest.message }
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
