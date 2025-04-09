// Sample Hierarchical Data
const data = {
    name: "Categories",
    children: [
        {
            name: "Category 1",
            value: 100,
            children: [
                { name: "Value 1-A", value: 40 },
                { name: "Value 1-B", value: 60 }
            ]
        },
        {
            name: "Category 2",
            value: 200,
            children: [
                { 
                    name: "Value 2-A", 
                    value: 80,
                    children: [
                        { name: "Sub Value 2-A-i", value: 30 },
                        { name: "Sub Value 2-A-ii", value: 50 }
                    ]
                },
                { name: "Value 2-B", value: 120 }
            ]
        },
        {
            name: "Category 3",
            value: 150
            // No children for Category 3
        }
    ]
};

const width = 450;
const height = 450;
const margin = 40;
const radius = Math.min(width, height) / 2 - margin;

const svg = d3.select("#chart-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

// Add a back button (initially hidden)
const backButton = d3.select("#chart-container")
    .append("div")
    .attr("class", "back-button")
    .text("< Back")
    .on("click", () => navigateUp());

// Add tooltip div
const tooltip = d3.select("#chart-container")
    .append("div")
    .attr("class", "tooltip");

// Color scale
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Keep track of the current hierarchy level
let currentData = data;
let history = [data]; // Stack to keep track of navigation history

// Define the pie layout function
const pie = d3.pie()
    .value(d => d.value)
    .sort(null); // Keep original order

// Define the arc generator function
const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

const labelArc = d3.arc()
    .innerRadius(radius * 0.7)
    .outerRadius(radius * 0.7);

// Function to update the chart
function update(dataToRender) {
    const chartData = dataToRender.children || []; // Use children if available, else empty

    // Bind data to paths
    const slices = svg.selectAll(".slice")
        .data(pie(chartData), d => d.data.name); // Key function for object constancy

    // --- Enter selection --- (new slices)
    const enterSlices = slices.enter()
        .append("g")
        .attr("class", "slice")
        .on("click", handleClick)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    enterSlices.append("path")
        .attr("fill", (d, i) => color(i))
        .attr("d", arc)
        .each(function (d) { this._current = d; }); // Store the initial angles

    enterSlices.append("text")
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .attr("dy", "0.35em")
        .text(d => d.data.name);

    // --- Update selection --- (existing slices)
    slices.select("path")
        .transition().duration(750)
        .attrTween("d", arcTween);

    slices.select("text")
        .transition().duration(750)
        .attr("transform", d => `translate(${labelArc.centroid(d)})`)
        .text(d => d.data.name);

    // --- Exit selection --- (slices to remove)
    const exitSlices = slices.exit();

    exitSlices.select("path")
        .transition().duration(750)
        .attrTween("d", arcTweenExit)
        .remove();

    exitSlices.select("text")
        .remove();

    exitSlices.remove();

    // Update back button visibility
    backButton.style("display", history.length > 1 ? "block" : "none");
}

// Interpolation function for transitions
function arcTween(a) {
    const i = d3.interpolate(this._current, a);
    this._current = i(0);
    return (t) => arc(i(t));
}

// Interpolation function for exit transitions
function arcTweenExit(a) {
    const i = d3.interpolate(this._current, { startAngle: a.startAngle, endAngle: a.startAngle, value: 0 }); // Collapse to start angle
    this._current = i(0);
    return (t) => arc(i(t));
}

// Handle click events for drilldown
function handleClick(event, d) {
    if (d.data.children && d.data.children.length > 0) {
        history.push(d.data); // Add current level to history
        currentData = d.data;
        update(currentData);
    }
    // If no children, do nothing on click (or maybe show details)
}

// Handle mouseover for tooltip
function handleMouseOver(event, d) {
    tooltip.transition()
        .duration(200)
        .style("opacity", .9);
    tooltip.html(`${d.data.name}<br/>Value: ${d.data.value}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
}

// Handle mouseout for tooltip
function handleMouseOut(event, d) {
    tooltip.transition()
        .duration(500)
        .style("opacity", 0);
}

// Navigate back up the hierarchy
function navigateUp() {
    if (history.length > 1) {
        history.pop(); // Remove current level
        currentData = history[history.length - 1]; // Go to previous level
        update(currentData);
    }
}

// Initial chart render
update(currentData);
