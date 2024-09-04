import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"

const START_ANGLE = 0
const END_ANGLE = 180

const svgElement = document.getElementById("radar")
const svgWidth = svgElement.width.baseVal.value
const svgHeight = svgElement.height.baseVal.value
const centerX = svgWidth * 0.5
const centerY = svgHeight * 0.7
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
    .style("font-size", `${svgWidth * 0.015}px`)
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
    .attr("x", (r + 30) * Math.cos(rads))
    .attr("y", (r + 30) * Math.sin(rads))
    .attr("text-anchor", "middle")
    .attr("fill", "#3a3")
    .style("font-family", "'DS-Digital', sans-serif")
    .style("font-size", `${svgWidth * 0.015}px`)
    .style("filter", "url(#glow)")
    .text(`${angle}°`)
})

// 添加方向、距離、時間資訊和單位說明
const createInfoText = (x, text) => {
  return svg
    .append("text")
    .attr("x", svgWidth * x)
    .attr("y", svgHeight * 0.725)
    .attr("fill", "#3a3")
    .style("font-family", "'DS-Digital', sans-serif")
    .style("font-size", `${svgWidth * 0.018}px`)
    .style("filter", "url(#glow)")
    .text(text)
}

createInfoText(0.125, "BRG: 101")
createInfoText(0.218, "RNG: 50")
createInfoText(0.313, `T: ${getZuluTime()}`)

// TODO: 待確認位置和字體大小
svg
  .append("text")
  .attr("x", svgWidth * 0)
  .attr("y", svgHeight * 0)
  .attr("text-anchor", "start")
  .attr("fill", "#3a3")
  .style("font-family", "'DS-Digital', sans-serif")
  .style("font-size", `${svgWidth * 0}px`)
  .style("filter", "url(#glow)")
  .text("BRG: DEG | RNG: CM | T: ZULU")
