import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

// START_ANGLE 和 END_ANGLE 是雷達圖繪製用，MIN_ANGLE 和 MAX_ANGLE 是 Servo 最大可轉動角度
const START_ANGLE = 0
const END_ANGLE = 180
const SCAN_DURATION = 7200 // SCAN_INTERVAL * (MAX_ANGLE - MIN_ANGLE)

const svgElement = document.getElementById("radar")
const svgWidth = svgElement.width.baseVal.value
const svgHeight = svgElement.height.baseVal.value
const centerX = svgWidth * 0.5
const centerY = svgHeight * 0.745
const r = Math.min(svgWidth, svgHeight) * 0.5

let lastUpdateTime = ""

const svg = d3
  .select("#radar")
  .attr("width", svgWidth)
  .attr("height", svgHeight)
  .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)

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
    .attr("class", "glow-effect")

  grid
    .append("text")
    .attr("x", (d / 200) * r)
    .attr("y", 0)
    .attr("dx", "-.7em")
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .attr("fill", "#3a3")
    .style("font-family", "'DS-Digital', sans-serif")
    .style("font-size", `${svgWidth * 0.018}px`)
    .attr("class", "glow-effect")
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
    .attr("class", "glow-effect")

  grid
    .append("text")
    .attr("x", (r + 32) * Math.cos(rads))
    .attr("y", (r + 32) * Math.sin(rads))
    .attr("text-anchor", "middle")
    .attr("fill", "#3a3")
    .style("font-family", "'DS-Digital', sans-serif")
    .style("font-size", `${svgWidth * 0.018}px`)
    .attr("class", "glow-effect")
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
    .attr("class", "glow-effect")
    .text(text)
}

const bearingText = createInfoText(0.125, "BRG: ")
const rangeText = createInfoText(0.218, "RNG: ")
const timeText = createInfoText(0.313, `T: ${getZuluTime()}`)

const updateScanResult = (angle, distance) => {
  const arcGenerator = (innerRadius, outerRadius) =>
    d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      // 讓圓弧的角度略大於 1°，盡量減少圓弧之間的空隙
      .startAngle(toRads(angle - 0.51))
      .endAngle(toRads(angle + 0.51))

  grid
    .append("path")
    .attr("d", arcGenerator(0, (distance / 200) * r))
    .attr("fill", "#3a3")
    .attr("opacity", 1)
    .transition()
    .duration(SCAN_DURATION / 2)
    .ease(d3.easeCubicIn) // equals to easePolyIn.exponent(3)
    .attr("opacity", 0)
    .remove()

  if (distance < 200) {
    grid
      .append("path")
      .attr("d", arcGenerator((distance / 200) * r, r))
      .attr("fill", "#8b0000")
      .attr("opacity", 1)
      .transition()
      .duration(SCAN_DURATION / 2)
      .ease(d3.easeCubicIn) // equals to easePolyIn.exponent(3)
      .attr("opacity", 0)
      .remove()
  }

  bearingText.text(`BRG: ${angle.toFixed()}`)
  rangeText.text(`RNG: ${distance.toFixed()}`)

  const currentTime = getZuluTime()
  if (currentTime !== lastUpdateTime) {
    timeText.text(`T: ${currentTime}`)
    lastUpdateTime = currentTime
  }
}

// TODO: dummy
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

    updateScanResult(bearing, range)
  }, 40)
}

setTimeout(dummyScan, 3000)
