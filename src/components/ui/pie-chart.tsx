"use client"

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface PieChartProps {
  data: Array<{
    name: string
    value: number
    color: string
  }>
  width: number
  height: number
  innerRadius: number
  outerRadius: number
}

export function PieChart({
  data,
  width,
  height,
  innerRadius,
  outerRadius,
}: PieChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    // 清除现有内容
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)

    const pie = d3.pie<typeof data[0]>().value((d) => d.value)
    const arc = d3.arc<d3.PieArcDatum<typeof data[0]>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)

    const arcs = svg
      .selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc")

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0.7)
      .on("mouseover", function() {
        d3.select(this).style("opacity", 1)
      })
      .on("mouseout", function() {
        d3.select(this).style("opacity", 0.7)
      })

  }, [data, width, height, innerRadius, outerRadius])

  return <svg ref={svgRef} />
} 