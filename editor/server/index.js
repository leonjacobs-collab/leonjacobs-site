import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SITE_ROOT } from "./utils/paths.js";
import postsRouter from "./routes/posts.js";
import mediaRouter from "./routes/media.js";
import gitRouter from "./routes/git.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 4445; // API server; Vite client runs on 4444

app.use(cors({ origin: "http://localhost:4444" }));
app.use(express.json());

// Serve the site's public/ directory so uploaded images are visible in the editor preview
app.use("/images", express.static(path.join(SITE_ROOT, "public", "images")));

// API routes
app.use("/api/posts", postsRouter);
app.use("/api/media", mediaRouter);
app.use("/api/git", gitRouter);

app.listen(PORT, () => {
  console.log(`\n  ✦ Editor API running at http://localhost:${PORT}`);
  console.log(`  ✦ Open editor UI at http://localhost:4444\n`);
});
