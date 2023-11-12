const express = require("express");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");

const app = express();

app.get("/stream/:video", (req, res) => {
  const videoPath = path.join(__dirname, "videos", req.params.video);
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  console.log("range : " + range);

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    console.log("parts : " + parts);
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    console.log("chunkSize : " + chunkSize);

    const videoStream = fs.createReadStream(videoPath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    });

    videoStream.pipe(res);
  } else {
    console.log("No Range");

    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    });

    const videoStream = fs.createReadStream(videoPath);
    const videoReadable = new Readable();

    videoReadable._read = () => {};
    videoReadable.pipe(res);

    let totalChunk = 0;

    videoStream.on("data", (chunk) => {
      console.log("Stream readable chunk : " + chunk.byteLength);
      totalChunk += chunk.byteLength;
      videoReadable.push(chunk);
      console.log(`totalChunk : ${totalChunk}`);
    });

    videoReadable.on("end", () => {
      videoReadable.push(null);
    });
  }
});

const port = 8000;

app.listen({ port }, () => {
  console.log(`server is running on port : ${port}`);
});
