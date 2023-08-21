// ==>> Quering The DOM
// Buttons
const ADD_BOARD_BTN = document.getElementById("create_board_btn");
const ADD_COLUMN_BTN = document.getElementById("add_col_big_btn");
const ADD_TASK_BTN = document.getElementById("add_task_btn");
const ADD_SUBTASK_BTN = document.getElementById("add_subtask_btn");
// Overlays
const BOARDS_FORM_OVERLAY = document.getElementById("board_overlay");
const COLUMN_FORM_OVERLAY = document.getElementById("column_overlay");
const TASKS_FORM_OVERLAY = document.getElementById("tasks_overlay");
const VIEW_TASK_OVERLAY = document.getElementById("view_task_overlay");
const CONFIRM_DEL_OVERLAY = document.getElementById("confirm_delete");
// Forms
const BOARD_FORM = document.getElementById("board_form");
const COLUMN_FORM = document.getElementById("column_form");
const TASK_FORM = document.getElementById("task_form");
// Context Menus
const MAIN_CM = document.getElementById("main_contextmenu");
const APP_CM = document.getElementById("app_contextmenu");
// Others
const MAIN_BOARD_CONTENT = document.getElementById("main_board_content");
const BOARDS_LIST = document.getElementById("boards_list");
const COLORS_BOX = document.getElementById("colors_box");
const SUBTASKS_BOX = document.getElementById("subtasks_box");
const VIEW_TASK_POPUP = document.getElementById("view_task_popup");
const TASK_VIEW_POPUP_SUBTASKS_LIST = document.querySelector(".view-task-popup .subtasks-box .subtasks-list");
const CONFIRM_DEL_BTNS = document.getElementById("confirm_delete_btns");
const VIEW_TASK_OPT_BTN = document.getElementById("view_task_opt_btn");
const STATUS_SELECT_BOX_VIEW_TASK = document.getElementById("status_select_box_view_task");
const LOADING_OVERLAY = document.getElementById("loading_overlay");



// ==>> Helping Variables
let defSettings = {theme: "dark", hide_side_nav: false, colors_arr: ["#64e3b0", "#48c3e6", "#8472f0"]};
let startingData = {app_nested_data: [], cols_data: {}, tasks_data: {}, app_settings: defSettings};
let mainData = JSON.parse(localStorage.getItem("kanban_app")) || startingData;


// ==>> Setting Up The App
// Build The Board LIs
mainData.app_nested_data.forEach(obj => createBoardLI(obj));
// Get The Last Opened Board
let lastOpendBoardObj = mainData.app_nested_data.find(obj => obj.last_opened);
// Update The Board Content
if (lastOpendBoardObj) {
  updateBoardContent(lastOpendBoardObj);
} else LOADING_OVERLAY.classList.add("hide");
// Create The Color Radio Inputs
createColorRadioInp();



// ==>> Overlays Functions And Events
// => Showing And Hiding Overlays
// BOARDS_FORM_OVERLAY
ADD_BOARD_BTN.addEventListener("click", () => showOverlay(BOARDS_FORM_OVERLAY));
// COLUMN_FORM_OVERLAY
ADD_COLUMN_BTN.addEventListener("click", () => showOverlay(COLUMN_FORM_OVERLAY));
// TASKS_FORM_OVERLAY
ADD_TASK_BTN.addEventListener("click", () => {
  if (document.querySelectorAll(".col").length >= 1) showOverlay(TASKS_FORM_OVERLAY);
  else createNotif("warning", "There Is No Column To Add Task In");
});
// Hide The Overlays
document.addEventListener("mousedown", e => {
  if (e.target.classList.contains("overlay")) hideOverlay(e.target);
});
// Show Overlay Fucntion
function hideOverlay(overlay) {
  // Hide The Overlay
  overlay.classList.remove("show");
  // Check For The Target Overlay Popup
  if (!overlay.querySelector(".popup").classList.contains("view-task-popup")) {
    // Reset The Form If The Target Is Not The View Task Data Popup
    let targetForm = overlay.querySelector("form");
    if (targetForm) {
      setTimeout(() => {
        let closestPopup = targetForm.closest(".popup");
        closestPopup.classList.remove("update-mode");
        closestPopup.dataset.update = "";
        targetForm.reset();
        [...SUBTASKS_BOX.querySelectorAll(".new-subtask")].forEach(el => el.remove());
      }, 200);
    }
    setTimeout(() => overlay.classList.add("dn-inp"), 200);
  } else setTimeout(() => overlay.querySelector(".read-more-des").checked = false, 200);
}
// Hide Overlay Fucntion
function showOverlay(overlay, updateMode = false) {
  overlay.classList.remove("dn-inp");
  overlay.classList.add("show");
  overlay.querySelector("form input[type=text]").focus();
  updateMode && overlay.querySelector(".popup").classList.add("update-mode");
  if (overlay.id === "tasks_overlay") {
    SUBTASKS_BOX.textContent = "";
    ["e.g. Make coffee", "e.g. Drink coffee & smile"].forEach(ph => craeteSubtasksInpFunc("", ph));
  }
}


// ==>> Creating The App Data
// => Creating Boards Data
function createBoardData(boardName) {
  let obj = {
    board_id: Math.random().toString(32).slice(2, 12),
    board_name: boardName,
    cols_ids_arr: [],
    hide_big_btn: false,
    last_opened: false,
  };
  mainData.app_nested_data.push(obj);
  saveData();
  return obj;
}
// => Creating Columns Data
function createColumnData(colName, colColor) {
  let columnId = Math.random().toString(32).slice(2, 8);
  let obj = {
    col_name: colName,
    col_color: colColor,
    tasks_ids_arr: [],
  };
  mainData.cols_data[columnId] = obj;
  mainData.app_nested_data.find(obj => obj.board_id === MAIN_BOARD_CONTENT.dataset.boardId).cols_ids_arr.push(columnId);
  saveData();
  return {columnId, data: obj};
}
// => Creating Tasks Data
function createTaskData(data) {
  let {title, des, subtasksArr, colId} = data;
  let taskId = Math.random().toString(32).slice(2, 8);
  let obj = {
    task_title: title,
    task_des: des,
    target_col_id: colId,
    subtasks_arr: [],
  };
  mainData.cols_data[colId].tasks_ids_arr.push(taskId);
  mainData.tasks_data[taskId] = obj;
  subtasksArr.forEach(subtask => createSubtaskData(subtask, taskId));
  saveData();
  return {taskId, data: obj};
}
// => Creating Subtasks Data
function createSubtaskData(subtaskText, taskId) {
  let obj = {
    subtask_id: Math.random().toString(32).slice(2, 8),
    subtask_text: subtaskText.text,
    completed: subtaskText.checked === "on",
  };
  mainData.tasks_data[taskId].subtasks_arr.push(obj);
}



