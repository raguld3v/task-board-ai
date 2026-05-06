const express = require("express");
const router = express.Router();
const { generateTask } = require("../controllers/aiController");

router.post("/generate", generateTask);

module.exports = router;
