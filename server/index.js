const express = require("express")
const app = express()
const http = require("http").createServer(app)
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// const { SerialPort } = require("serialport");
// const { ReadlineParser } = require("@serialport/parser-readline");

// // 請依照各自系統調整
// const port = new SerialPort({
//   path: "/dev/cu.usbmodem1101",
//   baudRate: 9600,
// });

// const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

// parser.on("data", (data) => {
//   console.log(data);
//   const [angle, distance] = data.split(",").map(Number);
//   io.emit("radarData", { angle, distance });
// });

const serverPort = 3000
http.listen(serverPort, () => {
  console.log(`Server runs at http://localhost:${serverPort}`)
})

// Dummy scan 函數
const dummyScan = () => {
  let bearing = 0
  let range = 200
  let direction = 1 // 1: clockwise / -1: counter-clockwise

  setInterval(() => {
    if (direction > 0) {
      bearing++
      if (bearing >= 180) {
        direction = -1
      }
    } else if (direction < 0) {
      bearing--
      if (bearing <= 0) {
        direction = 1
      }
    }

    range = Math.min(Math.random() * 500, 200)

    io.emit("radarData", { angle: bearing, distance: range })
    console.log(`angle = ${bearing}, distance = ${range}`)
  }, 40)
}

io.on("connection", () => {
  console.log("新的客戶端連接")

  if (!global.dummyScanStarted) {
    dummyScan()
    global.dummyScanStarted = true
  }
})
