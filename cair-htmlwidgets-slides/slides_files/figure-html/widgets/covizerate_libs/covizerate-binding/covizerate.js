HTMLWidgets.widget({

  name: 'covizerate',

  type: 'output',

  factory: function(el, width, height) {

    return {

      renderValue: function(opts) {

        const data = HTMLWidgets.dataframeToD3(opts.data);
        let margin = ({top: 65, right: 60, bottom: 30, left: 65});
        let bisectDate = d3.bisector(function(d) { return d.year; }).left;
        let title = opts.hasOwnProperty("title") ? opts.title : "";
        let gradFill = opts.hasOwnProperty("grad_fill") ? opts.grad_fill : "#E8BF6A";
        let vLineStroke = opts.hasOwnProperty("vline_stroke") ? opts.vline_stroke : "red";
        let formatPercent = d3.format(".0%");
        function yearTickFormat(x) {return x === 0 ? "Arrival" : "Year " + x}

        const svg = d3.select(el)
                    .append("svg")
                    .style("width", "100%")
                    .style("height", "100%");

        let x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.year))
            .range([margin.left, width - margin.right]);

        let series = d3.stack()
            .keys(["graduation", "continuation"].reverse())
            (data);

        let y = d3.scaleLinear()
            .domain([0, d3.max(series, d => d3.max(d, d => d[1]))]).nice()
            .range([height - margin.bottom, margin.top]);
        /*
        let color = d3.scaleOrdinal()
            .domain(["continuation", "graduation"])
            .range(["#463077", "#E8BF6A"]);
        */

        let area = d3.area()
            .x(d => x(d.data.year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
            .curve(d3.curveBasis);

        let xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .style("font-size", "16px")
            .call(d3.axisBottom(x).tickFormat(yearTickFormat).ticks(6))
            .call(g => g.select(".domain").remove());

        let yAxis = g => g
            .attr("transform", `translate(${margin.left},0)`)
            .style("font-size", "16px")
            .call(d3.axisLeft(y).tickValues([0.2, 0.4, 0.6, 0.8, 1]).tickFormat(formatPercent))
            .call(g => g.select(".domain").remove());

        svg.append("text")
            .attr("x", margin.left)
            .attr("y", margin.top/2.7)
            .attr("font-size", "1.5em")
            .text(title);


        svg.append("linearGradient")
            .attr("id", "perc-gradient1")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0).attr("y1", y(0))
            .attr("x2", 0).attr("y2", y(0.9))
            .selectAll("stop")
              .data([
                {offset: "0%", color: "#cbb4d4"},
                {offset: "85%", color: "#20002c"}
              ])
            .enter().append("stop")
              .attr("offset", d => d.offset)
              .attr("stop-color", d => d.color);

        svg.append("g")
              .selectAll("path")
              .data(series)
              .enter().append("path")
                .attr("opacity", d => d.key === "continuation" ? 0.9 : 1)
                .attr("d", area)
                .attr("fill", d => d.key === "continuation" ? "url(#perc-gradient1)" : gradFill)
                .attr("stroke-width", "5px");

          svg.append("line")
            .attr("stroke", vLineStroke)
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", "9, 8")
            .attr("x1", x(4))
            .attr("x2", x(4))
            .attr("y1", height - margin.bottom)
            .attr("y2", margin.top);

          svg.append("g")
                .call(xAxis);

          svg.append("g")
              .call(yAxis);

          let focus = svg.append("g")
              .attr("class", "focus")
              .style("display", "none");

          focus.append("line")
              .attr("class", "hover-line")
              .attr("stroke", "gold")
              .attr("stroke-width", "2px")
              .attr("y1", height - margin.bottom);

          focus.append("circle")
              .attr("r", 10)
              .attr("stroke", "black")
              .attr("fill", "gold");

          focus.append("rect")
            .attr("class", "text-bb")
            .attr("x", -68)
            .attr("width", 135)
            .attr("opacity", 0.8)
            .attr("rx", 10)
            .attr("stroke", "lightgrey")
            .attr("fill", "white")
            .attr("visibility", "hidden");

          focus.append("text")
              .attr("class", "cont-text")
              .attr("text-anchor", "middle")
              .attr("y", -18);

          focus.append("text")
              .attr("class", "grad-text")
              .attr("text-anchor", "middle")
              .attr("y", -40);

          svg.append("rect")
              .attr("transform", `translate(${margin.left}, ${margin.top})`)
              .attr("width", width)
              .attr("height", height)
              .attr("opacity", 0)
              .on("mouseover", () => focus.style("display", null))
              .on("mouseout", () => focus.style("display", "none"))
              .on("mousemove", mousemove);

          function mousemove() {
            let x0 = x.invert(d3.mouse(this)[0]),
                i = bisectDate(data, x0, 1),
                d0 = data[i - 1],
                d1 = data[i],
                d = x0 - d0.year > d1.year - x0 ? d1 : d0;
            focus.attr("transform", `translate(${x(d.year)}, ${y(d.continuation)})`);
            focus.select(".text-bb")
              .attr("visibility", "visible")
              .attr("height", () => d.graduation > 0 ? 50 : 25)
              .attr("y", () => d.graduation > 0 ? -60 : -35);
            focus.select(".cont-text").text(() => 'Continuation: ' + formatPercent(d.continuation));
            focus.select(".grad-text").text(() => d.graduation > 0 ? 'Graduation: ' + formatPercent(d.graduation) : '');
          }
      },

      resize: function(width, height) {

      }

    };
  }
});
