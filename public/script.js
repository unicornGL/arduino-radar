import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

const START_ANGLE = 0
const END_ANGLE = 180
const SCAN_DURATION = 7200

const svgElement = document.getElementById("radar")
const svgWidth = svgElement.width.baseVal.value
const svgHeight = svgElement.height.baseVal.value
const centerX = svgWidth * 0.5
const centerY = svgHeight * 0.745
const r = Math.min(svgWidth, svgHeight) * 0.5

const svg = d3
  .select("#radar")
  .attr("width", svgWidth)
  .attr("height", svgHeight)
  .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)

// 增加軍事風格濾鏡
const defs = svg.append("defs")
const filter = defs.append("filter").attr("id", "glow")

filter
  .append("feGaussianBlur")
  .attr("stdDeviation", "2.5")
  .attr("result", "coloredBlur")

const feMerge = filter.append("feMerge")
feMerge.append("feMergeNode").attr("in", "coloredBlur")
feMerge.append("feMergeNode").attr("in", "SourceGraphic")

// Utils
const rotateBearing = (angle) => angle - 90
const toRads = (angle) => (rotateBearing(angle) * Math.PI) / 180
const getZuluTime = () =>
  new Date().toUTCString().slice(17, 22).replace(":", "") + "Z"

// 創建極坐標網格
const grid = svg
  .append("g")
  .attr("transform", `translate(${centerX},${centerY})`)

// 繪製同心圓和標註距離
const circles = [50, 100, 150, 200]

circles.forEach((d) => {
  const arc = d3
    .arc()
    // 把 innerRadius 和 outerRadius 設為一樣來繪製線條
    .innerRadius((d / 200) * r)
    .outerRadius((d / 200) * r)
    .startAngle(toRads(START_ANGLE))
    .endAngle(toRads(END_ANGLE))

  grid
    .append("path")
    .attr("d", arc)
    .attr("fill", "none")
    .attr("stroke", "#3a3")
    .attr("stroke-width", 4)

  grid
    .append("text")
    .attr("x", (d / 200) * r)
    .attr("y", 0)
    .attr("dx", "-.6em")
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .attr("fill", "#3a3")
    .style("font-family", "'DS-Digital', sans-serif")
    .style("font-size", `${svgWidth * 0.018}px`)
    .style("filter", "url(#glow)")
    .text(d)
})

// 繪製放射線和標註角度
const angles = [0, 30, 60, 90, 120, 150, 180]

angles.forEach((angle) => {
  const rads = toRads(rotateBearing(angle))

  grid
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", r * Math.cos(rads))
    .attr("y2", r * Math.sin(rads))
    .attr("stroke", "#3a3")
    .attr("stroke-width", 4)

  grid
    .append("text")
    .attr("x", (r + 28) * Math.cos(rads))
    .attr("y", (r + 28) * Math.sin(rads))
    .attr("text-anchor", "middle")
    .attr("fill", "#3a3")
    .style("font-family", "'DS-Digital', sans-serif")
    .style("font-size", `${svgWidth * 0.018}px`)
    .style("filter", "url(#glow)")
    .text(`${angle}°`)
})

// 添加方向、距離、時間資訊和單位說明
const createInfoText = (x, text) => {
  return svg
    .append("text")
    .attr("x", svgWidth * x)
    .attr("y", svgHeight * 0.77)
    .attr("fill", "#3a3")
    .style("font-family", "'DS-Digital', sans-serif")
    .style("font-size", `${svgWidth * 0.018}px`)
    .style("filter", "url(#glow)")
    .text(text)
}

createInfoText(0.125, "BRG: 101")
createInfoText(0.218, "RNG: 50")
createInfoText(0.313, `T: ${getZuluTime()}`)

// 繪製掃描動畫
const scanLine = grid
  .append("line")
  .attr("x1", 0)
  .attr("y1", 0)
  .attr("x2", -r)
  .attr("y2", 0)
  .attr("stroke", "#0f0")
  .attr("stroke-width", 2)
  .attr("opacity", 0.7)

const scanArea = grid
  .append("path")
  .attr("fill", "#0f0")
  .attr("fill-opacity", 0.2)

const scan = () => {
  let angle = 0

  d3.timer((elapsed) => {
    angle =
      ((elapsed % SCAN_DURATION) / SCAN_DURATION) * (END_ANGLE - START_ANGLE)

    scanLine.attr("transform", `rotate(${angle})`)

    const arcPath = d3
      .arc()
      .innerRadius(0)
      .outerRadius(r)
      .startAngle(toRads(angle)) // 使掃描區域跟隨掃描線移動
      .endAngle(toRads(0))

    scanArea.attr("d", arcPath)
  })
}

scan()

// TODO: dummy data
// let bearing = 0
// let range = 200
// let direction = 1 // 1: clockwise / -1: counter-clockwise

// setInterval(() => {
//   if (direction > 0) {
//     bearing++
//     if (bearing >= 180) {
//       direction = -1
//     }
//   } else if (direction < 0) {
//     bearing--
//     if (bearing <= 0) {
//       direction = 1
//     }
//   }

//   range = Math.random() * 1000
//   if (range > 200) range = 200

//   console.log("bearing", bearing)
//   console.log("range", range)
//   console.log("direction", direction)

//   return {
//     bearing,
//     range,
//     direction,
//   }
// }, 40)