// ==>> Adding And Updating Data On Submiting Forms
// => Add And Update Board Data
BOARD_FORM.addEventListener("submit", e => {
  e.preventDefault();
  let val = e.target.board_name.value.trim();
  let cond = [...BOARDS_LIST.querySelectorAll(".board-li")].map(el => el.innerText).some(text => text === val);
  // Check For Form Validation
  if (val !== "" && !cond) {
    // Check For Update Mode
    if (!e.target.parentElement.classList.contains("update-mode")) {
      let boardDataObj = createBoardData(val);
      createBoardLI(boardDataObj);
      hideOverlay(BOARDS_FORM_OVERLAY);
      createNotif("success", "Board Created Successfully");
    } else { // Update Mode
      // Helping Variables
      let targetId = MAIN_CM.dataset.id;
      // Update DOM
      document.querySelector(`.board-li[data-id="${targetId}"]`).innerText = val;
      if (MAIN_BOARD_CONTENT.dataset.boardId === targetId) document.getElementById("board_name").innerText = val;
      hideOverlay(BOARDS_FORM_OVERLAY);
      createNotif("success", "Board Updated Successfully");
      // Update Data
      mainData.app_nested_data.find(obj => obj.board_id === targetId).board_name = val;
      saveData();
    }
  } else if (cond) createNotif("warning", "This Name Has Taken");
});
// => Add And Update Column Data
COLUMN_FORM.addEventListener("submit", e => {
  e.preventDefault();
  // Create Column Data
  let colName = e.target.column_name.value.trim();
  let colColor = e.target.col_status_color.value;
  // Check For Form Validation
  if (colName !== "" && colColor !== "") {
    // Check For Update Mode
    if (!e.target.parentElement.classList.contains("update-mode")) {
      let colData = createColumnData(colName, colColor);
      createColumnDOM(colData);
      hideOverlay(COLUMN_FORM_OVERLAY);
      createNotif("success", "Column Created Successfully");
    } else { // Update Mode
      // Helping Variables
      let targetId = MAIN_CM.dataset.id;
      let targetColEl = document.querySelector(`.col[data-id="${targetId}"]`);
      let colNameEl = targetColEl.querySelector("header .col-name");
      // Update DOM
      targetColEl.style.setProperty("--col-color", colColor);
      colNameEl.innerText = colName;
      hideOverlay(COLUMN_FORM_OVERLAY);
      createNotif("success", "Column Updated Successfully");
      // Update Data
      mainData.cols_data[targetId].col_name = colName;
      mainData.cols_data[targetId].col_color = colColor;
      saveData();
      // Update Column Select Boxs Options
      createColumnSelectBoxOpt();
    }
  }
});
// => Add And Update Task And Subtasks Data
TASK_FORM.addEventListener("submit", e => {
  e.preventDefault();
  // Create Column Data
  let obj = {
    title: e.target.task_title_inp.value.trim(),
    des: e.target.task_des_inp.value.trim(),
    subtasksArr: [...SUBTASKS_BOX.querySelectorAll("input[type=text]")].map(inp => {
      return {text: inp.value.trim(), checked: inp.dataset.checked};
    }).filter(obj => obj.text !== ""),
    colId: e.target.status_select_box.value,
  };
  // Check For Form Validation
  if (!Object.values(obj).some(val => val === "") && obj.subtasksArr.length >= 1) {
    // Check For Update Mode
    if (!e.target.parentElement.classList.contains("update-mode")) {
      let taskData = createTaskData(obj);
      createTaskDOM(taskData);
      hideOverlay(TASKS_FORM_OVERLAY);
      createNotif("success", "Task Created Successfully");
    } else { // Update Mode
      // Helping Variables
      let targetId = MAIN_CM.dataset.id;
      let targetTaskObj = mainData.tasks_data[targetId];
      let targetColObj = mainData.cols_data[targetTaskObj.target_col_id];
      let targetTaskEl = document.querySelector(`.task[data-id="${targetId}"]`);
      let targetColEl = document.querySelector(`.col[data-id="${obj.colId}"] .tasks-list`);
      let doneSubtasksNum = obj.subtasksArr.filter(obj => obj.checked === "on");
      // Update DOM
      targetTaskEl.querySelector("p").innerText = obj.title;
      targetTaskEl.querySelector("span").innerText = dynamicNumbering("task", {completedNum: doneSubtasksNum.length, wholeNum: obj.subtasksArr.length});
      hideOverlay(TASKS_FORM_OVERLAY);
      createNotif("success", "Task Updated Successfully");
      // If Column Has Update
      if (mainData.tasks_data[targetId].target_col_id !== obj.colId) {
        // Update The DOM
        targetColEl.appendChild(targetTaskEl);
        // Update The Data
        targetColObj.tasks_ids_arr = targetColObj.tasks_ids_arr.filter(id => id !== targetId);
        mainData.cols_data[obj.colId].tasks_ids_arr.push(targetId);
        targetTaskObj.target_col_id = obj.colId;
      }
      // Update Data
      targetTaskObj.task_title = obj.title;
      targetTaskObj.task_des = obj.des;
      targetTaskObj.subtasks_arr = [];
      obj.subtasksArr.forEach(obj => createSubtaskData(obj, targetId));
      saveData();
    }
  }
});



