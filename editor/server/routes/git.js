import { Router } from "express";
import simpleGit from "simple-git";
import { SITE_ROOT } from "../utils/paths.js";

const router = Router();
const git = simpleGit(SITE_ROOT);

/**
 * GET /api/git/status
 * Current branch, clean/dirty, last commit summary.
 */
router.get("/status", async (_req, res) => {
  try {
    const status = await git.status();
    const log = await git.log({ maxCount: 1 });
    res.json({
      branch: status.current,
      clean: status.isClean(),
      files: status.files.length,
      staged: status.staged.length,
      lastCommit: log.latest
        ? { hash: log.latest.hash.slice(0, 7), message: log.latest.message, date: log.latest.date }
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/git/publish
 * Body: { message } — stage all, commit, push.
 */
router.post("/publish", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Commit message required" });

  try {
    await git.add(".");
    await git.commit(message);
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
