import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import postsRouter from "./routes/posts.js";
import mediaRouter from "./routes/media.js";
import gitRouter from "./routes/git.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 4445; // API server; Vite client runs on 4444

app.use(cors({ origin: "http://localhost:4444" }));
app.use(express.json());

// API routes
app.use("/api/posts", postsRouter);
app.use("/api/media", mediaRouter);
app.use("/api/git", gitRouter);

app.listen(PORT, () => {
  console.log(`\n  ✦ Editor API running at http://localhost:${PORT}`);
  console.log(`  ✦ Open editor UI at http://localhost:4444\n`);
});
