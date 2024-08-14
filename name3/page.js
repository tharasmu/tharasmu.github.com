const setup = (data) => {
  const form_el = document.createElement("form");
  form_el.id = "categories";

  data.forEach(question_category => {
    const btn = document.createElement("input");
    btn.setAttribute("type", "button");
    btn.classList.add("category-toggle");
    btn.name = "cat_" + question_category.label;
    btn.value = question_category.label;
    if(question_category.label === "basic") btn.classList.add("selected");
    form_el.appendChild(btn);
  })

  update_question_pool();
  q("#categories").replaceWith(form_el);
}

let data;
let b_multi_category = false;
let active_category = "cat_basic";
let b_enable_timer = true;
let timer_size = 5;
let active_timer = null;
let timer_index = 1;
const multi_category = [];
let pool = [];

const timer_text_el = q(".timer-text");
const timer_indicator_el = q("#timer-indicator");
const question_el = q("#question");

const reset_categories = () => {
  qa(".category-toggle.selected").forEach(btn => btn.classList.remove("selected"));
  multi_category.splice(0, multi_category.length);
  active_category = null;
  update_question_pool();
}

const update_question_pool = () => {
  pool = [];
  if(b_multi_category) {
    if(multi_category.length > 0) {
      multi_category.forEach(category => {
        pool = pool.concat(data.find((el) => el.label === category.slice(4)).array);
      })
    }
  } else {
    if(active_category === null) return;
    pool = data.find((el) => el.label === active_category.slice(4)).array;
  }
}

const draw_question = (question_text) => {
  if(active_timer !== null) clearInterval(active_timer);
  question_el.innerText = question_text;
  if(timer_text_el.classList.contains("expired")) timer_text_el.classList.remove("expired");
  if(timer_indicator_el.classList.contains("in-progress")) timer_indicator_el.classList.remove("in-progress");
  if(timer_indicator_el.classList.contains("has-completed")) timer_indicator_el.classList.remove("has-completed");

  timer_indicator_el.classList.add("no-animate");
  timer_indicator_el.offsetHeight;

  if(question_el.classList.contains("expired")) question_el.classList.remove("expired");
  if(b_enable_timer) {
    timer_index = timer_size;
    timer_indicator_el.classList.add("in-progress");
    timer_indicator_el.classList.remove("no-animate");
    timer_indicator_el.style = `--timer-duration: ${timer_size}s`;
    timer_text_el.innerText = timer_index + " s";
    active_timer = setInterval(() => {
      if(timer_index === 1) {
        clearInterval(active_timer);
        timer_text_el.innerText = "expired";
        timer_text_el.classList.add("expired");
        question_el.classList.add("expired");
        timer_indicator_el.classList.remove("in-progress");
        timer_indicator_el.classList.add("has-completed");
      } else {
        timer_index--;
        timer_text_el.innerText = timer_index + " s";
      }
    }, 1000);
  } else {
    timer_text_el.innerText = "";
  }
}

const new_question = () => {
  // console.log(pool);
  const pick = Math.floor(Math.random() * pool.length);
  const question_to_ask = pool[pick];
  if(pool.length > 0) {
    pool.splice(pick, 1);
  } else {
    alert("No more questions in that category!");
  }
  draw_question(question_to_ask);
}

document.addEventListener("DOMContentLoaded", async() => {
  data = (await fetch("data.json").then(result => result.json())).categories;
  console.log(data);
  let question_count = 0;
  data.forEach(el => {
    question_count += el.array.length;
  });
  console.log("Total number of questions: " + question_count);
  setup(data);
});

q("#timer_size").addEventListener("input", (e) => {
  q(".range-desc").animate([
    { opacity: 0 }, { opacity: 1 }
  ], {
    duration: 150
  })
  q(".range-desc").innerText = e.target.value + "s";
  timer_size = e.target.value;
})

q("#category_multi").addEventListener("change", (e) => {
  b_multi_category = e.target.checked;
  reset_categories();
})

q("#timer_toggle").addEventListener("change", (e) => {
  b_enable_timer = e.target.checked;
})

document.addEventListener("click", (e) => {
  if(e.target.closest(".category-toggle")) {
    let target = e.target.closest(".category-toggle");
    if(b_multi_category) {
      if(multi_category.includes(target.name)) {
        const cat_index = multi_category.indexOf(target.name);
        multi_category.splice(cat_index, 1);
        q(`[name="${target.name}"]`).classList.remove("selected");
      } else {
        multi_category.push(target.name);
        q(`[name="${target.name}"]`).classList.add("selected");
      }
    } else {
      if(active_category !== target.name) {
        active_category = target.name;
        qa(".category-toggle.selected").forEach(btn => {
          btn.classList.remove("selected");
        })
        target.classList.add("selected");
      }
    }
    update_question_pool();
  } else if(e.target.closest("#new_question")) {
    new_question();
  }
})