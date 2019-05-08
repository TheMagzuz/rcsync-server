const express = require('express')
const router = express.Router();

const multer = require('multer');

router.post('/create', multer().single('rc'), (res, req, err) => {
    console.log(req.file);
})

module.exports = router;
