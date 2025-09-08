function setRefreshCookie(res, token) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/", // 중요: "/"로!
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
module.exports = { setRefreshCookie, clearRefreshCookie };