// ==>> Create The DOM Of The Data
// => Create Board LI
function createBoardLI(obj) {
  const LI = document.createElement("li");
  LI.className = `board-li${obj.last_opened ? " active" : ""}`;
  LI.dataset.id = obj.board_id;
  LI.textContent = obj.board_name;
  BOARDS_LIST.appendChild(LI);
  if (LI.clientWidth < LI.scrollWidth) LI.title = obj.board_name;
  boards_num.childNodes[1].nodeValue = BOARDS_LIST.querySelectorAll(".board-li").length;
}
// => Create Column DOM
function createColumnDOM(obj) {
  // Get The Data From The "obj" Using Destructuring Feature
  let {columnId, data: {col_name, col_color, tasks_ids_arr}} = obj;
  // Create Column Elements
  const COLUMN = document.createElement("div");
  const COLUMN_HEADER = document.createElement("header");
  const COLUMN_CIRCLE_COLOR = document.createElement("span");
  const COLUMN_NAME = document.createElement("span");
  const COLUMN_HEADER_TEXT = document.createTextNode(dynamicNumbering("col", tasks_ids_arr.length));
  const TASKS_LIST = document.createElement("ul");
  const NO_DATA_MSG = document.createElement("li");
  // Setting The Attributes And Textcontent
  COLUMN.className = "col";
  COLUMN.dataset.id = columnId;
  COLUMN.style = `--col-color:${col_color};`;
  COLUMN_HEADER.className = "col-header";
  COLUMN_CIRCLE_COLOR.className = "circle";
  COLUMN_NAME.className = "col-name";
  COLUMN_NAME.innerText = col_name;
  TASKS_LIST.className = "tasks-list";
  TASKS_LIST.dataset.id = columnId;
  NO_DATA_MSG.className = "no-data-msg";
  NO_DATA_MSG.innerText = "No Tasks";
  // Appending Elements
  COLUMN_HEADER.append(COLUMN_CIRCLE_COLOR, COLUMN_NAME, COLUMN_HEADER_TEXT);
  TASKS_LIST.appendChild(NO_DATA_MSG);
  COLUMN.append(COLUMN_HEADER, TASKS_LIST);
  MAIN_BOARD_CONTENT.insertBefore(COLUMN, ADD_COLUMN_BTN);
  // Creating Tasks
  tasks_ids_arr.forEach(id => {
    let obj = {taskId: id, data: mainData.tasks_data[id]};
    createTaskDOM(obj);
  });
  // Create Column Select Box Option
  createColumnSelectBoxOpt();
}
// => Create Task DOM
function createTaskDOM(obj) {
  let {taskId, data: {task_title, subtasks_arr, target_col_id}} = obj;
  const targetCol = document.querySelector(`div.col[data-id="${target_col_id}"]`);
  let comSubTasks = subtasks_arr.filter(subTask => subTask.completed);
  // Create Task Elements
  const TASK_LI = document.createElement("li");
  const TASK_P = document.createElement("p");
  const TASK_SPAN = document.createElement("span");
  // Setting Attributes And TextContent
  TASK_LI.className = "task";
  TASK_LI.tabIndex = 1;
  TASK_LI.dataset.id = taskId;
  TASK_LI.draggable = true;
  TASK_P.textContent = task_title;
  TASK_SPAN.textContent = dynamicNumbering("task", {completedNum: comSubTasks.length, wholeNum: subtasks_arr.length});
  // Append Elements
  TASK_LI.append(TASK_P, TASK_SPAN);
  targetCol.querySelector(".tasks-list").appendChild(TASK_LI);
  // Update The Column Tasks Number
  let {tasks_ids_arr} = mainData.cols_data[target_col_id];
  targetCol.querySelector(".col-header").childNodes[2].nodeValue = dynamicNumbering("col", tasks_ids_arr.length);
}



// ==>> Update Board By Click The Board LIs
BOARDS_LIST.addEventListener("click", e => {
  if (e.target.classList.contains("board-li")) {
    // Change The Active Board LI
    BOARDS_LIST.querySelectorAll(".board-li").forEach(el => el.classList.remove("active"));
    e.target.classList.add("active");
    // Update Board Content
    let targetBoard = mainData.app_nested_data.find(obj => obj.board_id === e.target.dataset.id);
    updateBoardContent(targetBoard);
    // Update The Last Opened Board Data
    mainData.app_nested_data.forEach(obj => obj.last_opened = false);
    mainData.app_nested_data.find(obj => obj.board_id === e.target.dataset.id).last_opened = true;
    saveData();
  }
});



// ==>> Create Subtasks Inputs In "TASK_FORM"
// => Create Subtasks Inputs In The "TASK_FORM" On Click "ADD_SUBTASK_BTN"
ADD_SUBTASK_BTN.addEventListener("click", () => craeteSubtasksInpFunc().select());
// => Create Subtasks Input Function
function craeteSubtasksInpFunc(val = "", placeholder = "e.g. Wash the cup", checked = "off") {
  // Add Subtask Input
  const SUBTASK_LI = document.createElement("li");
  const SUBTASK_INP = document.createElement("input");
  const DEL_SUBTASK_ICO = document.createElement("i");
  // Setting Attributes
  SUBTASK_LI.className = "subtask-li new-subtask";
  SUBTASK_INP.type = "text";
  SUBTASK_INP.autocomplete = "off";
  SUBTASK_INP.dataset.checked = checked;
  SUBTASK_INP.placeholder = placeholder;
  DEL_SUBTASK_ICO.className = "fa-solid fa-xmark del-task";
  // Appending Elements
  SUBTASK_LI.append(SUBTASK_INP, DEL_SUBTASK_ICO);
  SUBTASKS_BOX.appendChild(SUBTASK_LI);
  SUBTASKS_BOX.scrollTop = SUBTASKS_BOX.scrollHeight;
  SUBTASK_INP.value = val;
  return SUBTASK_INP;
}
// => Delete Subtasks Inputs Using Function Delegation
SUBTASKS_BOX.addEventListener("click", e => {
  // Check If The Target Button It Delete
  if (!e.target.classList.contains("del-task")) return;
  // Check If It's The Last Subtask
  if (SUBTASKS_BOX.childElementCount > 1) {
    e.target.parentElement.remove();
  } else createNotif("warning", "You Should At Least Have One Subtask");
});


