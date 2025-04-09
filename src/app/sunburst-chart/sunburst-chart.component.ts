import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';
import * as yaml from 'js-yaml';

interface Node {
  name: string;
  children?: Node[];
  value?: number;
}

interface D3Node extends d3.HierarchyNode<Node> {
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  current?: D3Node;
  target?: D3Node;
}

@Component({
  selector: 'app-sunburst-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sunburst-chart.component.html',
  styleUrls: ['./sunburst-chart.component.css']
})
export class SunburstChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sunburstChart', { static: true }) private chartContainer!: ElementRef;
  
  private svg: any;
  private width = 800;
  private height = 600;
  private radius = Math.min(this.width, this.height) / 2;
  private arc: any;
  private root: D3Node | null = null;
  private current: D3Node | null = null;
  private data: Node | null = null;
  private color: any;
  private partition: any;
  private resizeObserver: ResizeObserver | null = null;
  
  public currentPath: string[] = [];
  public selectedNode: D3Node | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect) {
          this.width = entry.contentRect.width;
          this.height = Math.min(600, window.innerHeight * 0.7);
          this.radius = Math.min(this.width, this.height) / 2;
          if (this.data) {
            this.updateChart();
          }
        }
      }
    });

    const chartWrapper = this.chartContainer.nativeElement.parentElement;
    if (chartWrapper) {
      this.resizeObserver.observe(chartWrapper);
    }
  }

  private loadData(): void {
    console.log('Loading data from YAML file...');
    // Try multiple possible paths for the YAML file
    this.http.get('../assets/football-offense.yaml', { responseType: 'text' })
      .subscribe({
        next: (yamlText) => {
          console.log('YAML file loaded successfully from ../assets');
          this.processYamlData(yamlText);
        },
        error: (error) => {
          console.log('Error loading from ../assets, trying alternative path...');
          // Try alternative path
          this.http.get('./assets/football-offense.yaml', { responseType: 'text' })
            .subscribe({
              next: (yamlText) => {
                console.log('YAML file loaded successfully from ./assets');
                this.processYamlData(yamlText);
              },
              error: (secondError) => {
                // Try one more path
                this.http.get('/assets/football-offense.yaml', { responseType: 'text' })
                  .subscribe({
                    next: (yamlText) => {
                      console.log('YAML file loaded successfully from /assets');
                      this.processYamlData(yamlText);
                    },
                    error: (thirdError) => {
                      console.error('Failed to load YAML file from all paths:', error, secondError, thirdError);
                      // Use hardcoded data as fallback
                      this.useHardcodedData();
                    }
                  });
              }
            });
        }
      });
  }

  private processYamlData(yamlText: string): void {
    try {
      this.data = yaml.load(yamlText) as Node;
      console.log('YAML parsed successfully:', this.data);
      this.initializeChart();
    } catch (e) {
      console.error('Error parsing YAML:', e);
      this.useHardcodedData();
    }
  }

  private useHardcodedData(): void {
    console.log('Using hardcoded data as fallback');
    // Simple fallback data structure
    this.data = {
      name: 'Football Offense',
      children: [
        {
          name: 'I-Formation',
          children: [
            {
              name: 'I-Right',
              children: [
                {
                  name: 'Run',
                  children: [
                    { name: 'Power', value: 10 },
                    { name: 'Sweep', value: 8 }
                  ]
                },
                {
                  name: 'Pass',
                  children: [
                    { name: 'Smash', value: 9 },
                    { name: 'Verts', value: 7 }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: 'Trips',
          children: [
            {
              name: 'Trips Right',
              children: [
                {
                  name: 'Run',
                  children: [
                    { name: 'Zone', value: 12 },
                    { name: 'Draw', value: 8 }
                  ]
                },
                {
                  name: 'Pass',
                  children: [
                    { name: 'Bubble Screen', value: 13 },
                    { name: 'Verts', value: 11 }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
    this.initializeChart();
  }

  private initializeChart(): void {
    console.log('Initializing chart...');
    if (!this.data) {
      console.error('No data available for chart');
      return;
    }

    const element = this.chartContainer.nativeElement;
    console.log('Chart container element:', element);
    
    if (!element || !element.parentElement) {
      console.error('Chart container element or parent not found');
      return;
    }
    
    this.width = element.parentElement.clientWidth || 800;
    this.height = Math.min(600, window.innerHeight * 0.7);
    this.radius = Math.min(this.width, this.height) / 2;
    console.log(`Chart dimensions: ${this.width}x${this.height}, radius: ${this.radius}`);

    // Clear any existing SVG content
    d3.select(element).selectAll('*').remove();

    // Create SVG element
    this.svg = d3.select(element)
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .style('max-width', '100%')
      .style('height', 'auto');
    
    console.log('SVG element created:', this.svg.node());

    // Create a group element for the chart
    const g = this.svg.append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`);

    // Define color scale
    this.color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, 10));

    // Create partition layout
    this.partition = d3.partition<Node>()
      .size([2 * Math.PI, this.radius]);

    // Create arc generator
    this.arc = d3.arc<any>()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(0.005)
      .padRadius(this.radius / 2)
      .innerRadius(d => Math.sqrt(d.y0))
      .outerRadius(d => Math.sqrt(d.y1));

    // Create hierarchy from data
    this.root = d3.hierarchy(this.data)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Apply partition layout
    this.partition(this.root);
    this.root.each((d: any) => {
      d.current = d;
    });

    // Set current node to root
    this.current = this.root;
    this.selectedNode = this.root;

    // Create path elements
    const path = g.append('g')
      .selectAll('path')
      .data(this.root.descendants().filter((d: D3Node) => d.depth))
      .enter()
      .append('path')
      .attr('class', 'slice')
      .attr('fill', (d: D3Node) => {
        let node = d;
        while (node.depth > 1) node = node.parent!;
        return this.color(node.data.name);
      })
      .attr('fill-opacity', (d: D3Node) => this.arcVisible(d.current!) ? 1 : 0)
      .attr('d', (d: D3Node) => this.arc(d.current!));

    // Add click handler
    path.filter((d: D3Node) => d.children)
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: D3Node) => {
        this.clicked(event, d);
      });

    // Add hover effect
    path.on('mouseover', (event: MouseEvent, d: D3Node) => {
      this.selectedNode = d;
      d3.select(event.currentTarget as Element)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
    })
    .on('mouseout', (event: MouseEvent, d: D3Node) => {
      d3.select(event.currentTarget as Element)
        .attr('stroke', null)
        .attr('stroke-width', null);
    });

    // Add labels
    const label = g.append('g')
      .attr('pointer-events', 'none')
      .attr('text-anchor', 'middle')
      .style('user-select', 'none')
      .selectAll('text')
      .data(this.root.descendants().filter((d: D3Node) => {
        return d.depth && d.y0 !== undefined && d.y1 !== undefined && 
               d.x0 !== undefined && d.x1 !== undefined && 
               (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10;
      }))
      .enter()
      .append('text')
      .attr('class', 'slice-label')
      .attr('dy', '0.35em')
      .attr('fill-opacity', (d: D3Node) => +this.labelVisible(d.current!))
      .attr('transform', (d: D3Node) => this.labelTransform(d.current!))
      .text((d: D3Node) => d.data.name);

    // Add parent circle for returning to parent
    const parent = g.append('circle')
      .datum(this.root)
      .attr('r', this.radius * 0.1)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('click', (event: MouseEvent, d: D3Node) => {
        this.clicked(event, d);
      });

    // Update the breadcrumb path
    this.updateBreadcrumb();
  }

  private updateChart(): void {
    if (!this.data || !this.root || !this.current) return;

    const element = this.chartContainer.nativeElement;
    d3.select(element).selectAll('*').remove();

    this.initializeChart();
  }

  // Determine if arc should be visible
  private arcVisible(d: D3Node): boolean {
    return d.y1 !== undefined && d.y0 !== undefined && d.x1 !== undefined && d.x0 !== undefined &&
           d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  // Determine if label should be visible
  private labelVisible(d: D3Node): boolean {
    return d.y1 !== undefined && d.y0 !== undefined && d.x1 !== undefined && d.x0 !== undefined &&
           d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  // Calculate label transform
  private labelTransform(d: D3Node): string {
    if (d.x0 === undefined || d.x1 === undefined || d.y0 === undefined || d.y1 === undefined) {
      return '';
    }
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = Math.sqrt(d.y0 + d.y1) / 2;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  // Handle click event
  private clicked(event: any, p: D3Node): void {
    if (!this.current || !this.root) return;

    // If we click on the center circle, go up one level
    if (p === this.root && this.current !== this.root) {
      p = this.current.parent || this.root;
    }

    // Update current node
    this.current = p;
    this.selectedNode = p;

    // Update breadcrumb
    this.updateBreadcrumb();

    // Animate transition
    this.svg.selectAll('path')
      .transition()
      .duration(750)
      .attrTween('d', (d: D3Node) => {
        const i = d3.interpolate(d.current, d);
        d.current = i(0);
        return (t: number) => this.arc(i(t));
      })
      .attr('fill-opacity', (d: D3Node) => this.arcVisible(d.current!) ? 1 : 0);

    // Update labels
    this.svg.selectAll('text')
      .transition()
      .duration(750)
      .attr('fill-opacity', (d: D3Node) => +this.labelVisible(d.current!))
      .attrTween('transform', (d: D3Node) => {
        const i = d3.interpolate(d.current, d);
        d.current = i(0);
        return (t: number) => this.labelTransform(i(t));
      });
  }

  // Update breadcrumb path
  private updateBreadcrumb(): void {
    if (!this.current) return;

    this.currentPath = [];
    let node: D3Node | null = this.current;

    while (node && node !== this.root) {
      this.currentPath.unshift(node.data.name);
      node = node.parent;
    }

    if (this.root) {
      this.currentPath.unshift(this.root.data.name);
    }
  }

  // Public method to handle breadcrumb navigation
  public zoomTo(index: number): void {
    if (!this.root) return;

    let targetNode = this.root;
    const path = this.currentPath.slice(0, index + 1);

    // Find the target node by traversing the path
    for (let i = 1; i < path.length; i++) {
      const name = path[i];
      if (targetNode.children) {
        const found = targetNode.children.find(child => child.data.name === name);
        if (found) {
          targetNode = found;
        } else {
          break;
        }
      }
    }

    // Simulate click on the target node
    if (targetNode !== this.current) {
      this.clicked(null, targetNode);
    }
  }
}
