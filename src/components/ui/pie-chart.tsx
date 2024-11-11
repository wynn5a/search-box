"use client"

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface PieChartData {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  width?: number
  height?: number
  innerRadius?: number
  outerRadius?: number
}

export function PieChart({
  data,
  width = 200,
  height = 200,
  innerRadius = 60,
  outerRadius = 80,
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

    const pie = d3.pie<PieChartData>()
      .value(d => d.value)
      .sort(null)

    const arc = d3.arc<d3.PieArcDatum<PieChartData>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)

    // 创建饼图分块
    const arcs = svg
      .selectAll("arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc")

    // 绘制扇形
    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", d => d.data.color)
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0.8)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .style("opacity", 1)
          .transition()
          .duration(200)
          .attr("transform", "scale(1.05)")
      })
      .on("mouseout", function(event, d) {
        d3.select(this)
          .style("opacity", 0.8)
          .transition()
          .duration(200)
          .attr("transform", "scale(1)")
      })

    // 添加标签
    arcs
      .append("text")
      .attr("transform", d => `translate(${arc.centroid(d)})`)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "12px")
      .text(d => d.data.value > 0 ? d.data.value.toString() : '')

  }, [data, width, height, innerRadius, outerRadius])

  return <svg ref={svgRef} />
} 