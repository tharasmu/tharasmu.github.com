const q = (selector) => document.querySelector(selector);
const qa = (selector) => document.querySelectorAll(selector);

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

// const title = "Imperial and Metric Units of Length Measurement";
// const items = [["centimetre", "cm", 0.01], ["inch", "in", 0.0254], ["foot", "ft", 0.03048], ["decimetre", "dm", 0.1], ["yard", "yd", 0.9144], ["metre", "m", 1], ["fathom", "ftm", 1.852], ["furlong", "fur", 201.168], ["kilometre", "km", 1000], ["mile", "mi", 1609.344]];

const title = "Life Expectancy at Birth (both sexes) by Country";
const items = [["Hong Kong", "", 85.29], ["Japan", "", 85.03], ["Spain", "", 83.99], ["Norway", "", 82.94],
["United Kingdom", "", 81.77], ["Qatar", "", 80.73], ["United States", "", 79.11], ["Iran", "", 77.33],
["Vietnam", "", 75.77], ["Kazakhstan", "", 73.9], ["Bolivia", "", 72.35], ["India", "", 70.42],
["Myanmar", "", 67.78], ["Gambia", "", 63.26], ["Chad", "", 55.17]];
if(items[0][2] > items[items.length - 1][2]) items.reverse();

let startIndex = 2 + Math.floor(Math.random() * (items.length - 4));
let score = 0;

let clientItems = [];
let curPrompt;
let boolIsGrabbing = false;
let boolIsScrolling = false;
const placedListItems = [];
let curIndex;

function getRandomItem(arr) {
  const index = Math.floor((Math.random() * (arr.length - 1)));
  return index;
}

function createPrompt() {
  const promptNode = q(".prompt");
  const clientItemIndex = getRandomItem(clientItems);
  q(".prompt").innerText = clientItems[clientItemIndex][0];
  curIndex = items.indexOf(clientItems[clientItemIndex]);
  clientItems.splice(clientItemIndex, 1);
}

function drawCurScore() {
  if(clientItems.length == 0) {
    q(".info").classList.add("complete");
  }
  qa(".info p span")[0].innerText = score;
  qa(".info p span")[1].innerText = items.length - clientItems.length - 1;
}

function initialize() {
  clientItems = items.map((x) => x);
  clientItems.splice(startIndex, 1);
  qa(".timeline li span")[0].innerText = items[startIndex][0];
  qa(".timeline li span")[1].innerText = items[startIndex][2];
  q(".timeline li").dataset.step = startIndex;
  q("header").innerText = title;
  placedListItems.push(startIndex);
  drawCurScore();
  createPrompt();
}

let lastHoverSpot = [];

// function smoothScroller(target, boolIsScrolling) {
//   while(boolIsScrolling)
// }

function getCurrentTranslateY(element) {
  const matrix = window.getComputedStyle(element).getPropertyValue("transform");
  const output = matrix.match(/[^\s()]\d+\.\d+/);
  return (output !== null) ? Number(output[0]) : null;
}

function doListScroll(ev, boolIsStopCommand) {
  if(boolIsStopCommand && boolIsScrolling) {
    boolIsScrolling = false;
    q(".timeline").classList.remove("scrolling");
    const currentTransform = getCurrentTranslateY(q(".timeline"));
    if(currentTransform !== null) {
      let y = currentTransform;
      y += -1 * Math.sign(y) * 5;
      const scrollTargetVar = parseInt(window.getComputedStyle(q(".timeline")).getPropertyValue("--scroll-target"));
      q(".timeline").style.transform = (Math.abs(y) < Math.abs(scrollTargetVar) ? "translateY(" + y + "px)" : "");
    }
  }
  else if(!boolIsScrolling) {
    const boolScrollDirectionUp = ev.clientY < q(".timeline-wrapper").offsetHeight/2 ? true : false;
    const scrollAmountSign = boolScrollDirectionUp ? 1 : -1;
    const timelineElementHeight = q(".timeline").offsetHeight;
    const timelineGapAmount = parseInt(window.getComputedStyle(q(".timeline")).getPropertyValue("gap"));
    scrollExtremeValue = 100 + qa(".timeline li").length * q(".timeline li").offsetHeight + ((qa(".timeline li").length - 1) * timelineGapAmount);
    if(scrollExtremeValue > timelineElementHeight) {
      boolIsScrolling = true;
      q(".timeline").classList.add("scrolling");
      const y = (scrollAmountSign * 100 + scrollAmountSign * ((scrollExtremeValue - timelineElementHeight)/2 + timelineGapAmount));
      // translate per second equals 80% of four line item heights plus three gaps
      const speed = 1.2 * (4 * q(".timeline li").offsetHeight + 3 * timelineGapAmount);
      const currentOffset = getCurrentTranslateY(q(".timeline"));
      let duration;
      if(currentOffset !== null) {
        const g = (currentOffset + Math.abs(y)) / (Math.abs(y) * 2);
        const distanceTravelledFromBottom = g * Math.abs(y) * 2;
        const pathToTravel = (scrollAmountSign > 0) ? Math.abs(y) * 2 - distanceTravelledFromBottom : distanceTravelledFromBottom;
        duration = pathToTravel / speed;
      }
      else {
        duration = (Math.abs(y) * 2) / speed;
      }
      q(".timeline").style.cssText = "--scroll-target: " + y + "px; --scroll-duration: " + duration + "s";
    }
  }
}

