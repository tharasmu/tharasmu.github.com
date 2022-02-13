async function getJson (file) {
  return fetch(file).then(r => r.json());
}

const q = (selector) => document.querySelector(selector);

function newElement(tagName, props = {}, children = []) {
  const el = document.createElement(tagName);
  props.class && props.class.split(" ").forEach(className => el.classList.add(className));
  el.innerText = (props.text) ? props.text.toString() : "";
  for(const [key, value] of Object.entries(props).filter(([k, _]) => k !== "class" && k !== "text")) {
    el.setAttribute(key, value);
  }
  for(const child of children) {
    el.appendChild(child);
  }
  return el;
}

// thanks to Jon Kantner for a writeup of color math logic
// https://css-tricks.com/converting-color-spaces-in-javascript/
function colorToHsl(rgb) {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;

  let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
  let h = 0, s = 0, l = 0;

  if(delta == 0) h = 0;
  else if(cmax == r) h = ((g - b) / delta) % 6;
  else if(cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if(h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = (delta == 0) ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return(h + "," + s + "%," + l + "%");
}

function hexToHsl(hex) {
  let r = 0, g = 0, b = 0;
  r = ("0x" + hex[1] + hex[2]);
  g = ("0x" + hex[3] + hex[4]);
  b = ("0x" + hex[5] + hex[6]);

  return colorToHsl([r, g, b]);
}

const totesLegitColorHelper = (colors = []) => {
  const props = {width: 101, height: 1};
  const context = newElement("canvas", props).getContext("2d");

  const gradient = context.createLinearGradient(0, 0, props.width, 0);
  const step = 1 / (colors.length - 1);
  let val = 0;
  colors.forEach(color => {
    gradient.addColorStop(val, color);
    val += step;
  })
  context.fillStyle = gradient;
  context.fillRect(0, 0, props.width, props.height);

  return context;
}

const series = [{name: "Alkali metal", color: "#f9a9a8", abbv: "AM"},
                {name: "Alkaline earth metal", color: "#fbdabc", abbv: "AEM"},
                {name: "Lanthanide", color: "#aa6800", abbv: "LA"},
                {name: "Actinide", color: "#bff6e2", abbv: "AC"},
                {name: "Transition metal", color: "#acd0f5", abbv: "TM"},
                {name: "Post-transition metal", color: "#acf6a8", abbv: "PTM"},
                {name: "Metalloid", color: "#d6e2a8", abbv: "M"},
                {name: "Reactive nonmetal", color: "#f9f6a8", abbv: "RN"},
                {name: "Noble gas", color: "#f9d7f5", abbv: "NG"}];

const overlays = [{name: "Series", nameCamel: "series"}, {name: "Standard State", nameCamel: "standardState"}, {name: "Atomic Mass", nameCamel: "atomicMass"},
                  {name: "Density", nameCamel: "density"}, {name: "Melting Point", nameCamel: "meltingPoint"}, {name: "Boiling Point", nameCamel: "boilingPoint"},
                  {name: "Stable Isotopes", nameCamel: "isotopes"}, {name: "Abundance (human)", nameCamel: "abundanceHuman"}];

function drawOverlaySelector() {
  const wrapper = newElement("div", {class: "overlay-selector-wrap"});
  const selectElement = newElement("select", {id: "overlay-dropdown"});
  for(let i = 0; i < overlays.length; i++) {
    const option = newElement("option", {value: overlays[i].nameCamel, text: overlays[i].name});
    selectElement.appendChild(option);
  }
  wrapper.appendChild(selectElement);
  wrapper.appendChild(newElement("label", {for: "overlay-dropdown"}));

  q(".overlay-selector").appendChild(wrapper);
}

function drawTable(obj) {

  const tableElement = newElement("table", {class: "periodic"});

  for(let i = 1; i < 10; i++) {
    const row = document.createElement("tr");
    if(i > 7) {
      if(i == 8) {
        const emptyRow = document.createElement("tr");
        emptyRow.appendChild(newElement("td", {colspan: 18, rowspan: 1, style: "padding-top: 16px"}));
        tableElement.appendChild(emptyRow);
      }
      row.appendChild(newElement("td", {colspan: 2, rowspan: 1}));
      row.appendChild(newElement("td", {class: "element-cell-filler", style: "font-size: 0.9em; background: " + series[i - 6].color, text: ((i == 8) ? "*" : "**" ) + "\n" + series[i - 6].name + "s"}))
      obj.filter(entry => entry.group == series[i - 6].name).forEach((element, elementColIndex) => {
        const elGroup = series.filter(group => group.name == element.group)[0];
        const elCell = newElement("td", {class: "element-cell", "data-elementnumber": element.atomicNumber, style: "background: " + elGroup.color},
          [newElement("div", {class: "element-cell-wrapper"}, [
            newElement("h2", {text: element.symbol}),
            newElement("span", {class: "table-element-number", text: element.atomicNumber}),
            newElement("span", {class: "table-element-name", text: element.name}),
            newElement("span", {class: "table-element-tertiary", text: elGroup.abbv, alt: elGroup.name})
          ])]);
        row.appendChild(elCell);
      })
    }
    else {
      obj.filter(entry => entry.period == i).forEach((element, elementColIndex) => {
        if(i == 1 && elementColIndex == 1) {
          const emptyCells = [newElement("td"),
          newElement("td", {class: "element-details", colspan: 10, rowspan: 3}, [
            newElement("aside", {class: "periodic-table-legend"}),
            newElement("div")
          ]), newElement("td", {class: "overlay-selector", colspan: 5, rowspan: 1})];
          for(let j = 0; j < emptyCells.length; j++) {
            row.appendChild(emptyCells[j]);
          }
        }
        if(element.hasOwnProperty("period")) {
          const elGroup = series.filter(group => group.name == element.group)[0];
          const elCell = newElement("td", {class: "element-cell", "data-elementnumber": element.atomicNumber, style: "background: " + elGroup.color},
            [newElement("div", {class: "element-cell-wrapper"}, [
              newElement("h2", {text: element.symbol}),
              newElement("span", {class: "table-element-number", text: element.atomicNumber}),
              newElement("span", {class: "table-element-name", text: element.name}),
              newElement("span", {class: "table-element-tertiary", text: elGroup.abbv, alt: elGroup.name})
            ])]);
          row.appendChild(elCell);
        }
        if(elementColIndex == 1 && (i == 6 || i == 7)) {
          const emptyCell = newElement("td", {class: "element-cell-filler", style: "background: " + series[i - 4].color, text: (i == 6) ? "*" : "**"});
          row.appendChild(emptyCell);
        }
      });
    }
    tableElement.appendChild(row);
  }
  return tableElement;
}

function showDetails(i) {
  const elObj = elements[i];
  const elNode = newElement("div");
  elNode.appendChild(newElement("div", {class: "details-shortfact"}, [
    newElement("div", {class: "details-shortfact-number", text: elObj.atomicNumber, style: "background: " + series.filter(entry => entry.name == elObj.group)[0].color}),
    newElement("h2", {class: "details-shortfact-symbol", text: elObj.symbol}),
    newElement("div", {class: "details-shortfact-name", text: elObj.name}),
    newElement("div", {class: "details-shortfact-group", text: elObj.group})
  ]));

  elNode.appendChild(newElement("table", {class: "details-longfact"},
  [newElement("tr", {}, [
    newElement("td", {text: "standard state:"}),
    newElement("td", {text: elObj.standardState.toLowerCase(), "aria-label": "standardState"})
  ]),
   newElement("tr", {}, [
     newElement("td", {text: "atomic mass:"}),
     newElement("td", {text: elObj.atomicMass + " u", "aria-label": "atomicMass"})
   ])
  ]));
  elObj.density && elNode.querySelector(".details-longfact").appendChild(newElement("tr", {}, [newElement("td", {text: "density:"}), newElement("td", {text: elObj.density + " g/cm", "aria-label": "density"}, [newElement("sup", {text: 3})])]));
  elObj.meltingPoint && elNode.querySelector(".details-longfact").appendChild(newElement("tr", {}, [newElement("td", {text: "melting point:"}), newElement("td", {text: elObj.meltingPoint + " K", "aria-label": "meltingPoint"})]));
  elObj.boilingPoint && elNode.querySelector(".details-longfact").appendChild(newElement("tr", {}, [newElement("td", {text: "boiling point:"}), newElement("td", {text: elObj.boilingPoint + " K", "aria-label": "boilingPoint"})]));
  elObj.yearDiscovered && elNode.querySelector(".details-longfact").appendChild(newElement("tr", {}, [newElement("td", {text: "discovered:"}), newElement("td", {text: elObj.yearDiscovered})]));

  q(App.viewTarget).lastElementChild.replaceWith(elNode);
  localStorage.setItem("currentElementIndex", i);
  !q(`[data-elementnumber = "${i + 1}"]`).classList.contains("current") && q(`[data-elementnumber = "${i + 1}"]`).classList.add("current");

}

function drawTooltip(which) {
  const selector = (which > 0) ? ".gradient-high" : ".gradient-low";
  const boundingBox = q(selector).firstElementChild.getBoundingClientRect();
  const x = boundingBox.x + 40, y = window.scrollY + boundingBox.y - 40;
  const text = (which > 0)
    ? `Max: ${App.extremes.max.value} (${typeof App.extremes.max.name == "number" ? App.extremes.max.name + " elements": App.extremes.max.name})`
    : `Min: ${App.extremes.min.value} (${typeof App.extremes.min.name == "number" ? App.extremes.min.name + " elements" : App.extremes.min.name})`;
  document.documentElement.style.cssText = `--tx: ${x}px; --ty: ${y}px`;
  const tooltip = q(".gradient-tooltip");
  tooltip.innerText = text;
  tooltip.classList.add("visible");
}

const createGradientLegend = (data) => {
  const gradientLegend = newElement("aside", {class: "periodic-table-legend"}, [
    newElement("em", {class: "legend-label unit", text: data.legend.label + " (" + data.legend.unit + ")"}),
    newElement("strong", {class: "gradient-label gradient-low"}, [newElement("span", {text: data.legend.min + " (?)"})]),
    newElement("div", {class: "legend-indicator-wrapper"}, [
      newElement("div", {class: "legend-indicator", style: `background: linear-gradient(90deg, ${data.colorMin}, ${data.colorMax}`, width: 101, height: 1})
    ]),
    newElement("strong", {class: "gradient-label gradient-high"}, [newElement("span", {text: data.legend.max + " (?)"})])
  ]);
  return gradientLegend;
}

const createLinearLegend = (data, type) => {
  const linearLegend = newElement("aside", {class: "periodic-table-legend linear-legend"});
  if(type == "series") {
    linearLegend.appendChild(newElement("em", {class: "legend-label", text: "Metals"}));
    linearLegend.appendChild(newElement("em", {class: "legend-label", text: "Nonmetals"}));
  }
  for(let i = 0; i < data.length; i++) {
    const step = data[i];
    if(step.name.substring(0, 8) == "Expected") step.name = step.name.split(" ")[0] + " " + step.name.split(" ")[4].charAt(0).toUpperCase() + step.name.split(" ")[4].slice(1);
    const stepEl = newElement("div", {class: "linear-indicator-step"}, [
      newElement("div", {class: "step-color", style: `background-color: ${step.color}`}),
      newElement("span", {text: step.name.replace("metal", "m.")})
    ]);
    linearLegend.appendChild(stepEl);
  }
  return linearLegend;
}

function legendMouseenter() {
  clearTimeout(tooltipTimeout);
  const which = (this.parentNode.classList.contains("gradient-low")) ? 0 : 1;
  drawTooltip(which);
}

function legendMouseleave() {
  tooltipTimeout = setTimeout(function() {
    document.documentElement.removeAttribute("style");
    q(".gradient-tooltip").innerText = "";
  }, 200);
  q(".gradient-tooltip").classList.remove("visible");
}

function addLegendLabelListeners() {
  document.querySelectorAll(".gradient-label span").forEach(label => {
    label.addEventListener("mouseenter", legendMouseenter);
    label.addEventListener("mouseleave", legendMouseleave);
  });
}

function removeLegendLabelListeners() {
  document.querySelectorAll(".gradient-label span")?.forEach(label => {
    label.removeEventListener("mouseenter", legendMouseenter);
    label.removeEventListener("mouseleave", legendMouseleave);
  });
}

function mutateOverlay(obj = {}, type) {
  type = type || "";
  let typeSortedObj, legendIndicator, sortFn, executorFn;

  const props = {};
  const cells = document.querySelectorAll(".element-cell");

  const curColorStep = (percent) => {
    const color = App.gradient.getImageData(percent, 0, 1, 1);
    return [color.data[0], color.data[1], color.data[2]];
  }

  // legend sets a label, unit & min and max (strings for what to call each extreme of the scale) for a gradient
  // optional: sortFn sets a function by which to sort the overlay filtered elements object
  // optional: executorFn sets a function to be called when iterating through all table cells
  // useGradient can be set to false if a gradient legend does not make sense for the relevant data map, in which case the first two are unnecessary
  // if useGradient is false, props.legend will define the (non-gradient) legend as {name: foo, color: bar}
  // dataFieldOverride sets a value with which to override whatever the overlay type is called (the key in element.object leading to relevant value)

  switch(type) {
    case "atomicMass":
      props.colorMax = "#ce7e00";
      props.colorMin = "#f6f2f0";
      props.legend = {label: "mass", unit: "u", min: "low", max: "high"}
      break;
    case "meltingPoint":
      props.colorMax = "#cc0000";
      props.colorMin = "#3d85c6";
      props.legend = {label: "melting point", unit: "\xB0K", min: "low", max: "high"}
      break;
    case "boilingPoint":
      props.colorMax = "#cc0000";
      props.colorMin = "#3d85c6";
      props.legend = {label: "boiling point", unit: "\xB0K", min: "low", max: "high"}
      break;
    case "abundanceHuman":
      props.colorMax = "#3d85c6";
      props.colorMin = "#f6f2f0";
      props.dataFieldOverride = "humanMassPercent";
      props.legend = {label: "human mass", unit: "%", min: "low", max: "high"}
      break;
    case "density":
      props.colorMax = "#69a84c";
      props.colorMin = "#f6f2f0";
      props.legend = {label: "density", unit: "g/cm3", min: "low", max: "high"}
      break;
    case "standardState":
      props.useGradient = false;
      props.legend = [{name: "Gas", color: "#cfe2f3"}, {name: "Solid", color: "#f1c232"}, {name: "Liquid", color: "#ead1dc"},
        {name: "Expected to be a Gas", color: "#f6f2f0"}, {name: "Expected to be a Solid", color: "#f9e6ad"}];
      sortFn = (a, b) => {
        return a[type] > b[type] && 1 || -1
      }
      executorFn = (elementNumber) => {
        let needle = obj[elementNumber - 1][type];
        const state = props.legend.filter(option => option.name == needle)[0].color;
        const bgColor = hexToHsl(state);
        if(needle.substring(0, 8) == "Expected") needle = needle.split(" ")[4] + " (?)";
        return {text: needle, isRelevant: true, bgColor: bgColor}
      }
      break;
    case "isotopes":
      props.isCountableValue = true;
      props.colorMax = "#3d85c6";
      props.colorMin = "#f6f2f0";
      props.legend = {label: "stable isotopes", unit: "#", min: "few", max: "many"}
      sortFn = (a, b) => {
        return Object.keys(a[type]).length > Object.keys(b[type]).length && 1 || -1
      }
      break;
    default:
      type = "series";
      props.useGradient = false;
      props.legend = series;
      break;
  }

  q(".periodic").dataset.viewtype = type;

  if(type == "series") {
    for(let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const cellGroup = series.filter(group => group.name == obj[cell.dataset.elementnumber - 1].group)[0];
      cell.querySelector(".table-element-tertiary").innerText = cellGroup.abbv;
      cell.classList.add("relevant");
      cell.style.background = cellGroup.color;
    }
  }
  else {
    // until I stop being lazy & rename any errantly named keys in the json file to what they should be
    if(props.dataFieldOverride) type = props.dataFieldOverride;
    // an overlay that requires special case computation of sort or (text, isRelevant or bgColor) will have its own sortFn and executorFn, respectively
    // if not set, apply the defaults
    if(!sortFn) {
      sortFn = (a, b) => {
        return parseFloat(a[type]) > parseFloat(b[type]) && 1 || -1
      }
    }
    if(!executorFn) {
      executorFn = (elementNumber) => {
        const value = (props.isCountableValue)
          ? (obj[elementNumber - 1][type]) ? Object.keys(obj[elementNumber - 1][type]).length : null
          : (obj[elementNumber - 1][type]) ? obj[elementNumber - 1][type] : null;
        // does the element exist in the list of elements when filtered by our overlay?
        const existence = (typeSortedObj.indexOf(typeSortedObj.filter(a => parseInt(a.atomicNumber) == elementNumber)[0]) > -1) ? true : false;
        // on a scale from min to max, according to the chosen overlay, where is this element?
        // normalize position to 100-point scale to get correct color step on current gradient
        const gradientPos = (value) ? (parseInt(value) / App.extremes.max.value) * 100 : null;
        // if cell has a position (ie. exists when filtered by overlay), get the color step for that position
        const bgColor = (gradientPos !== null) ? `${colorToHsl(curColorStep(gradientPos))},0.9` : null;

        return {text: value, isRelevant: existence, bgColor: bgColor}
      }
    }

    typeSortedObj = JSON.parse(JSON.stringify(obj.filter(entry => entry[type] && entry[type] !== "")));
    typeSortedObj.sort(sortFn);

    // if data map uses a gradient, assign name and relevant value for elements at start and end position of object sorted by overlay to App.extremes
    // also create and assign our gradient to App.gradient, so we can grab a color step for an individual element cell later
    if(props.useGradient !== false) {
      const setExtremes = () => {
        let extremeValue = [];
        let extremeElement = [];
        extremeValue[0] = (props.isCountableValue) ? Object.keys(typeSortedObj[0][type]).length : typeSortedObj[0][type];
        extremeValue[1] = (props.isCountableValue) ? Object.keys(typeSortedObj[typeSortedObj.length - 1][type]).length : typeSortedObj[typeSortedObj.length - 1][type];
        for(let i = 0; i < 2; i++) {
          const haystack = typeSortedObj.filter(entry => ((props.isCountableValue) ? Object.keys(entry[type]).length : entry[type]) == extremeValue[i]);
          extremeElement[i] = (haystack.length > 1) ? haystack.length : haystack[0].name;
        }
        return {min: {value: extremeValue[0], name: extremeElement[0]}, max: {value: extremeValue[1], name: extremeElement[1]}}
      }

      App.extremes = setExtremes();
      App.gradient = totesLegitColorHelper([props.colorMin, props.colorMax]);
    }

    for(let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const elementNumber = parseInt(cell.dataset.elementnumber);
      const cellInfo = executorFn(elementNumber);
      cell.querySelector(".table-element-tertiary").innerText = (cellInfo.text && cellInfo.text !== "") ? cellInfo.text : "";
      // using setAttribute("style") rather than style.background or cssText to preserve HSLA values
      (cellInfo.bgColor == null) ? cell.removeAttribute("style") : cell.setAttribute("style", `background-color: hsla(${cellInfo.bgColor})`);
      cellInfo.isRelevant == true ? cell.classList.add("relevant") : cell.classList.remove("relevant");
    }
  }

  const overlayLegend = (props.useGradient == false) ? createLinearLegend(props.legend, type) : createGradientLegend(props);
  props.useGradient !== false && removeLegendLabelListeners();
  q(".periodic-table-legend").replaceWith(overlayLegend);
  props.useGradient !== false && addLegendLabelListeners();

  // damn superscript tags
  if(type == "density") {
    q(".periodic-table-legend .unit").innerHTML = q(".periodic-table-legend .unit").innerText.replace("3", "<sup>3</sup>");
  }

  const fillerCells = document.querySelectorAll(".element-cell-filler");
  if(!type || type == "series") {
    fillerCells[0].style.background = series[2].color;
    fillerCells[1].style.background = series[3].color;
    fillerCells[2].style.background = series[2].color;
    fillerCells[3].style.background = series[3].color;
  }
  else {
    fillerCells.forEach(fillerCell => {
      fillerCell.style.background = "var(--theme-page-3)";
    });
  }
}

const colorMatchLabelToOverlay = () => {
  document.querySelectorAll(".details-longfact td[aria-label]").forEach(label => label.removeAttribute("style"));
  if(App.overlay && App.overlay !== "series") {
    const relevantLabel = q(`.details-longfact td[aria-label = "${App.overlay}"]`);
    if(relevantLabel) {
      const color = (App.overlay == "meltingPoint" || App.overlay == "boilingPoint") ? "hsla(0, 0%, 100%, .9)" : "#000";
      const bgColor = q(".element-cell[data-elementnumber = \"" + (App.currentElementIndex + 1) + "\"]").style.getPropertyValue("background-color");
      relevantLabel.style.cssText = `color: ${color}; background-color: ${bgColor}`;
    }
  }
}

let elements, tooltipTimeout;
let tx;
window.VERBOSE = false;

const App = new Object(null);
// set up a proxy to manage state fragments
App.io = new Proxy(App, {
  set: function(obj, prop, value) {
    VERBOSE && console.log(timestamp() + " state change: " + prop + " -> " + value);
    obj[prop] = value;
    switch(prop) {
      case "overlay":
        if(q(".periodic").dataset.viewtype !== value) {
          mutateOverlay(elements, value);
        }
        break;
      case "currentElementIndex":
        showDetails(value);
        break;
      case "orientation":
        layoutSwitch();
        (App.currentElementIndex) ? showDetails(App.currentElementIndex) : showDetails(getLastCurrentElement());
        break;
    }
    colorMatchLabelToOverlay();
    return true;
  }
})

// responsiveness helped by javascript because the layout shift I wanted ran into bad times in CSS
// this is basically a glorified media query
// it sets one of two different node selectors as App.viewTarget, a container for showDetails() to fill
// and also triggers a different set of CSS rules by adding or removing a body class
const layoutSwitch = () => {
  if(App.orientation == "portrait" && screen.width < 800) {
    if(App.viewTarget !== ".singular-view") {
      q(".details-shortfact")?.remove();
      q(".details-longfact")?.remove();
      App.viewTarget = ".singular-view";
      q(".singular-view").style.setProperty("display", "block");
      q("body").classList.add("portrait");
    }
  }
  else {
    if(App.viewTarget !== ".element-details") {
      q(".details-shortfact")?.remove();
      q(".details-longfact")?.remove();
      App.viewTarget = ".element-details";
      q(".singular-view").style.setProperty("display", "none");
      q("body").classList.contains("portrait") && q("body").removeAttribute("class");
    }
  }
}

const getLastCurrentElement = () => {
  if(localStorage.getItem("currentElementIndex")) return parseInt(localStorage.getItem("currentElementIndex"));
  else return 0;
}

const getNewOrientation = () => {
  const newOrientation = ((screen.width / 800) <= 1) ? "portrait" : "landscape";
  return newOrientation;
}

const timestamp = () => {
  return (performance.now() - tx).toFixed(2);
}

window.addEventListener("DOMContentLoaded", async() => {
  elements = await getJson("elements.json");
  tx = performance.now();
  const vTable = drawTable(elements);
  q("body").insertBefore(vTable, q(".gradient-tooltip"));
  drawOverlaySelector();
  App.io.orientation = getNewOrientation();
  App.io.overlay = "series";
  App.io.currentElementIndex = getLastCurrentElement();
  VERBOSE && console.log(timestamp() + " page is set up, registering event handlers...");

  window.addEventListener("click", e => {
    (q(".overlay-selector label").classList.contains("open") && !e.target.closest("select")) && q(".overlay-selector label").removeAttribute("class");
    if(e.target.closest("td")?.classList.contains("element-cell")) {
      const elementNode = e.target.closest("td");
      q(".current")?.classList.remove("current");
      elementNode.classList.add("current");
      const index = parseInt(elementNode.querySelector(".table-element-number").innerText) - 1;
      App.io.currentElementIndex = index;
    }
    else if(e.target.closest("select")?.id == "overlay-dropdown") {
      const labelEl = q(".overlay-selector label");
      if(!labelEl.classList.contains("open")) labelEl.classList.add("open");
      else labelEl.removeAttribute("class");
    }
  })

  window.addEventListener("resize", e => {
    if((App.orientation == "portrait" && screen.width > 799) || (App.orientation == "landscape" && screen.width < 800)) {
      App.io.orientation = getNewOrientation();
    }
  });

  q("#overlay-dropdown").addEventListener("change", e => {
    const optionIndex = e.target.options.selectedIndex;
    if(q(".periodic").dataset.viewtype == overlays[optionIndex].nameCamel) return;
    App.io.overlay = overlays[optionIndex].nameCamel;
  })

  VERBOSE && console.log(timestamp() + " event handlers registered!");
})
