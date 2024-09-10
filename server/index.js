const express = require("express")
const app = express()
const http = require("http").createServer(app)
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})
const { SerialPort } = require("serialport")
const { ReadlineParser } = require("@serialport/parser-readline")
const { log } = require("console")

// 請依照各自系統調整
const port = new SerialPort({
  path: "/dev/cu.usbmodem1101",
  baudRate: 9600,
})

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }))

parser.on("data", (data) => {
  console.log("Data from Arduino", data)
  const [angle, distance] = data.split(",").map(Number)
  io.emit("radarData", { angle, distance })
})

const serverPort = 3000
http.listen(serverPort, () => {
  console.log(`Server runs at http://localhost:${serverPort}`)
})
