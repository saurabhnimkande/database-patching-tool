import express from "express";
import cors from 'cors';
import apiRouter from "./routes/apiRouter.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

const PORT = 3123;
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
