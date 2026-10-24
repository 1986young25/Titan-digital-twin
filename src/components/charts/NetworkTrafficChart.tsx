import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useEntityContext } from '../../context/EntityContext';

export function NetworkTrafficChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const { activeEntity } = useEntityContext();
  const [data, setData] = useState<{ time: Date; value: number }[]>([]);

  // Generate some realistic-looking historical data based on the active entity
  useEffect(() => {
    const now = new Date();
    const generatedData = Array.from({ length: 60 }).map((_, i) => {
      const time = new Date(now.getTime() - (59 - i) * 60000); // Past 60 minutes
      // Base traffic + sine wave for trend + random noise
      let value = 500 + Math.sin(i / 5) * 200 + Math.random() * 100;
      
      // Different entities have different traffic patterns
      if (activeEntity.id === 'TITAN_GAMES') {
        value *= 1.5;
      } else if (activeEntity.id === 'NYMT') {
        value *= 0.5;
      }
      
      return { time, value };
    });
    setData(generatedData);
  }, [activeEntity.id]);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    const isLightMode = document.documentElement.classList.contains('dark') === false;

    // Setup dimensions
    const margin = { top: 10, right: 20, bottom: 30, left: 50 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = chartRef.current.clientHeight - margin.top - margin.bottom;

    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X axis (Time)
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.time) as [Date, Date])
      .range([0, width]);

    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%H:%M') as any));

    xAxis.select('.domain').attr('stroke', isLightMode ? '#e5e7eb' : '#333');
    xAxis.selectAll('text').attr('fill', isLightMode ? '#6b7280' : '#9ca3af').attr('font-family', 'monospace').attr('font-size', '10px');
    xAxis.selectAll('line').attr('stroke', isLightMode ? '#e5e7eb' : '#333');

    // Y axis (Traffic Mbps)
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) as number * 1.2])
      .range([height, 0]);

    const yAxis = svg.append('g').call(d3.axisLeft(y).ticks(5));
    
    yAxis.select('.domain').attr('stroke', isLightMode ? '#e5e7eb' : '#333');
    yAxis.selectAll('text').attr('fill', isLightMode ? '#6b7280' : '#9ca3af').attr('font-family', 'monospace').attr('font-size', '10px');
    yAxis.selectAll('line').attr('stroke', isLightMode ? '#e5e7eb' : '#333');

    // Add Y axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .style('fill', isLightMode ? '#6b7280' : '#6b7280')
      .style('font-family', 'monospace')
      .style('font-size', '10px')
      .text('TRAFFIC (Mbps)');

    // Grid lines
    const makeYLines = () => d3.axisLeft(y).ticks(5);
    svg.append('g')
      .attr('class', 'grid')
      .call(makeYLines()
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', isLightMode ? '#f3f4f6' : '#1f2937')
      .attr('stroke-dasharray', '2,2');

    svg.select('.grid .domain').remove();

    // Area fill
    const area = d3.area<{ time: Date; value: number }>()
      .x((d) => x(d.time))
      .y0(height)
      .y1((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', isLightMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.15)')
      .attr('d', area);

    // Line path
    const line = d3.line<{ time: Date; value: number }>()
      .x((d) => x(d.time))
      .y((d) => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add interactivity (Tooltip)
    const tooltip = d3.select(chartRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', isLightMode ? '#ffffff' : '#050505')
      .style('border', `1px solid ${isLightMode ? '#e5e7eb' : '#333'}`)
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-family', 'monospace')
      .style('font-size', '10px')
      .style('color', isLightMode ? '#374151' : '#d1d5db')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)');

    // Hover overlay for tooltips
    const focus = svg.append('g').style('display', 'none');
    
    focus.append('circle')
      .attr('r', 4)
      .attr('fill', '#10b981');

    focus.append('line')
      .attr('class', 'x-hover-line hover-line')
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', isLightMode ? '#9ca3af' : '#4b5563')
      .attr('stroke-dasharray', '3,3');

    svg.append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => { focus.style('display', null); tooltip.style('visibility', 'visible'); })
      .on('mouseout', () => { focus.style('display', 'none'); tooltip.style('visibility', 'hidden'); })
      .on('mousemove', (event) => {
        const x0 = x.invert(d3.pointer(event)[0]);
        const bisect = d3.bisector((d: {time: Date, value: number}) => d.time).left;
        const i = bisect(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        
        if (!d0 || !d1) return;
        
        const d = x0.getTime() - d0.time.getTime() > d1.time.getTime() - x0.getTime() ? d1 : d0;
        
        focus.attr('transform', `translate(${x(d.time)},${y(d.value)})`);
        focus.select('.x-hover-line').attr('y2', height - y(d.value));
        
        tooltip
          .html(`TIME: ${d3.timeFormat('%H:%M')(d.time)}<br/>TRAFFIC: <span style="color: #10b981">${Math.round(d.value)} Mbps</span>`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 20}px`);
      });

    // Handle resize
    const handleResize = () => {
      // Re-render chart on resize
      setData([...data]); 
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      tooltip.remove();
    };
  }, [data]);

  return <div ref={chartRef} className="w-full h-full relative" />;
}
