(() => {
  "use strict";

  const storageKey = "marrymap-demo-v1";
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const initialState = {
    totalBudget: 33000,
    weekIndex: 0,
    selectedPhotographer: "Northlight",
    tasks: [
      { id: "photo", title: "Choose your photographer", detail: "Compare two like-for-like 8-hour packages.", due: "Due Fri", urgency: "soon", complete: false },
      { id: "florals", title: "Reply to the florist", detail: "Ask for a seasonal alternative to bring the quote closer to plan.", due: "Due Thu", urgency: "soon", complete: false },
      { id: "rental", title: "Confirm rental arrival window", detail: "Venue needs the final delivery window before loading dock access is approved.", due: "Due Mon", urgency: "", complete: false },
      { id: "insurance", title: "Request venue insurance requirements", detail: "Ask for their certificate wording before buying event coverage.", due: "Waiting", urgency: "", complete: false },
      { id: "tasting", title: "Book your menu tasting", detail: "Hold a September time before the caterer's calendar fills.", due: "Next week", urgency: "", complete: false },
      { id: "music", title: "Share music notes with the band", detail: "Send ceremony cues and the no-play list.", due: "Next week", urgency: "", complete: true },
      { id: "hotel", title: "Publish hotel block details", detail: "Add the booking link to your guest update.", due: "Complete", urgency: "done", complete: true }
    ],
    categories: [
      { name: "Venue & catering", planned: 14500, committed: 14200 },
      { name: "Photography", planned: 4200, committed: 3600 },
      { name: "Florals", planned: 3750, committed: 4200 },
      { name: "Attire", planned: 3000, committed: 2740 },
      { name: "Music & rentals", planned: 4050, committed: 3500 }
    ]
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const readState = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...clone(initialState), ...JSON.parse(saved) } : clone(initialState);
    } catch {
      return clone(initialState);
    }
  };
  let state = readState();
  const persist = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

  const dialog = byId("action-dialog");
  const dialogEyebrow = byId("dialog-eyebrow");
  const dialogTitle = byId("dialog-title");
  const dialogBody = byId("dialog-body");
  const dialogActions = byId("dialog-actions");
  const toast = byId("toast");

  const totals = () => {
    const committed = state.categories.reduce((sum, category) => sum + Number(category.committed), 0);
    return { committed, remaining: state.totalBudget - committed, percent: Math.round((committed / state.totalBudget) * 100) };
  };

  const renderTasks = () => {
    const taskList = byId("task-list");
    taskList.innerHTML = state.tasks.map((task) => {
      const status = task.complete ? "done" : task.urgency;
      return `<article class="task ${task.complete ? "complete" : ""}">
        <button class="task-check" data-task-id="${task.id}" type="button" aria-label="${task.complete ? "Mark incomplete" : "Mark complete"}: ${escapeHtml(task.title)}" title="${task.complete ? "Mark incomplete" : "Mark complete"}"><i data-lucide="check"></i></button>
        <div class="task-body"><span class="task-title">${escapeHtml(task.title)}</span><span class="task-detail">${escapeHtml(task.detail)}</span></div>
        <span class="task-due ${status}">${task.complete ? "Done" : escapeHtml(task.due)}</span>
      </article>`;
    }).join("");

    const done = state.tasks.filter((task) => task.complete).length;
    const open = state.tasks.length - done;
    byId("done-count").textContent = done;
    byId("total-count").textContent = state.tasks.length;
    byId("nav-task-count").textContent = open;
    byId("plan-progress").style.width = `${Math.round((done / state.tasks.length) * 100)}%`;
  };

  const renderBudget = () => {
    const { committed, remaining, percent } = totals();
    byId("budget-remaining").textContent = money.format(remaining);
    byId("budget-spent").textContent = money.format(committed);
    byId("total-budget").textContent = money.format(state.totalBudget);
    byId("summary-committed").textContent = money.format(committed);
    byId("summary-unassigned").textContent = money.format(remaining);
    byId("budget-percent").textContent = `${percent}%`;
    document.querySelector(".budget-ring").style.background = `conic-gradient(#5e9b80 0deg ${Math.min(100, Math.max(0, percent)) * 3.6}deg, #e4ebe5 ${Math.min(100, Math.max(0, percent)) * 3.6}deg 360deg)`;

    byId("budget-categories").innerHTML = state.categories.map((category) => {
      const over = category.committed > category.planned;
      const width = Math.min(100, Math.round((category.committed / category.planned) * 100));
      return `<div class="budget-category">
        <div class="category-name">${escapeHtml(category.name)}<small>${money.format(category.planned)} planned</small></div>
        <div class="category-bar"><span class="${over ? "over" : ""}" style="width: ${width}%"></span></div>
        <div class="category-value">${money.format(category.committed)}${over ? " over" : ""}</div>
      </div>`;
    }).join("");
  };

  const renderPhotographers = () => {
    const options = [
      { name: "Northlight", price: "$3,600", note: "2nd shooter", id: "Northlight" },
      { name: "Studio East", price: "$3,950", note: "Engagement session", id: "Studio East" }
    ];
    byId("photographer-compare").innerHTML = options.map((option) => `<article class="vendor-option ${state.selectedPhotographer === option.id ? "selected" : ""}">
      <strong>${option.name}</strong><span>${option.price}</span><span>${option.note}</span>
      <button type="button" class="select-photographer" data-photographer="${option.id}">${state.selectedPhotographer === option.id ? "Selected" : "Select"}</button>
    </article>`).join("");
  };

  const render = () => {
    renderTasks();
    renderBudget();
    renderPhotographers();
    if (window.lucide) window.lucide.createIcons();
  };

  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  };

  const openDialog = ({ eyebrow = "Marrymap", title, body, actions = "" }) => {
    dialogEyebrow.textContent = eyebrow;
    dialogTitle.textContent = title;
    dialogBody.innerHTML = body;
    dialogActions.innerHTML = actions;
    if (!dialog.open) dialog.showModal();
    if (window.lucide) window.lucide.createIcons();
  };

  const closeDialog = () => {
    if (dialog.open) dialog.close();
  };

  const showEmail = (type) => {
    const drafts = {
      floral: {
        title: "Reply to Orchid & Stem",
        to: "hello@orchidandstem.example",
        subject: "October 18 florals - seasonal alternatives",
        body: "Hi Mira,\n\nThank you for the thoughtful proposal. We love the shape of the ceremony meadow and the reception arrangement. We are trying to keep the floral category close to $3,750. Could you show us one seasonal-substitute option that preserves the overall feel while bringing the proposal closer to that figure?\n\nThank you,\nJamie & Morgan"
      },
      photo: {
        title: "Inquire with Studio East",
        to: "hello@studioeast.example",
        subject: "October 18, 2026 availability",
        body: "Hi Studio East team,\n\nWe are planning a 120-person wedding on October 18, 2026 at The Foundry. Are you available for an 8-hour celebration that day? If so, could you share a current sample timeline and let us know whether travel, tax, and a second shooter are included in your proposal?\n\nThank you,\nJamie & Morgan"
      }
    };
    const draft = drafts[type];
    openDialog({
      eyebrow: "Approval required before sending",
      title: draft.title,
      body: `<p class="dialog-note">This is a reviewable draft only. Marrymap does not send messages from the demo.</p>
        <div class="email-meta"><span><b>To</b> ${draft.to}</span><span><b>Subject</b> ${draft.subject}</span></div>
        <div class="form-field"><label for="email-draft">Message</label><textarea id="email-draft">${escapeHtml(draft.body)}</textarea></div>`,
      actions: `<button class="secondary-button" type="button" data-close-dialog>Edit later</button><button class="primary-button" type="button" data-approve-draft>Approve draft <i data-lucide="check"></i></button>`
    });
  };

  const showComparison = () => {
    openDialog({
      eyebrow: "Photography comparison",
      title: "Compare the same scope",
      body: `<p class="dialog-note">Values are from the demo workspace. In production, every extracted item should link back to the original quote and its confidence.</p>
        <table class="comparison-table"><thead><tr><th>Included</th><th>Northlight</th><th>Studio East</th></tr></thead>
        <tbody><tr><td>Package</td><td class="comparison-highlight">8 hours</td><td class="comparison-highlight">8 hours</td></tr>
        <tr><td>Price</td><td>$3,600</td><td>$3,950</td></tr><tr><td>Second shooter</td><td class="comparison-highlight">Included</td><td>Add $500</td></tr>
        <tr><td>Engagement session</td><td>Add $400</td><td class="comparison-highlight">Included</td></tr>
        <tr><td>Travel and tax</td><td>Confirmed included</td><td>Ask before decision</td></tr></tbody></table>`,
      actions: `<button class="secondary-button" type="button" data-close-dialog>Close</button><button class="primary-button" type="button" data-select-northlight>Select Northlight</button>`
    });
  };

  const showExpenseForm = () => {
    const options = state.categories.map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`).join("");
    openDialog({
      eyebrow: "Manual expense entry",
      title: "Add a committed expense",
      body: `<p class="dialog-note">The demo stores this entry only in this browser. It never connects to a bank account.</p>
        <div class="form-grid"><div class="form-field full-width"><label for="expense-name">Expense</label><input id="expense-name" required placeholder="e.g. Welcome dinner deposit" /></div>
        <div class="form-field"><label for="expense-category">Category</label><select id="expense-category">${options}</select></div>
        <div class="form-field"><label for="expense-amount">Amount</label><input id="expense-amount" required min="1" step="1" type="number" placeholder="0" /></div></div>`,
      actions: `<button class="secondary-button" type="button" data-close-dialog>Cancel</button><button class="primary-button" type="button" data-add-expense>Add expense</button>`
    });
  };

  const showBudgetForm = () => {
    openDialog({
      eyebrow: "Planning assumptions",
      title: "Set your total budget",
      body: `<p class="dialog-note">This becomes the reference point for manual commitments and risk flags.</p>
        <div class="form-field"><label for="budget-input">Total wedding budget</label><input id="budget-input" type="number" min="1" step="500" value="${state.totalBudget}" /></div>`,
      actions: `<button class="secondary-button" type="button" data-close-dialog>Cancel</button><button class="primary-button" type="button" data-save-budget>Save budget</button>`
    });
  };

  const showWeddingForm = () => {
    openDialog({
      eyebrow: "Wedding profile",
      title: "Edit planning details",
      body: `<p class="dialog-note">This demo changes the displayed workspace only. Production planning facts should retain source and edit history.</p>
        <div class="form-grid"><div class="form-field"><label for="couple-name">Names</label><input id="couple-name" value="Jamie & Morgan" /></div><div class="form-field"><label for="wedding-date">Wedding date</label><input id="wedding-date" type="date" value="2026-10-18" /></div><div class="form-field full-width"><label for="venue-name">Venue</label><input id="venue-name" value="The Foundry" /></div></div>`,
      actions: `<button class="secondary-button" type="button" data-close-dialog>Cancel</button><button class="primary-button" type="button" data-save-wedding>Save details</button>`
    });
  };

  const copySummary = async () => {
    const { committed, remaining } = totals();
    const openTasks = state.tasks.filter((task) => !task.complete).map((task) => `- ${task.title} (${task.due})`).join("\n");
    const summary = `Marrymap weekly summary\n\nOpen tasks:\n${openTasks}\n\nBudget: ${money.format(committed)} committed, ${money.format(remaining)} unassigned.\nDecision: ${state.selectedPhotographer} is selected for the photography comparison.`;
    try {
      await navigator.clipboard.writeText(summary);
      showToast("Weekly summary copied.");
    } catch {
      showToast("Copy is unavailable in this browser.");
    }
  };

  const updateWeek = (direction) => {
    const labels = ["Jul 14 - Jul 20", "Jul 21 - Jul 27", "Jul 28 - Aug 3", "Aug 4 - Aug 10"];
    state.weekIndex = Math.max(0, Math.min(labels.length - 1, state.weekIndex + direction));
    byId("week-label").textContent = labels[state.weekIndex];
    persist();
    showToast(state.weekIndex === 0 ? "Back to the current week." : `Showing ${labels[state.weekIndex]}.`);
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const taskButton = button.closest("[data-task-id]");
    if (taskButton) {
      const task = state.tasks.find((item) => item.id === taskButton.dataset.taskId);
      if (task) {
        task.complete = !task.complete;
        persist();
        render();
        showToast(task.complete ? "Task marked complete." : "Task reopened.");
      }
      return;
    }

    if (button.matches(".select-photographer")) {
      state.selectedPhotographer = button.dataset.photographer;
      persist();
      renderPhotographers();
      if (window.lucide) window.lucide.createIcons();
      showToast(`${state.selectedPhotographer} selected for comparison.`);
      return;
    }

    if (button.dataset.scroll) {
      document.querySelector(button.dataset.scroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (button.matches("[data-close-dialog]")) { closeDialog(); return; }
    if (button.matches("[data-approve-draft]")) { closeDialog(); showToast("Draft approved. No message was sent in the demo."); return; }
    if (button.matches("[data-select-northlight]")) { state.selectedPhotographer = "Northlight"; persist(); render(); closeDialog(); showToast("Northlight selected for comparison."); return; }
    if (button.matches("[data-add-expense]")) {
      const amount = Number(byId("expense-amount").value);
      const categoryName = byId("expense-category").value;
      if (!amount || amount <= 0) { showToast("Enter an amount greater than zero."); return; }
      const category = state.categories.find((item) => item.name === categoryName);
      category.committed += amount;
      persist();
      render();
      closeDialog();
      showToast("Expense added to your budget.");
      return;
    }
    if (button.matches("[data-save-budget]")) {
      const amount = Number(byId("budget-input").value);
      if (!amount || amount <= 0) { showToast("Enter a valid total budget."); return; }
      state.totalBudget = amount;
      persist();
      render();
      closeDialog();
      showToast("Total budget updated.");
      return;
    }
    if (button.matches("[data-save-wedding]")) { closeDialog(); showToast("Wedding details saved in the demo workspace."); return; }

    if (button.id === "add-expense") showExpenseForm();
    if (button.id === "edit-budget") showBudgetForm();
    if (button.id === "edit-wedding") showWeddingForm();
    if (button.id === "compare-photographers" || button.id === "view-vendors") {
      byId("vendors").scrollIntoView({ behavior: "smooth", block: "start" });
      if (button.id === "compare-photographers") showComparison();
    }
    if (button.id === "review-floral-email") showEmail("floral");
    if (button.id === "draft-new-email") showEmail("photo");
    if (button.matches(".open-message")) showEmail(button.dataset.message);
    if (button.id === "copy-summary") copySummary();
    if (button.id === "previous-week") updateWeek(-1);
    if (button.id === "next-week") updateWeek(1);
    if (button.id === "focus-risks") {
      byId("vendors").scrollIntoView({ behavior: "smooth", block: "start" });
      showToast("Two open decisions are highlighted in Vendor decisions.");
    }
    if (button.id === "notifications") showToast("2 items need a decision before Friday.");
    if (button.id === "reset-demo") {
      state = clone(initialState);
      persist();
      render();
      showToast("Demo workspace reset.");
    }
    if (button.id === "mobile-menu") byId("overview").closest(".app-shell").querySelector(".sidebar").classList.toggle("open");
  });

  document.querySelectorAll(".side-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.remove("open");
      document.querySelectorAll(".side-nav a").forEach((item) => item.classList.toggle("active", item === link));
    });
  });

  byId("week-label").textContent = ["Jul 14 - Jul 20", "Jul 21 - Jul 27", "Jul 28 - Aug 3", "Aug 4 - Aug 10"][state.weekIndex] || "Jul 14 - Jul 20";
  render();
})();