// ==>> Color Radio Input In The Add New Column Form
// => Create Color Radio Input
function createColorRadioInp() {
  // Clear All The Color Radio Inputs Before Adding It Again
  COLORS_BOX.textContent = "";
  // Looping Throw The Last Eight Colors In The "mainData" To Create Color Inputs
  let targetColors = mainData.app_settings.colors_arr.slice(-8);
  targetColors.forEach(color => {
    const RADIO_INPUT = document.createElement("input");
    RADIO_INPUT.type = "radio";
    RADIO_INPUT.name = "col_status_color";
    RADIO_INPUT.style = `--radio-color:${color}`;
    RADIO_INPUT.value = color;
    COLORS_BOX.appendChild(RADIO_INPUT);
  });
}
// => Create Color Radio Input When Listening To Input Event In "color_inp"
COLUMN_FORM.color_inp.addEventListener("change", e => {
  // Add The Color To The Data
  mainData.app_settings.colors_arr.push(e.target.value);
  saveData();
  // Create The Colors Radio Inputs
  createColorRadioInp();
  // Check The Last Added Color Radio Input
  COLORS_BOX.querySelector("input[type=radio]:last-of-type").checked = true;
});
// => Remove Color Radio Input When Listening To Contextmenu Event (Right_Click) In "COLORS_BOX"
COLORS_BOX.addEventListener("contextmenu", e => {
  if (e.target.tagName !== "INPUT") return;
    e.preventDefault();
    let colorInputsNum = COLORS_BOX.querySelectorAll("input[type=radio]").length;
    if (colorInputsNum >= 4) {
      let targetColor = e.target.value;
      mainData.app_settings.colors_arr = mainData.app_settings.colors_arr.filter(color => color !== targetColor);
      createColorRadioInp();
      saveData();
    } else createNotif("warning", "You Should Have At Least 3 Colors");
});



