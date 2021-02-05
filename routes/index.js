const express = require("express");
const router = express.Router();
const { rooms } = require("../utils/rooms");

router.get("/", (req, res) => {
  res.send({ response: "I am alive" }).status(200);
});

router.get("/check-rooms", (req, res) => {
  console.log(req.query);
  const room = rooms.find((room) => room.id === req.query.id);
  console.log(room);
  if (room) {
    res.json({ notFound: false });
    return;
  }
  res.json({ notFound: true });
});

module.exports = router;
