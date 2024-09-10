import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"
import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js"

const socket = io("http://localhost:3000")

const START_ANGLE = 0 // Minimum angle for drawing radar
const END_ANGLE = 180 // Maximum angle for drawing radar
// Note: SCAN_DURATION should match the value calculated in the Arduino sketch
// It's typically SCAN_INTERVAL * (MAX_ANGLE - MIN_ANGLE) from the arduino-radar.ino
const SCAN_DURATION = 6000

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

// Utility functions
const rotateBearing = (angle) => angle - 90
const toRads = (angle) => (rotateBearing(angle) * Math.PI) / 180
const getZuluTime = () =>
  new Date().toUTCString().slice(17, 22).replace(":", "") + "Z"

// Create polar coordinate grid
const grid = svg
  .append("g")
  .attr("transform", `translate(${centerX},${centerY})`)

// Draw concentric circles and label distances
const circles = [50, 100, 150, 200]

circles.forEach((d) => {
  const arc = d3
    .arc()
    // Set innerRadius and outerRadius to the same value to draw a line
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

// Draw radial lines and label angles
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

// Add direction, distance, time information and unit descriptions
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

const updateScanResult = ({ angle, distance }) => {
  const arcGenerator = (innerRadius, outerRadius) =>
    d3
      .arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      // Set arc angle slightly larger than 1° to minimize gaps between arcs
      .startAngle(toRads(angle - 0.51))
      .endAngle(toRads(angle + 0.51))

  grid
    .append("path")
    .attr("d", arcGenerator(0, (distance / 200) * r))
    .attr("fill", "#3a3")
    .attr("opacity", 1)
    .transition()
    .duration(SCAN_DURATION / 2)
    .ease(d3.easeCubicIn) // equivalent to easePolyIn.exponent(3)
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
      .ease(d3.easeCubicIn) // equivalent to easePolyIn.exponent(3)
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

socket.on("radarData", (data) => {
  updateScanResult(data)
})