// ==>> Show Task Data
// => Show Task Data On Double Click The Task Using Function Delegation
MAIN_BOARD_CONTENT.addEventListener("click", e => {
  // Check If The Target Element Is A Task
  if (e.target.classList.contains("task")) {
    // Update View Task Popup
    let {task_title, task_des, subtasks_arr, target_col_id} = mainData.tasks_data[e.target.dataset.id];
    VIEW_TASK_POPUP.querySelector(".title-box p").innerText = task_title;
    VIEW_TASK_POPUP.querySelector('.task-des').innerHTML = task_des.replace(/(?:(?:http|https):\/\/)?(?:www\.)?[a-zA-Z0-9]+\.[a-zA-Z]+(?:\.[a-zA-Z]+)?(?:\/[\w\d\-\._~:\/\?#\[\]@!\$&'\(\)\*\+,;=]*)?/gim, str => `<a href="${str}" target="blank">${str}</a>`);
    VIEW_TASK_POPUP.querySelector('.subtasks-num-info').innerText = dynamicNumbering("task", {completedNum: subtasks_arr.filter(obj => obj.completed).length, wholeNum: subtasks_arr.length});
    STATUS_SELECT_BOX_VIEW_TASK.value = target_col_id;
    // Clear The Subtasks List Before Adding The Subtasks
    TASK_VIEW_POPUP_SUBTASKS_LIST.textContent = "";
    // Create The Subtasks
    subtasks_arr.forEach(obj => createSubtaskFunc(obj));
    // Show The View Tasks Overlay
    VIEW_TASK_OVERLAY.className = "overlay show";
    VIEW_TASK_POPUP.dataset.id = e.target.dataset.id;
    // Show Read More Button
    let textContent = VIEW_TASK_POPUP.querySelector('.task-des');
    if (textContent.scrollHeight > textContent.clientHeight) {
      VIEW_TASK_POPUP.classList.add("read-more");
    } else VIEW_TASK_POPUP.classList.remove("read-more");
  }
});
// => Create Subtasks Function
function createSubtaskFunc(obj) {
  let {subtask_id, subtask_text, completed} = obj;
  // Create Subtask Elements
  const SUBTASK_LI = document.createElement("li");
  const CHECKBOX_INP = document.createElement("input");
  const SUBTASK_TEXT_BOX = document.createElement("div");
  const SUBTASK_TEXT = document.createElement("p");
  const READ_MORE_BTN = document.createElement("input");
  // Setting The Attributes And The TextContent
  SUBTASK_LI.className = "subtask";
  SUBTASK_LI.dataset.id = subtask_id;
  CHECKBOX_INP.type = "checkbox";
  CHECKBOX_INP.className = "completed-check";
  CHECKBOX_INP.checked = completed;
  SUBTASK_TEXT_BOX.className = "subtask-text-box";
  SUBTASK_TEXT.innerText = subtask_text;
  READ_MORE_BTN.className = "read-more-btn";
  READ_MORE_BTN.type = "checkbox";
  // Appending Children
  SUBTASK_TEXT_BOX.append(SUBTASK_TEXT, READ_MORE_BTN);
  SUBTASK_LI.append(CHECKBOX_INP, SUBTASK_TEXT_BOX);
  TASK_VIEW_POPUP_SUBTASKS_LIST.appendChild(SUBTASK_LI);
  if (SUBTASK_TEXT.clientWidth < SUBTASK_TEXT.scrollWidth) SUBTASK_LI.classList.add("read-more");
}
// => "TASK_VIEW_POPUP_SUBTASKS_LIST" Listen To Click Event To Target Subtasks Checkboxs Using Function Delegation
TASK_VIEW_POPUP_SUBTASKS_LIST.addEventListener("input", e => {
  // Get The Target Task
  let targetTask = mainData.tasks_data[VIEW_TASK_POPUP.dataset.id];
  // Checkboxs Manipulation
  if (e.target.classList.contains("completed-check")) {
    let parentEl = e.target.parentElement;
    parentEl.querySelector(".read-more-btn").checked = false;
    // Update Data
    targetTask.subtasks_arr.find(obj => obj.subtask_id === parentEl.dataset.id).completed = e.target.checked;
  } else {
    let parentEl = e.target.closest(".subtask");
    e.target.closest(".subtask").querySelector(".completed-check").checked = false;
    // Update Data
    targetTask.subtasks_arr.find(obj => obj.subtask_id === parentEl.dataset.id).completed = false;
  }
  // Update The Number Of Subtasks Progress
  let completedSubtasksNum = targetTask.subtasks_arr.filter(obj => obj.completed).length;
  let tasksNum = dynamicNumbering("task", {completedNum: completedSubtasksNum, wholeNum: targetTask.subtasks_arr.length});
  document.querySelector(`.col .tasks-list li[data-id="${VIEW_TASK_POPUP.dataset.id}"] > span`).innerText = tasksNum;
  document.querySelector(".subtasks-box .subtasks-num-info").innerText = tasksNum;
  // Saving Data
  saveData();
});
// => "VIEW_TASK_OPT_BTN" Listen To Click Event
VIEW_TASK_OPT_BTN.addEventListener("click", () => {
  MAIN_CM.dataset.type = "task";
  MAIN_CM.dataset.id = VIEW_TASK_POPUP.dataset.id;
  MAIN_CM.classList.add("show");
  // Set Position
  let xPos = VIEW_TASK_OPT_BTN.offsetLeft + 152 < innerWidth ? VIEW_TASK_OPT_BTN.offsetLeft + 8 : VIEW_TASK_OPT_BTN.offsetLeft + 24 - 120;
  let yPos = VIEW_TASK_OPT_BTN.offsetTop + 32;
  let xOrigin = VIEW_TASK_OPT_BTN.offsetLeft + 152 < innerWidth ? "left" : "right";
  MAIN_CM.setAttribute("style", `top:${yPos}px; left:${xPos}px; transform-origin:${xOrigin} top;`);
});
// => "STATUS_SELECT_BOX_VIEW_TASK" Listen To Change Event
STATUS_SELECT_BOX_VIEW_TASK.addEventListener("change", e => {
  let targetTaskObj = mainData.tasks_data[VIEW_TASK_POPUP.dataset.id];
  let targetColObj = mainData.cols_data[targetTaskObj.target_col_id];
  // If Column Has Update
  if (targetTaskObj.target_col_id !== e.target.value) {
    let targetTaskEl = document.querySelector(`.task[data-id="${VIEW_TASK_POPUP.dataset.id}"]`);
    let targetColEl = document.querySelector(`.col[data-id="${e.target.value}"] .tasks-list`);
    // Update The DOM
    targetColEl.appendChild(targetTaskEl);
    // // Update The Data
    targetColObj.tasks_ids_arr = targetColObj.tasks_ids_arr.filter(id => id !== VIEW_TASK_POPUP.dataset.id);
    mainData.cols_data[e.target.value].tasks_ids_arr.push(VIEW_TASK_POPUP.dataset.id);
    targetTaskObj.target_col_id = e.target.value;
    createNotif("success", "The Column Has Changed Successfully");
    saveData();
  }
});



// ==>> Contextmenu Functions And Events
// => Hiding Contextmenu
document.addEventListener("mouseup", () => hideCm());
window.addEventListener("blur", () => hideCm());
function hideCm() {
  const CM = document.querySelector(".cm.show");
  CM && CM.classList.remove("show");
}
// => Show Contextmenu Function
document.addEventListener("contextmenu", e => {
  if (e.target.tagName !== "TEXTAREA" && e.target.tagName !== "INPUT") {
    e.preventDefault();
    if (e.target.classList.contains("task") || e.target.classList.contains("board-li") || e.target.classList.contains("col")) {
      let type = e.target.classList.contains("task") ? "task" : e.target.classList.contains("board-li") ? "board" : "col";
      MAIN_CM.dataset.type = type;
      showTargetContextmenu(e, MAIN_CM);
    } else showTargetContextmenu(e, APP_CM);
  }
});
// => Show A Target Contextmenu
function showTargetContextmenu(e, targetMenu) {
  // Add Contextmenu Popup Transition Effect
  targetMenu.classList.add("show");
  // Get The Width And Height For The Contextmenu
  let width = targetMenu.id === "main_contextmenu" ? 120 : 160;
  // Update Transform Origins
  let xOrigin = innerWidth - width > e.clientX ? "left" : "right";
  let yOrigin = innerHeight - 94.4 > e.clientY ? "top" : "bottom";
  // Update Positions
  let xPos = innerWidth - width > e.clientX ? e.clientX : e.clientX - width;
  let yPos = innerHeight - 94.4 > e.clientY ? e.clientY : e.clientY - 94.4;
  // Update Styles
  targetMenu.setAttribute("style", `top:${yPos}px; left:${xPos}px; transform-origin:${xOrigin} ${yOrigin};`);
  // Set The Type
  targetMenu.dataset.id = e.target.dataset.id;
  return targetMenu;
}



// ===>>> App Contextmenu
// => Listen To Click Event On "APP_CM"
APP_CM.addEventListener("click", e => {
  // Check For The Target Option
  if (e.target.classList.contains("side-nav")) {
    // Toggle The Hide Class From The Side Nav Option
    e.target.classList.toggle("hide-opt");
    // Conditions For Creating Notifications
    let cond = e.target.classList.contains("hide-opt");
    if (cond) {
      createNotif("success", "Hide Side Navigation Box");
    } else createNotif("success", "Show Side Navigation Box");
    // Save The Data
    mainData.app_settings.hide_side_nav = cond;
    saveData();
  } else if (e.target.classList.contains("big-btn")) {
    // Check If There Is A Column Before Hiding The Add Column Button
    if (document.querySelector(".col")) {
    // Toggle The Hide Class From The Big Button Option
      e.target.classList.toggle("hide-opt");
      // Conditions For Creating Notifications
      let cond = e.target.classList.contains("hide-opt");
      if (cond) {
        createNotif("success", "Hide Add Column Button");
      } else createNotif("success", "Show Add Column Button");
      // Save The Data
      mainData.app_nested_data.find(obj => obj.board_id === MAIN_BOARD_CONTENT.dataset.boardId).hide_big_btn = cond;
      saveData();
    } else createNotif("warning", "You Should Have At Least One Column");
  }
});
// => Update "APP_CM" Contextmenu Function
function updateAppCMFunc() {
  // Reset The Contextmenu Option Before Update It
  [...APP_CM.children].forEach(child => child.classList.remove("hide-opt"));
  // Add Column Big Button
  const HIDE_BIG_BTN_LI = document.querySelector(".cm li.big-btn");
  let btnBool = mainData.app_nested_data.find(obj => obj.board_id === MAIN_BOARD_CONTENT.dataset.boardId).hide_big_btn;
  HIDE_BIG_BTN_LI.className = `big-btn${btnBool ? " hide-opt" : ""}`;
  // Side Navigation Box
  const HIDE_SIDE_NAV_LI = document.querySelector(".cm li.side-nav");
  let navBool = mainData.app_settings.hide_side_nav;
  HIDE_SIDE_NAV_LI.className = `side-nav${navBool ? " hide-opt" : ""}`;
}



// ===>>> Main Contextmenu
// => Listen To Click Event On "MAIN_CM" To Get The Target Option
MAIN_CM.addEventListener("click", e => {
  document.querySelector(".overlay.show")?.classList.remove("show");
  if (e.target.classList.contains("edit-cm"))
  editOptFunc(MAIN_CM.dataset.type, MAIN_CM.dataset.id);
  else if (e.target.classList.contains("del-cm"))
  deleteOptFunc(MAIN_CM.dataset.type, MAIN_CM.dataset.id);
});
// ==>> Edit Option Function
function editOptFunc(type, id) {
  if (type === "board") {
    let boardObj = mainData.app_nested_data.find(obj => obj.board_id === id);
    BOARD_FORM.board_name.value = boardObj.board_name;
    BOARD_FORM.board_name.select();
    showOverlay(BOARDS_FORM_OVERLAY, true);
  } else if (type === "task") {
    let {task_title, task_des, target_col_id, subtasks_arr} = mainData.tasks_data[id];
    TASK_FORM.task_title_inp.value = task_title;
    TASK_FORM.task_des_inp.value = task_des;
    TASK_FORM.status_select_box.value = target_col_id;
    TASK_FORM.task_title_inp.select();
    showOverlay(TASKS_FORM_OVERLAY, true);
    SUBTASKS_BOX.textContent = "";
    subtasks_arr.forEach(obj => {
      let checked = obj.completed ? "on" : "off";
      craeteSubtasksInpFunc(obj.subtask_text, undefined, checked);
    });
  } else if (type === "col") {
    let {col_name, col_color} = mainData.cols_data[id];
    COLUMN_FORM.column_name.value = col_name;
    COLUMN_FORM.col_status_color.value = col_color;
    COLUMN_FORM.column_name.select();
    showOverlay(COLUMN_FORM_OVERLAY, true);
  }
}
// ==>> Delete Option Function
function deleteOptFunc(type, id) {
  CONFIRM_DEL_OVERLAY.dataset.id = id;
  CONFIRM_DEL_OVERLAY.dataset.type = type;
  CONFIRM_DEL_OVERLAY.classList.add("show");
}
// => Listen To Click Event On "CONFIRM_DEL_BTNS" To Confirm Or Cancel Deleting Process
CONFIRM_DEL_BTNS.addEventListener("click", e => {
  // Check For Confirming Before Deleting
  if (e.target.classList.contains("confirm-del")) {
    deleteObj[CONFIRM_DEL_OVERLAY.dataset.type](CONFIRM_DEL_OVERLAY.dataset.id);
    CONFIRM_DEL_OVERLAY.classList.remove("show");
    createNotif("success", "Deleted Sucessfully");
    saveData();
  } else if (e.target.classList.contains("cancel-del")) {
    CONFIRM_DEL_OVERLAY.classList.remove("show");
  }
});
// => Deleting Function Easy Access Object
let deleteObj = {
  task: delTaskFunc,
  board: delBoardFunc,
  col: delColumnFunc,
}
// => Delete Task Function
function delTaskFunc(id) {
  // Update The DOM
  let targetEl = document.querySelector(`.task[data-id="${id}"]`);
  targetEl.remove();
  // Get The Target Data
  let taskObj = mainData.tasks_data[id];
  let colObj = mainData.cols_data[taskObj.target_col_id]; 
  // Deleting The Data
  colObj.tasks_ids_arr = colObj.tasks_ids_arr.filter(i => i !== id);
  delete mainData.tasks_data[id];
  // Update Numbering
  let targetNum = document.querySelector(`.col[data-id="${taskObj.target_col_id}"] header`);
  targetNum.childNodes[2].nodeValue = dynamicNumbering("col", colObj.tasks_ids_arr.length);
}
// => Delete Board Function
function delBoardFunc(id) {
  // Update The DOM
  let targetEl = document.querySelector(`.board-li[data-id="${id}"]`);
  targetEl.remove();
  boards_num.childNodes[1].nodeValue = BOARDS_LIST.querySelectorAll(".board-li").length;
  // Update The Data
  let targetBoard = mainData.app_nested_data.find(obj => obj.board_id === id);
  targetBoard.cols_ids_arr.forEach(id => {
    let colObj = mainData.cols_data[id];
    colObj.tasks_ids_arr.forEach(id => delete mainData.tasks_data[id]);
    delete mainData.cols_data[id];
  });
  mainData.app_nested_data = mainData.app_nested_data.filter(obj => obj.board_id !== id);
}
// => Delete Column Function
function delColumnFunc(id) {
  // Update The DOM
  let targetEl = document.querySelector(`.col[data-id="${id}"]`);
  targetEl.remove();
  // Get The Target Data
  let boardObj = mainData.app_nested_data.find(obj => obj.board_id === MAIN_BOARD_CONTENT.dataset.boardId);
  let colObj = mainData.cols_data[id];
  // Update The Data
  boardObj.cols_ids_arr = boardObj.cols_ids_arr.filter(i => i !== id);
  colObj.tasks_ids_arr.forEach(id => delete mainData.tasks_data[id]);
  delete mainData.cols_data[id];
  // Show Add Column Big Button If The User Is Deleting The Last Column
  if (!document.querySelector(".col")) {
    // Show The Add Column Big Button
    APP_CM.querySelector("li.big-btn").classList.remove("hide-opt");
    // Save Data
    mainData.app_nested_data.find(obj => obj.board_id === MAIN_BOARD_CONTENT.dataset.boardId).hide_big_btn = false;
    saveData();
  }
  // Update Column Select Boxs Options
  createColumnSelectBoxOpt();
}




// ==>> Helping Functions => Functions That Used In Common Actions
// => Saving Data Function
function saveData() {
  localStorage.setItem("kanban_app", JSON.stringify(mainData));
}
// => Update Board Content Function
function updateBoardContent(boardObj) {
  let {board_id, board_name: boardName, cols_ids_arr, hide_big_btn} = boardObj;
  // Update The Board Content
  MAIN_BOARD_CONTENT.dataset.boardId = board_id;
  board_name.innerText = boardName;
  // Remove All Columns Before Adding It Again
  document.querySelectorAll(".col").forEach(el => el.remove());
  // Create Columns
  cols_ids_arr.forEach(id => {
    let obj = {columnId: id, data: mainData.cols_data[id]};
    createColumnDOM(obj);
  });
  // Update The App Contextmenu Option "APP_CM"
  updateAppCMFunc();
  // Create Column Select Box Options
  createColumnSelectBoxOpt();
  // Remove The Loading Overlay If It Is Shown
  LOADING_OVERLAY.classList.add("hide");
}
// => Dynamic Numbering
function dynamicNumbering(type, data) {
  if (type === "col") {
    return `(${data})`;
  } else if (type === "task") {
    let {completedNum, wholeNum} = data;
    return `${completedNum} of ${wholeNum} subtasks`;
  }
}
// => Create Column Select Box Options
function createColumnSelectBoxOpt() {
  // Clear The Select Boxs Before Adding It Again
  status_select_box.textContent = "";
  status_select_box_view_task.textContent = "";
  // Loop Throw The Target Columns
  mainData.app_nested_data.find(obj => obj.board_id === MAIN_BOARD_CONTENT.dataset.boardId).cols_ids_arr.forEach(id => {
    let {col_name} = mainData.cols_data[id];
    // Create Select Box Option
    const OPTION_EL = document.createElement("option");
    // Setting The Value And The TextContent
    OPTION_EL.value = id;
    OPTION_EL.innerText = col_name;
    // Appending The Elements
    status_select_box.appendChild(OPTION_EL);
    status_select_box_view_task.appendChild(OPTION_EL.cloneNode(true));
  });
}










/*
  - Quering The DOM
  - Helping Variables
  - Setting Up The App
  - Overlays Functions And Events
  --- Showing And Hiding Overlays
  --- Helping Functions
  - Creating The App Data
  --- Creating Boards Data
  --- Creating Columns Data
  --- Creating Tasks Data
  --- Creating Subtasks Data
  - Adding Data On Submiting Forms
  --- Add Board Data
  --- Add Column Data
  --- Add Task And Subtasks Data
  - Create The DOM Of The Data
  --- Create Board LI
  --- Create Column DOM
  --- Create Task DOM
  - Update Board By Click The Board LIs
  - Create Subtasks Inputs In "TASK_FORM"
  --- Create Subtasks Inputs In The "TASK_FORM" On Click "ADD_SUBTASK_BTN"
  --- Create Subtasks Input Function
  --- Delete Subtasks Inputs
  - Color Radio Input In The Add New Column Form
  --- Create Color Radio Input
  --- Create Color Radio Input When Listening To Input Event In "color_inp"
  - Show Task Data
  --- Show Task Data On Double Click The Task Using Function Delegation
  --- Create Subtasks Function
  --- "TASK_VIEW_POPUP_SUBTASKS_LIST" Listen To Click Event To Target Subtasks Checkboxs Using Function Delegation
  - Contextmenu Functions And Events
  --- Hiding Contextmenu
  --- Show Contextmenu Function
  --- Show A Target Contextmenu
  - Contextmenu Options
  --- Listen To Click Event On "MAIN_CM" To Get The Target Option
  --- Edit Option Function
  --- Delete Option Function
  ------ Listen To Click Event On "CONFIRM_DEL_BTNS" To Confirm Or Cancel Deleting Process
  ------ Deleting Function Easy Access Object
  ------ Delete Task Function
  ------ Delete Board Function
  ------ Delete Column Function
  - Helping Functions => Functions That Used In Common Actions
  --- Saving Data Function
  --- Update Board Content Function
  --- Create Column Select Box Options
*/

/*
  Reminder
  -- Make For Each Board show-big-btn Option Not One Option For All Boards => Done
  -- Add Wave Effect On Clicking => Done
  -- Update Description In View Task Data => Done
  -- When Adding New Subtask Make The Scroll Down => Done
  -- Fix When Tasks More Than The Column Height => Done
  Updates
  -- Change Column Orders From The Column contextmenu
  -- Change Boards Order Using Drag And Drop
  Others
  -- Change The Icons To Imgs In Folder
  -- Update CSS Coloring Themes
  -- Reorder The Code Link Comment
  */







// ==>> Notification
// => Create Notification Function
function createNotif(type, text) {
  if (document.querySelectorAll(".notif").length < 4) {
    // Create Elements
    const NOTIF = document.createElement("div");
    const NOTIF_ICO = document.createElement("span");
    const NOTIF_TEXT = document.createElement("p");
    const CLOSE_ICO = document.createElement("img");
    // Setting Attributes
    NOTIF.className = `notif ${type}-n`;
    NOTIF_ICO.className = "ico";
    NOTIF_TEXT.innerText = text;
    CLOSE_ICO.src = "./imgs/close.svg";
    CLOSE_ICO.className = "close-n";
    CLOSE_ICO.draggable = false;
    CLOSE_ICO.addEventListener("click", () => {
      NOTIF.classList.add("hide");
      setTimeout(() => {
        NOTIF.remove();
        [...document.querySelectorAll(".notif")].reverse().forEach((el, idx) => el.style.bottom = `${(62 * idx) + 12}px`);
      }, 400);
    });
    // Appending Children
    NOTIF.append(NOTIF_ICO, NOTIF_TEXT, CLOSE_ICO);
    document.body.appendChild(NOTIF);
    setTimeout(() => {
      NOTIF.classList.add("hide");
      setTimeout(() => NOTIF.remove(), 400);
    }, 5000);
    // Update Positions
    [...document.querySelectorAll(".notif")].reverse().forEach((el, idx) => el.style.bottom = `${(62 * idx) + 12}px`);
    // Remove The Last Notifications
    if (document.querySelectorAll(".notif").length > 4) {
      document.querySelectorAll(".notif")[0].classList.add("hide");
      setTimeout(() => document.querySelectorAll(".notif")[0].remove(), 400);
    }
  }
}



// ==>> Drag And Drop Tasks
// => Helping Variables
let axis;
// => "MAIN_BOARD_CONTENT" Listen To Dragstart Event
MAIN_BOARD_CONTENT.addEventListener("dragstart", e => {
  // Hide The Ghost Image
  let emptyImage = new Image();
  e.dataTransfer.setDragImage(emptyImage, 0, 0);
  // Make A Custum Ghost Image
  const CLONED_EL = e.target.cloneNode(true);
  CLONED_EL.id = "cloned";
  document.body.appendChild(CLONED_EL);
  // Set "axis" Variable
  let {width, top, left} = e.target.getBoundingClientRect();
  axis = {
    x: e.clientX - left,
    y: e.clientY - top,
  };
  // Set The CSS Variables
  CLONED_EL.setAttribute("style", `--w:${width}px;--t:${top}px;--l:${left}px;`);
  // Add An Id To The Dragging Element
  setTimeout(() => e.target.id = "dragging");
});
// => Body Listen To Dragover Event
document.body.addEventListener("dragover", e => {
  if (e.target.classList.contains("col")) {
    e.preventDefault();
    // Target Elements
    let parent = e.target.querySelector(".tasks-list");
    const DRAGGING_EL = document.getElementById("dragging");
    // Change The Position Of The "DRAGGING_EL"
    let afterEl = getAfterEl(e, parent).el;
    if (afterEl) {
      parent.insertBefore(DRAGGING_EL, afterEl);
    } else parent.appendChild(DRAGGING_EL);
  }
  // Change The Position Of The "CLONED_EL"
  const CLONED_EL = document.getElementById("cloned");
  CLONED_EL.style.setProperty("--t", `${e.clientY - axis.y}px`);
  CLONED_EL.style.setProperty("--l", `${e.clientX - axis.x}px`);
});
// => "MAIN_BOARD_CONTENT" Listen To Dragover Event
document.body.addEventListener("dragend", () => {
  const CLONED_EL = document.getElementById("cloned");
  const DRAGGING_EL = document.getElementById("dragging");
  if (CLONED_EL) {
    CLONED_EL.remove();
    DRAGGING_EL.focus();
    DRAGGING_EL.id = "";
    axis = undefined;
    // Update Tasks Data
    document.querySelectorAll(".task").forEach(task => {
      mainData.tasks_data[task.dataset.id].target_col_id = task.closest(".col").dataset.id;
    });
    // Update Columns Tasks Order And Number
    mainData.app_nested_data.find(obj => obj.board_id === MAIN_BOARD_CONTENT.dataset.boardId).cols_ids_arr.forEach(id => {
      // Update Columns Data
      let orderTasksArr = [...document.querySelectorAll(`.col[data-id="${id}"] .task`)].map(el => el.dataset.id);
      let colObj = mainData.cols_data[id];
      colObj.tasks_ids_arr = orderTasksArr;
      // Change The Tasks Number
      const COLUMN_HEADER = document.querySelector(`.col[data-id="${id}"] header`);
      COLUMN_HEADER.childNodes[2].nodeValue = dynamicNumbering("col", orderTasksArr.length);
    });
    saveData();
  }
});
// => Get After Element Function
function getAfterEl(e, parent) {
  let children = [...parent.querySelectorAll(".task:not(#dragging)")];
  return children.reduce((prev, curr) => {
    let {top, height} = curr.getBoundingClientRect();
    let offset = e.clientY - (top + height / 2);
    return offset < 0 && offset > prev.offset ? {offset, el: curr} : prev;
  }, {offset: Number.NEGATIVE_INFINITY, el: undefined});
}



// ==>> Create Wave Effect On Target Buttons
// => Listen Click Event On The Document Using Function Delegation To Get The Target Button
document.addEventListener("click", e => {
  if (e.target.classList.contains("btn-wave-effect")) {
    // Helping Variables
    const WAVE_EFFECT = document.createElement("div");
    let elData = e.target.getBoundingClientRect();
    // Setting The "WAVE_EFFECT" Attributes
    WAVE_EFFECT.classList.add("wave-effect");
    e.target.setAttribute("style", `--t:${e.clientY - elData.top}px; --l:${e.clientX - elData.left}px; --wave-color:#fff;`);
    // Append The "WAVE_EFFECT"
    e.target.appendChild(WAVE_EFFECT);
    setTimeout(() => WAVE_EFFECT.remove(), 400);
  }
});