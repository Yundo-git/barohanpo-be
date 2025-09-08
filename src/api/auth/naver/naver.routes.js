const router = require('express').Router();
const { redirectToNaverLogin, naverCallback } = require('./naver.controller');

router.get('/login', redirectToNaverLogin);
router.get('/callback', naverCallback);

module.exports = router;
