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

function getRandomItem(arr) {
  const index = Math.floor((Math.random() * (arr.length - 1)));
  return index;
}

function createPrompt() {
  const promptNode = q(".prompt");
  curPromptIndex = getRandomItem(clientItems);
  q(".prompt").innerText = clientItems[curPromptIndex][0];
  q(".prompt").dataset.step = items.indexOf(clientItems[curPromptIndex]);
  clientItems.splice(curPromptIndex, 1);
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
  drawCurScore();
  createPrompt();
}

let lastHoverSpot = [];

function doListScroll(ev, boolIsStopCommand) {
  if(boolIsStopCommand) {
    const curScrollAmount = window.getComputedStyle(q(".timeline")).getPropertyValue("transform");
    q(".timeline").style.transform = curScrollAmount;
    boolIsScrolling = false;
  }
  else {
    const boolScrollDirectionUp = ev.clientY < q(".timeline-wrapper").offsetHeight/2 ? true : false;
    const scrollAmountSign = boolScrollDirectionUp ? 1 : -1;
    const timelineElementHeight = q(".timeline").offsetHeight;
    const timelineGapAmount = parseInt(window.getComputedStyle(q(".timeline")).getPropertyValue("gap"));
    scrollExtremeValue = 100 + qa(".timeline li").length * q(".timeline li").offsetHeight + ((qa(".timeline li").length - 1) * timelineGapAmount);
    boolIsScrolling = true;
    if(scrollExtremeValue > timelineElementHeight) {
      q(".timeline").style.cssText = "--scroll-target: " + (scrollAmountSign * 100 + scrollAmountSign * ((scrollExtremeValue - timelineElementHeight)/2 + timelineGapAmount)) + "px";
      q(".timeline").dataset.scroll = true;
    }
  }
}

function animateTimelineHover(node, boolPromptHoverBelow) {
  if(boolPromptHoverBelow) {
    if(node.nextElementSibling !== null) node.nextElementSibling.style.transform = "translateY(10px)";
    node.style.transform = "translateY(-10px)";
  }
  else {
    if(node.previousElementSibling !== null) node.previousElementSibling.style.transform = "translateY(-10px)";
    node.style.transform = "translateY(10px)";
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
    if(document.elementFromPoint(ev.clientX, ev.clientY).closest(".timeline-wrapper") !== null) {
      if(ev.clientY < q(".timeline-wrapper").getBoundingClientRect().top + 40 || ev.clientY > q(".timeline-wrapper").getBoundingClientRect().bottom - 40) {
        doListScroll(ev, false);
      }
      else {
        doListScroll(ev, true);
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
      const stepToPlace = Number(q(".prompt").dataset.step);
      const stepSpot = Number(lastHoverSpot[0].dataset.step);

      const stepSpotIsAllowed = () => {
        return lastHoverSpot[1] ? stepToPlace < stepSpot : stepSpot < stepToPlace;
      }
      const stepSiblingIsAllowed = () => {
        if(lastHoverSpot[1] && lastHoverSpot[0].nextElementSibling) return Number(lastHoverSpot[0].nextElementSibling.dataset.step) < stepToPlace;
        else if(!lastHoverSpot[1] && lastHoverSpot[0].previousElementSibling) return Number(lastHoverSpot[0].previousElementSibling.dataset.step) > stepToPlace;
        else return true;
      }

      const boolIsAllowed = (stepSpotIsAllowed() == true && stepSiblingIsAllowed() == true ? true : false);
      const newListItem = newElement("li", {"data-step": stepToPlace}, [newElement("span", {text: q(".prompt").innerText}), newElement("span", {text: items[stepToPlace][2] + items[startIndex][1]})]);
      newListItem.classList.add("transition");
      newListItem.classList.add(boolIsAllowed ? "w" : "l");
      if(lastHoverSpot[1]) {
        q(".timeline").insertBefore(newListItem, lastHoverSpot[0].nextElementSibling);
      }
      else {
        q(".timeline").insertBefore(newListItem, lastHoverSpot[0]);
      }
      if(!boolIsAllowed) {
        const timeline = qa(".timeline li");
        const arr = [];
        timeline.forEach(item => arr.push(Number(item.dataset.step)));
        arr.sort((a, b) => {
          return b - a;
        });
        const curPos = Array.prototype.indexOf.call(timeline, newListItem);
        const newPos = arr.indexOf(stepToPlace);
        const diff = (newPos - curPos) * 140 + Math.sign(newPos - curPos) * 70;

        setTimeout(() => {
          newListItem.style.cssText = "--moveto: " + diff + "px";
          setTimeout(() => {
            newListItem.removeAttribute("style");
            if(newPos == arr.length - 1) q(".timeline").appendChild(newListItem);
            else {
              q(".timeline").insertBefore(newListItem, q(".timeline li[data-step=\"" + arr[newPos + 1] + "\"]"));
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
  // q(".timeline li").addEventListener("dragover", (e) => dragOverListener(e));
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
        doListScroll(ev, true);
      }
    }
  });

  initialize();
});
