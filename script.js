const { dia, shapes, highlighters } = joint;

const head = document.head || document.getElementsByTagName('head')[0];
const style = document.createElement('style');
style.type = 'text/css';
style.appendChild(document.createTextNode(`
    .animated-dash {
        stroke-dasharray: 10,10;
        stroke-dashoffset: 20;
        animation: dash 1s linear infinite;
    }
    @keyframes dash {
        to {
            stroke-dashoffset: 0;
        }
    }
`));
head.appendChild(style);

// Paper

const paperContainer = document.getElementById("paper-container");

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
  model: graph,
  cellViewNamespace: shapes,
  width: "100%",
  height: "100%",
  gridSize: 10,
  async: true,
  frozen: true,
  sorting: dia.Paper.sorting.APPROX,
  background: { color: "#F3F7F6" },
  clickThreshold: 10,
  defaultConnector: {
    name: "rounded"
  },
  defaultRouter: {
    name: "manhattan",
    args: {
      step: 10,
      endDirections: ["bottom"],
      startDirections: ["top"],
      padding: { bottom: 20 }
    }
  }
});

paperContainer.appendChild(paper.el);

const color = "#ff4468";

paper.svg.prepend(
  V.createSVGStyle(`
        .joint-element .selection {
            stroke: ${color};
        }
        .joint-link .selection {
            stroke: ${color};
            stroke-dasharray: 5;
            stroke-dashoffset: 10;
            animation: dash 0.5s infinite linear;
        }
        @keyframes dash {
            to {
                stroke-dashoffset: 0;
            }
        }
    `)
);

function element(x, y, text) {
  const el = new shapes.standard.Rectangle({
    position: { x, y },
    size: { width: 100, height: 60 },
    attrs: {
      label: {
        text: text,
        fontFamily: "sans-serif"
      }
    },
    ports: {
      groups: {
        'left': {
          position: {
            name: 'left'
          },
          attrs: {
            circle: {
              fill: '#000000',
              r: 5,
              magnet: true
            }
          }
        },
        'right': {
          position: {
            name: 'right'
          },
          attrs: {
            circle: {
              fill: '#000000',
              r: 5,
              magnet: true
            }
          }
        }
      }
    },
    z: 2
  });
  graph.addCell(el);
  return el;
}

// Custom Link Definition
joint.shapes.standard.Link.define('example.CustomLink', {
    attrs: {
        line: {
            connection: true,
            stroke: '#333333',
            strokeWidth: 2,
            strokeLinejoin: 'round'
        }
    },
    connector: { name: 'rounded' },
    router: {
        name: 'normal'
    },
    anchors: {
        source: function (sourceView, sourceMagnet, linkView) {
            const bbox = sourceView.model.getBBox();
            return {
                x: bbox.x,
                y: bbox.y + bbox.height / 2
            };
        },
        target: function (targetView, targetMagnet, linkView) {
            const bbox = targetView.model.getBBox();
            return {
                x: bbox.x + bbox.width,
                y: bbox.y + bbox.height / 2
            };
        }
    }
});

// In your link function
function link(target, source) {
    const l = new joint.shapes.example.CustomLink({
        source: { id: source.id },
        target: { id: target.id },
        attrs: {
            line: { 
                stroke: color,
                class: 'animated-dash' // Add class to line for animation
            }
        }
    });
    graph.addCell(l);
    return l;
}


// Define Elements

const centerBox = element(300, 200, 'Gravio');

const leftBox1 = element(100, 100, 'Left 1');
const leftBox2 = element(100, 200, 'Left 2');
const leftBox3 = element(100, 300, 'Left 3');

const rightBox1 = element(500, 100, 'Right 1');
const rightBox2 = element(500, 200, 'Right 2');
const rightBox3 = element(500, 300, 'Right 3');

// Define Links

link(centerBox, leftBox1, 'left', 'right');
link(centerBox, leftBox2, 'left', 'right');
link(centerBox, leftBox3, 'left', 'right');

link(rightBox1, centerBox, 'right', 'left');
link(rightBox2, centerBox, 'right', 'left');
link(rightBox3, centerBox, 'right', 'left');

paper.unfreeze();

function getElementPredecessorLinks(el) {
  return graph
    .getSubgraph([el, ...graph.getPredecessors(el)])
    .filter((cell) => cell.isLink());
}

function highlightCell(cell) {
  highlighters.addClass.add(
    cell.findView(paper),
    cell.isElement() ? "body" : "line",
    "selection",
    { className: "selection" }
  );
}

function unhighlightCell(cell) {
  highlighters.addClass.remove(cell.findView(paper), "selection");
}

let selection = null;

function selectElement(el) {
  if (selection === el) return;
  if (selection) {
    unhighlightCell(selection);
    graph.getLinks().forEach((link) => unhighlightCell(link));
  }
  if (el) {
    highlightCell(el);
    getElementPredecessorLinks(el).forEach((link) => highlightCell(link));
    selection = el;
  } else {
    selection = null;
  }
}

paper.on("element:pointerclick", (elementView) =>
  selectElement(elementView.model)
);
paper.on("blank:pointerclick", (elementView) => selectElement(null));

selectElement(leftBox1);