function animateTimelineHover(node, boolPromptHoverBelow) {
  const squareMoveAmount = 20;
  if(boolPromptHoverBelow) {
    if(node.nextElementSibling !== null) node.nextElementSibling.style.transform = "translateY(" + squareMoveAmount + "px)";
    node.style.transform = "translateY(" + (-1 * squareMoveAmount) + "px)";
  }
  else {
    if(node.previousElementSibling !== null) node.previousElementSibling.style.transform = "translateY(" + (-1 * squareMoveAmount) + "px)";
    node.style.transform = "translateY(" + squareMoveAmount + "px)";
  }
}

function dragPrompt(ev) {
  const promptNode = q(".prompt");
  const offset = [ev.clientX - promptNode.getBoundingClientRect().left, ev.clientY - promptNode.getBoundingClientRect().top];
  promptNode.classList.add("is-dragging");
  document.body.appendChild(promptNode);

  function moveAt(x, y) {
    promptNode.style.left = promptNode.offsetWidth/2 - (offset[0] - x) + "px";
    promptNode.style.top = promptNode.offsetHeight/2 - (offset[1] - y) + "px";
  }

  moveAt(ev.pageX, ev.pageY);

  function onPointerMove(ev) {
    moveAt(ev.pageX, ev.pageY);

    const getCloseElement = (ev) => {
      const timelineNodes = [];
      qa(".timeline li").forEach(item => timelineNodes.push(item.getBoundingClientRect().bottom - item.offsetHeight/2));
      const closestNodeMidpoint = timelineNodes.reduce(function(prev, curr) {
        return (Math.abs(curr - ev.clientY) < Math.abs(prev - ev.clientY) ? curr : prev);
      });
      return timelineNodes.indexOf(closestNodeMidpoint);
    }

    let timelineItemBelow;

    promptNode.style.pointerEvents = "none";
    if(!document.elementFromPoint(ev.clientX, ev.clientY)) return;
    if(document.elementFromPoint(ev.clientX, ev.clientY).closest(".timeline-wrapper") !== null) {
      if(ev.clientY < q(".timeline-wrapper").getBoundingClientRect().top + 40 || ev.clientY > q(".timeline-wrapper").getBoundingClientRect().bottom - 40) {
        doListScroll(ev, false);
      }
      else {
        if(boolIsScrolling) doListScroll(ev, true);
        timelineItemBelow = qa(".timeline li")[getCloseElement(ev)];
      }
    }
    promptNode.style.pointerEvents = "initial";
    if(!timelineItemBelow) {
      lastHoverSpot = [];
      qa(".timeline li").forEach(item => item.removeAttribute("style"));
      return;
    }
    const boolPromptHoverBelow = (ev.clientY > (timelineItemBelow.getBoundingClientRect().bottom - timelineItemBelow.offsetHeight/2)) ? true : false;
    if(timelineItemBelow != lastHoverSpot[0] || boolPromptHoverBelow != lastHoverSpot[1]) {
      lastHoverSpot[0] = timelineItemBelow;
      lastHoverSpot[1] = boolPromptHoverBelow;
      if(lastHoverSpot) {
        // entering
        qa(".timeline li").forEach(item => item.removeAttribute("style"));
        animateTimelineHover(lastHoverSpot[0], lastHoverSpot[1]);
      }
    }
  }

  function onPointerUp() {
    q(".prompt").removeAttribute("style");
    q(".prompt").classList.remove("is-dragging");
    q(".prompt").removeEventListener("pointerup", onPointerUp);
    q(".choice").appendChild(q(".prompt"));
    qa(".timeline li").forEach(item => item.removeAttribute("style"));
    document.removeEventListener("pointermove", onPointerMove);
    if(lastHoverSpot[0]) {
      const stepSpotIndex = Array.prototype.indexOf.call(qa(".timeline li"), lastHoverSpot[0]);
      const stepSpot = placedListItems[stepSpotIndex];

      const stepSpotIsAllowed = () => {
        return lastHoverSpot[1] ? curIndex < stepSpot : stepSpot < curIndex;
      }
      const stepSiblingIsAllowed = () => {
        if(lastHoverSpot[1] && lastHoverSpot[0].nextElementSibling) return placedListItems[stepSpotIndex + 1] < curIndex;
        else if(!lastHoverSpot[1] && lastHoverSpot[0].previousElementSibling) return placedListItems[stepSpotIndex - 1] > curIndex;
        else return true;
      }

      const boolIsAllowed = (stepSpotIsAllowed() == true && stepSiblingIsAllowed() == true ? true : false);
      const newListItem = newElement("li", "", [newElement("span", {text: q(".prompt").innerText}), newElement("span", {text: items[curIndex][2] + items[startIndex][1]})]);
      newListItem.classList.add("transition");
      newListItem.classList.add(boolIsAllowed ? "w" : "l");
      if(lastHoverSpot[1]) {
        q(".timeline").insertBefore(newListItem, lastHoverSpot[0].nextElementSibling);
      }
      else {
        q(".timeline").insertBefore(newListItem, lastHoverSpot[0]);
      }
      placedListItems.push(curIndex);
      placedListItems.sort((a, b) => {
        return b - a;
      })
      if(!boolIsAllowed) {
        console.log(qa(".timeline li"));
        const curPos = Array.prototype.indexOf.call(qa(".timeline li"), newListItem);
        const newPos = placedListItems.indexOf(curIndex);
        const posDiff = newPos - curPos;
        const nodePositionDiff = posDiff * 140 + Math.sign(posDiff) * 70;

        setTimeout(() => {
          newListItem.style.cssText = "--moveto: " + nodePositionDiff + "px";
          setTimeout(() => {
            newListItem.removeAttribute("style");
            if(newPos == placedListItems.length - 1) {
              q(".timeline").appendChild(newListItem);
            }
            else {
              if(curPos > newPos) q(".timeline").insertBefore(newListItem, q(".timeline").children[newPos]);
              else q(".timeline").insertBefore(newListItem, q(".timeline").children[newPos + 1]);
            }
          }, 500);
        }, 500);
      }
      else {
        score++;
      }
      drawCurScore();
      if(clientItems.length > 0) {
        createPrompt();
      }
      else {
        q(".prompt").remove();
      }
    }
    setTimeout(() => {
      q(".transition")?.classList.remove("transition");
    }, 1000);
    lastHoverSpot = [];
  }

  document.addEventListener("pointermove", onPointerMove);
  promptNode.addEventListener("pointerup", onPointerUp);
}

window.addEventListener("DOMContentLoaded", () => {
  q(".prompt").addEventListener("pointerdown", (e) => dragPrompt(e));
  q(".prompt").addEventListener("dragstart", (e) => {
    return false;
  });
  q(".timeline-wrapper").addEventListener("pointermove", (ev) => {
    if(!boolIsGrabbing) {
      if(ev.clientY < q(".timeline-wrapper").getBoundingClientRect().top + 40 || ev.clientY > q(".timeline-wrapper").getBoundingClientRect().bottom - 40) {
        doListScroll(ev, false);
      }
      else {
        if(boolIsScrolling) doListScroll(ev, true);
      }
    }
  });
  q(".timeline-wrapper").addEventListener("pointerleave", (ev) => {
    if(!boolIsGrabbing && boolIsScrolling) {
      doListScroll(ev, true);
    }
  });

  initialize();
});
