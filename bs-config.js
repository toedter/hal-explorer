module.exports = {
  port: 3000,
  open: false,
  logLevel: "silent",
  cors: true,
  server: {
    baseDir: "./test-data",
    middleware: {
      0: null,
      10: mimeTypeHandler
    }
  }
}

function mimeTypeHandler(req, res, next) {
  if (req.url.includes(".hal.")) {
    res.setHeader("Content-Type", "application/hal+json");
    if (req.url.includes("users.hal.")) {
      res.setHeader("Link", '<http://localhost:3000/spring.profile.json>;rel="profile"');
      res.setHeader("Access-Control-Expose-Headers", "Location,Date,Link,ETag,X-Application-Context")
    }
  } else if (req.url.includes(".hal-forms.")) {
    res.setHeader("Content-Type", "application/prs.hal-forms+json");
  } else if (req.url.includes(".json")) {
    res.setHeader("Content-Type", "application/json");
  }
  next();
}
