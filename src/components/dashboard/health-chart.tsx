'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HealthData {
  status: string
  count: number
}

interface HealthChartProps {
  data: HealthData[]
  width?: number
  height?: number
}

export function HealthChart({ data, width = 300, height = 200 }: HealthChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    // 清除现有内容
    d3.select(svgRef.current).selectAll("*").remove()

    const radius = Math.min(width, height) / 2.5

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)

    // 添加图例
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 80}, 20)`)

    data.forEach((d, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`)

      legendRow.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("fill", getColor(d.status))

      legendRow.append("text")
        .attr("x", 20)
        .attr("y", 10)
        .style("font-size", "12px")
        .style("fill", "currentColor")
        .text(getStatusText(d.status))
    })

    // 创建饼图组
    const pieGroup = svg.append("g")
      .attr("transform", `translate(${width/2 - 40}, ${height/2})`)

    const pie = d3.pie<HealthData>()
      .value(d => d.count)
      .sort(null)

    const arc = d3.arc<d3.PieArcDatum<HealthData>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius)

    // 创建饼图分块
    const arcs = pieGroup
      .selectAll("path")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", d => getColor(d.data.status))
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

  }, [data, width, height])

  const getColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'green': return '#22c55e'
      case 'yellow': return '#eab308'
      case 'red': return '#ef4444'
      default: return '#94a3b8'
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'green': return '健康'
      case 'yellow': return '警告'
      case 'red': return '异常'
      default: return '未知'
    }
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>集群健康状态</CardTitle>
        <CardDescription>当前所有集群的健康状态分布</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <svg ref={svgRef} />
          <p className="text-sm text-muted-foreground mt-2">
            共 {total} 个集群
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 