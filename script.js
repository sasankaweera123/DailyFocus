(() => {
  const STORAGE_KEY = "daily-focus-state";
  const MAX_PRIORITIES = 3;

  const form = document.querySelector("#task-form");
  const input = document.querySelector("#task-input");
  const taskList = document.querySelector("#task-list");
  const emptyState = document.querySelector("#empty-state");
  const priorityList = document.querySelector("#priority-list");
  const priorityHint = document.querySelector("#priority-hint");
  const progressSummary = document.querySelector("#progress-summary");
  const progressBar = document.querySelector("#progress-bar");
  const progressFill = document.querySelector("#progress-fill");
  const themeToggle = document.querySelector("#theme-toggle");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const listStatus = document.querySelector("#list-status");

  const state = loadState();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addTask(input.value);
    input.value = "";
    input.focus();
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    persist();
    applyTheme();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      persist();
      render();
    });
  });

  applyTheme();
  render();

  function addTask(rawName) {
    const name = rawName.trim();
    if (!name) {
      input.focus();
      return;
    }

    state.tasks.unshift({
      id: crypto.randomUUID(),
      name,
      completed: false,
    });
    persist();
    render();
  }

  function toggleComplete(id) {
    const task = findTask(id);
    if (!task) return;

    task.completed = !task.completed;
    if (task.completed) {
      state.priorityIds = state.priorityIds.filter((priorityId) => priorityId !== id);
    }
    persist();
    render();
  }

  function togglePriority(id) {
    const task = findTask(id);
    if (!task || task.completed) return;

    if (state.priorityIds.includes(id)) {
      state.priorityIds = state.priorityIds.filter((priorityId) => priorityId !== id);
    } else if (state.priorityIds.length < MAX_PRIORITIES) {
      state.priorityIds.push(id);
    } else {
      priorityHint.textContent = "You already have three priorities. Unpin one to choose another.";
      return;
    }

    persist();
    render();
  }

  function startEdit(id, nameEl, actionsEl) {
    const task = findTask(id);
    if (!task) return;

    const editor = document.createElement("input");
    editor.type = "text";
    editor.value = task.name;
    editor.maxLength = 120;
    editor.setAttribute("aria-label", "Edit task name");
    nameEl.replaceWith(editor);
    editor.focus();
    editor.select();

    const save = () => {
      const nextName = editor.value.trim();
      if (nextName) task.name = nextName;
      persist();
      render();
    };

    editor.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        save();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        render();
      }
    });
    editor.addEventListener("blur", save);
    actionsEl.querySelectorAll("button").forEach((button) => {
      button.disabled = true;
    });
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((task) => task.id !== id);
    state.priorityIds = state.priorityIds.filter((priorityId) => priorityId !== id);
    persist();
    render();
  }

  function render() {
    renderProgress();
    renderPriorities();
    renderFilters();
    renderTasks();
  }

  function renderProgress() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((task) => task.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressSummary.textContent = `${completed} of ${total} tasks complete`;
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", String(total));
    progressBar.setAttribute("aria-valuenow", String(completed));
    progressFill.style.width = `${percent}%`;
  }

  function renderPriorities() {
    state.priorityIds = state.priorityIds.filter((id) => {
      const task = findTask(id);
      return task && !task.completed;
    });

    priorityList.replaceChildren();
    for (let index = 0; index < MAX_PRIORITIES; index += 1) {
      const item = document.createElement("li");
      item.className = "priority-card";

      const badge = document.createElement("span");
      badge.className = "priority-index";
      badge.textContent = String(index + 1);

      const label = document.createElement("p");
      const task = findTask(state.priorityIds[index]);
      if (task) {
        label.className = "task-name";
        label.textContent = task.name;
      } else {
        label.className = "priority-empty";
        label.textContent = "Open slot — pin an active task";
      }

      item.append(badge, label);
      priorityList.append(item);
    }

    const remaining = MAX_PRIORITIES - state.priorityIds.length;
    priorityHint.textContent =
      remaining === 0
        ? "Three priorities locked in. Finish one or unpin to change them."
        : `${remaining} priority slot${remaining === 1 ? "" : "s"} left.`;
  }

  function renderFilters() {
    filterButtons.forEach((button) => {
      const isActive = button.dataset.filter === state.filter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function renderTasks() {
    const visible = state.tasks.filter((task) => {
      if (state.filter === "active") return !task.completed;
      if (state.filter === "completed") return task.completed;
      return true;
    });

    taskList.replaceChildren();
    emptyState.hidden = state.tasks.length > 0;

    if (state.tasks.length === 0) {
      listStatus.textContent = "No tasks yet.";
      return;
    }

    if (visible.length === 0) {
      const emptyFilter = document.createElement("li");
      emptyFilter.className = "priority-empty";
      emptyFilter.textContent = "Nothing matches this filter.";
      taskList.append(emptyFilter);
    }

    visible.forEach((task) => {
      const item = document.createElement("li");
      item.className = "task-item";
      if (task.completed) item.classList.add("is-complete");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      checkbox.id = `task-${task.id}`;
      checkbox.setAttribute("aria-label", `Mark “${task.name}” complete`);
      checkbox.addEventListener("change", () => toggleComplete(task.id));

      const name = document.createElement("p");
      name.className = "task-name";
      name.id = `name-${task.id}`;
      name.textContent = task.name;

      const actions = document.createElement("div");
      actions.className = "task-actions";

      const priorityBtn = document.createElement("button");
      priorityBtn.type = "button";
      priorityBtn.className = "icon-btn";
      const isPriority = state.priorityIds.includes(task.id);
      if (isPriority) priorityBtn.classList.add("is-on");
      priorityBtn.textContent = isPriority ? "Unpin" : "Pin";
      priorityBtn.setAttribute(
        "aria-pressed",
        String(isPriority)
      );
      priorityBtn.setAttribute(
        "aria-label",
        isPriority ? `Unpin “${task.name}” from today’s priorities` : `Pin “${task.name}” as a priority`
      );
      priorityBtn.disabled = task.completed && !isPriority;
      priorityBtn.addEventListener("click", () => togglePriority(task.id));

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "icon-btn";
      editBtn.textContent = "Edit";
      editBtn.setAttribute("aria-label", `Edit “${task.name}”`);
      editBtn.addEventListener("click", () => startEdit(task.id, name, actions));

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "icon-btn danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.setAttribute("aria-label", `Delete “${task.name}”`);
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      actions.append(priorityBtn, editBtn, deleteBtn);
      item.append(checkbox, name, actions);
      taskList.append(item);
    });

    const filterLabel = state.filter === "all" ? "" : ` ${state.filter}`;
    listStatus.textContent = `Showing ${visible.length}${filterLabel} task${visible.length === 1 ? "" : "s"}.`;
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const dark = state.theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(dark));
    themeToggle.querySelector(".theme-toggle-label").textContent = dark ? "Light mode" : "Dark mode";
  }

  function findTask(id) {
    return state.tasks.find((task) => task.id === id);
  }

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tasks: state.tasks,
        priorityIds: state.priorityIds,
        theme: state.theme,
        filter: state.filter,
      })
    );
  }

  function loadState() {
    const fallback = {
      tasks: [],
      priorityIds: [],
      theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      filter: "all",
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.priorityIds)) return fallback;
      return {
        tasks: parsed.tasks
          .filter((task) => task && typeof task.id === "string" && typeof task.name === "string")
          .map((task) => ({
            id: task.id,
            name: task.name,
            completed: Boolean(task.completed),
          })),
        priorityIds: parsed.priorityIds.filter((id) => typeof id === "string"),
        theme: parsed.theme === "dark" ? "dark" : "light",
        filter: ["all", "active", "completed"].includes(parsed.filter) ? parsed.filter : "all",
      };
    } catch {
      return fallback;
    }
  }
})();
