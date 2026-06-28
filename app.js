// ===== GLOBAL STATE =====
var revenueChartInstance = null;
var spendingChartInstance = null;
var analyticsInitialized = false;
var cardChartInit = false;
var currentTheme = 'dark';

// Stored chart instances takay theme change par update kar sakain
var allCharts = [];

// Notifications database
var notificationsData = [
    { icon: 'fa-wallet', title: 'Budget Alert', message: 'Your Housing budget is 95% used', type: 'warning', time: '2 hours ago' },
    { icon: 'fa-check-circle', title: 'Payment Successful', message: 'Salary of $8,240 received', type: 'success', time: '1 day ago' },
    { icon: 'fa-exclamation-triangle', title: 'Card Limit', message: 'Gold Card limit almost reached', type: 'danger', time: '3 days ago' },
    { icon: 'fa-info-circle', title: 'New Feature', message: 'Check out our new expense tracking feature', type: 'info', time: '5 days ago' },
];


// ===== MODAL FUNCTIONS =====
function openModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function focusSearchInput() {
    setTimeout(function() {
        document.getElementById('searchInput').focus();
    }, 100);
}


// ===== SEARCH FUNCTIONALITY =====
document.getElementById('searchInput') && document.getElementById('searchInput').addEventListener('input', function() {
    var query = this.value.toLowerCase();
    var results = transactions.filter(function(t) {
        return t.name.toLowerCase().includes(query) ||
               t.category.toLowerCase().includes(query) ||
               t.amount.toString().includes(query);
    });

    var container = document.getElementById('searchResults');
    if (results.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No transactions found</div>';
        return;
    }

    var html = '';
    for (var i = 0; i < results.length; i++) {
        var t = results[i];
        var amtColor = t.amount > 0 ? 'var(--accent)' : 'var(--danger)';
        var amtPre = t.amount > 0 ? '+' : '-';
        html += '<div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--border-subtle);">';
        html += '<div style="width:36px;height:36px;border-radius:8px;background:' + t.iconBg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas ' + t.icon + '" style="color:' + t.iconColor + ';"></i></div>';
        html += '<div style="flex:1;"><div style="font-weight:600;font-size:13px;">' + t.name + '</div><div style="font-size:11px;color:var(--text-muted);">' + t.category + ' • ' + t.date + '</div></div>';
        html += '<div style="font-weight:600;color:' + amtColor + ';">' + amtPre + '$' + Math.abs(t.amount).toLocaleString() + '</div></div>';
    }
    container.innerHTML = html;
});


// ===== NOTIFICATIONS =====
function renderNotifications() {
    var container = document.getElementById('notificationsList');
    var html = '';
    
    if (notificationsData.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No notifications</div>';
        return;
    }

    for (var i = 0; i < notificationsData.length; i++) {
        var notif = notificationsData[i];
        var bgColor = notif.type === 'success' ? 'var(--accent-dim)' : 
                      notif.type === 'warning' ? 'var(--warning-dim)' :
                      notif.type === 'danger' ? 'var(--danger-dim)' : 'var(--info-dim)';
        var iconColor = notif.type === 'success' ? 'var(--accent)' :
                        notif.type === 'warning' ? 'var(--warning)' :
                        notif.type === 'danger' ? 'var(--danger)' : 'var(--info)';

        html += '<div style="padding:14px;border-bottom:1px solid var(--border-subtle);display:flex;gap:12px;">';
        html += '<div style="width:40px;height:40px;border-radius:8px;background:' + bgColor + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas ' + notif.icon + '" style="color:' + iconColor + ';"></i></div>';
        html += '<div style="flex:1;"><div style="font-weight:600;font-size:13px;">' + notif.title + '</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">' + notif.message + '</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px;">' + notif.time + '</div></div>';
        html += '<button class="btn btn-outline" style="padding:4px 8px;font-size:11px;flex-shrink:0;min-width:auto;" onclick="removeNotification(' + i + ')"><i class="fas fa-times"></i></button>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function removeNotification(index) {
    notificationsData.splice(index, 1);
    renderNotifications();
}


// ===== ADD TRANSACTION =====
function addTransaction() {
    var name = document.getElementById('txnName').value;
    var category = document.getElementById('txnCategory').value;
    var type = document.getElementById('txnType').value;
    var amount = parseFloat(document.getElementById('txnAmount').value);
    var date = document.getElementById('txnDate').value;
    var status = document.getElementById('txnStatus').value;

    if (!name || !amount || !date) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    // Convert amount for expense
    if (type === 'expense') amount = -amount;

    var icons = {
        'Income': { icon: 'fa-briefcase', bg: 'var(--accent-dim)', color: 'var(--accent)' },
        'Food': { icon: 'fa-utensils', bg: 'var(--warning-dim)', color: 'var(--warning)' },
        'Housing': { icon: 'fa-home', bg: 'var(--danger-dim)', color: 'var(--danger)' },
        'Transport': { icon: 'fa-car', bg: 'var(--warning-dim)', color: 'var(--warning)' },
        'Entertainment': { icon: 'fa-film', bg: 'var(--danger-dim)', color: 'var(--danger)' },
        'Utilities': { icon: 'fa-bolt', bg: 'var(--info-dim)', color: 'var(--info)' },
        'Shopping': { icon: 'fa-shopping-bag', bg: 'var(--info-dim)', color: 'var(--info)' },
        'Health': { icon: 'fa-dumbbell', bg: 'var(--accent-dim)', color: 'var(--accent)' },
    };

    var iconInfo = icons[category] || { icon: 'fa-dollar-sign', bg: 'var(--accent-dim)', color: 'var(--accent)' };

    transactions.unshift({
        name: name,
        category: category,
        icon: iconInfo.icon,
        iconBg: iconInfo.bg,
        iconColor: iconInfo.color,
        date: date,
        amount: amount,
        type: type,
        status: status
    });

    // Clear form and close modal
    document.getElementById('txnName').value = '';
    document.getElementById('txnAmount').value = '';
    document.getElementById('txnDate').value = '';
    closeModal('addTransactionModal');
    renderTransactions();
    renderRecentActivity();
    showToast('Transaction added successfully!', 'success');
    addNotification('New Transaction', 'Transaction added: ' + name);
}

function updateTxnFields() {
    // Can add dynamic UI changes here if needed
}


// ===== DELETE TRANSACTION =====
function deleteTransaction(index) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions.splice(index, 1);
        renderTransactions();
        renderRecentActivity();
        showToast('Transaction deleted', 'success');
    }
}


// ===== ADD BUDGET =====
function addBudget() {
    var name = document.getElementById('budgetName').value;
    var category = document.getElementById('budgetCategory').value;
    var limit = parseFloat(document.getElementById('budgetLimit').value);

    if (!name || !limit) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    var colors = {
        'Housing & Rent': 'var(--danger)',
        'Food & Groceries': 'var(--warning)',
        'Transportation': 'var(--accent)',
        'Entertainment': 'var(--accent)',
        'Utilities': 'var(--info)',
        'Shopping': 'var(--warning)',
        'Health & Fitness': 'var(--accent)',
        'Education': 'var(--info)',
    };

    var icons = {
        'Housing & Rent': 'fa-home',
        'Food & Groceries': 'fa-utensils',
        'Transportation': 'fa-car',
        'Entertainment': 'fa-film',
        'Utilities': 'fa-bolt',
        'Shopping': 'fa-shopping-bag',
        'Health & Fitness': 'fa-heartbeat',
        'Education': 'fa-graduation-cap',
    };

    budgets.push({
        name: name,
        icon: icons[category] || 'fa-wallet',
        spent: 0,
        limit: limit,
        color: colors[category] || 'var(--accent)'
    });

    document.getElementById('budgetName').value = '';
    document.getElementById('budgetLimit').value = '';
    closeModal('addBudgetModal');
    renderBudgets();
    showToast('Budget added successfully!', 'success');
    addNotification('New Budget', 'Budget created: ' + name + ' ($' + limit + ')');
}


// ===== DELETE BUDGET =====
function deleteBudget(index) {
    if (confirm('Are you sure you want to delete this budget?')) {
        budgets.splice(index, 1);
        renderBudgets();
        showToast('Budget deleted', 'success');
    }
}


// ===== ADD SAVINGS GOAL =====
function addSavingsGoal() {
    var name = document.getElementById('savingsName').value;
    var target = parseFloat(document.getElementById('savingsTarget').value);
    var current = parseFloat(document.getElementById('savingsCurrent').value) || 0;
    var monthly = parseFloat(document.getElementById('savingsMonthly').value);

    if (!name || !target || !monthly) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    var icons = {
        'Emergency': 'fa-shield-alt',
        'Vacation': 'fa-plane',
        'Laptop': 'fa-laptop',
        'Investment': 'fa-chart-line',
        'House': 'fa-home',
        'Car': 'fa-car',
        'Education': 'fa-graduation-cap',
    };

    var colors = ['var(--accent)', 'var(--info)', 'var(--warning)', 'var(--danger)'];
    var randColor = colors[Math.floor(Math.random() * colors.length)];
    var iconKey = name.split(' ')[0];

    savingsGoals.push({
        name: name,
        target: target,
        saved: current,
        icon: icons[iconKey] || 'fa-piggy-bank',
        color: randColor,
        monthlyAdd: monthly
    });

    document.getElementById('savingsName').value = '';
    document.getElementById('savingsTarget').value = '';
    document.getElementById('savingsCurrent').value = '';
    document.getElementById('savingsMonthly').value = '';
    closeModal('addSavingsModal');
    renderSavings();
    showToast('Savings goal added successfully!', 'success');
    addNotification('New Goal', 'Savings goal created: ' + name);
}


// ===== DELETE SAVINGS GOAL =====
function deleteSavingsGoal(index) {
    if (confirm('Are you sure you want to delete this savings goal?')) {
        savingsGoals.splice(index, 1);
        renderSavings();
        showToast('Savings goal deleted', 'success');
    }
}


// ===== ADD TO NOTIFICATIONS =====
function addNotification(title, message) {
    notificationsData.unshift({
        icon: 'fa-info-circle',
        title: title,
        message: message,
        type: 'info',
        time: 'just now'
    });
    // Keep only last 10 notifications
    if (notificationsData.length > 10) {
        notificationsData.pop();
    }
}


// ===== THEME TOGGLE — YEH ASAL FIX HAI =====
function toggleTheme() {
    var html = document.documentElement;
    var icon = document.getElementById('themeIcon');

    if (currentTheme === 'dark') {
        currentTheme = 'light';
        html.setAttribute('data-theme', 'light');
        icon.className = 'fas fa-sun';
        showToast('Light mode enabled', 'success');
    } else {
        currentTheme = 'dark';
        html.setAttribute('data-theme', 'dark');
        icon.className = 'fas fa-moon';
        showToast('Dark mode enabled', 'success');
    }

    // localStorage mein save karo
    localStorage.setItem('finflow-theme', currentTheme);

    // Saare charts ke colors update karo
    updateChartColors();
}

// Theme load karo localStorage se
function loadTheme() {
    var saved = localStorage.getItem('finflow-theme');
    if (saved === 'light') {
        currentTheme = 'light';
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

// Charts ke grid lines aur tick colors theme ke sath match karo
function updateChartColors() {
    var style = getComputedStyle(document.documentElement);
    var gridColor = style.getPropertyValue('--chart-grid').trim();
    var tickColor = style.getPropertyValue('--chart-tick').trim();

    for (var i = 0; i < allCharts.length; i++) {
        var chart = allCharts[i];
        if (!chart || !chart.options) continue;

        var scales = chart.options.scales;
        if (scales) {
            if (scales.x) {
                if (scales.x.grid) scales.x.grid.color = gridColor;
                if (scales.x.ticks) scales.x.ticks.color = tickColor;
            }
            if (scales.y) {
                if (scales.y.grid) scales.y.grid.color = gridColor;
                if (scales.y.ticks) scales.y.ticks.color = tickColor;
            }
        }

        // Legend colors bhi update karo
        if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
            chart.options.plugins.legend.labels.color = style.getPropertyValue('--text-secondary').trim();
        }

        chart.update('none');
    }
}

// Chart register karne ka helper
function registerChart(chartInstance) {
    if (chartInstance) allCharts.push(chartInstance);
}


// ===== NAVIGATION =====
function navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
    });

    var navItem = document.querySelector('.nav-item[data-page="' + page + '"]');
    if (navItem) navItem.classList.add('active');

    document.querySelectorAll('.page-section').forEach(function(section) {
        section.classList.remove('active');
    });

    var pageSection = document.getElementById('page-' + page);
    if (pageSection) pageSection.classList.add('active');

    var info = pageTitles[page];
    if (info) {
        document.getElementById('pageTitle').textContent = info.title;
        document.getElementById('pageSubtitle').textContent = info.subtitle;
    }

    if (page === 'analytics') initAnalyticsCharts();
    if (page === 'cards') initCardChart();

    closeSidebar();
    document.getElementById('mainContent').scrollTop = 0;
}

document.querySelectorAll('.nav-item[data-page]').forEach(function(item) {
    item.addEventListener('click', function() {
        navigateTo(this.getAttribute('data-page'));
    });
});

document.querySelector('.sidebar-user').addEventListener('click', function() {
    navigateTo('account');
});


// ===== MOBILE SIDEBAR =====
var sidebar = document.getElementById('sidebar');
var overlay = document.getElementById('sidebarOverlay');

document.getElementById('mobileMenuBtn').addEventListener('click', function() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
});

overlay.addEventListener('click', closeSidebar);

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}


// ===== TOAST =====
function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    var iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = '<i class="fas ' + iconClass + '"></i> ' + message;
    container.appendChild(toast);

    setTimeout(function() {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}


// ===== HELPERS FOR CHART COLORS =====
function getChartGridColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--chart-grid').trim();
}

function getChartTickColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--chart-tick').trim();
}

function getChartLegendColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
}

function getChartScaleOptions(showXGrid) {
    return {
        x: {
            grid: { display: !!showXGrid, color: getChartGridColor() },
            ticks: { color: getChartTickColor(), font: { size: 11 }, maxRotation: 0 }
        },
        y: {
            grid: { color: getChartGridColor() },
            ticks: { color: getChartTickColor(), font: { size: 11 } }
        }
    };
}


// ===== RECENT ACTIVITY =====
function renderRecentActivity() {
    var container = document.getElementById('recentActivity');
    var recent = transactions.slice(0, 6);
    var html = '';

    for (var i = 0; i < recent.length; i++) {
        var t = recent[i];
        var amtColor = t.amount > 0 ? 'var(--accent)' : 'var(--text-primary)';
        var amtPre = t.amount > 0 ? '+' : '';
        html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-subtle);">';
        html += '<div style="width:38px;height:38px;border-radius:10px;background:' + t.iconBg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas ' + t.icon + '" style="font-size:14px;color:' + t.iconColor + ';"></i></div>';
        html += '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + t.name + '</div><div style="font-size:11px;color:var(--text-muted);">' + t.date + '</div></div>';
        html += '<div style="font-family:Space Grotesk;font-size:14px;font-weight:600;color:' + amtColor + ';flex-shrink:0;">' + amtPre + '$' + Math.abs(t.amount).toLocaleString() + '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}


// ===== TRANSACTIONS TABLE =====
function renderTransactions(filter) {
    filter = filter || 'all';
    var tbody = document.getElementById('transactionsBody');
    var filtered = transactions;

    if (filter === 'income')  filtered = transactions.filter(function(t) { return t.type === 'income'; });
    if (filter === 'expense') filtered = transactions.filter(function(t) { return t.type === 'expense'; });
    if (filter === 'pending') filtered = transactions.filter(function(t) { return t.status === 'pending'; });

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
        var t = filtered[i];
        var amtColor = t.amount > 0 ? 'var(--accent)' : 'var(--danger)';
        var amtPre = t.amount > 0 ? '+' : '-';
        var badge = t.status === 'completed'
            ? '<span class="badge badge-success"><i class="fas fa-check"></i> Completed</span>'
            : '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending</span>';

        // Find original index in transactions array
        var originalIndex = transactions.indexOf(t);

        html += '<tr>';
        html += '<td><div style="display:flex;align-items:center;gap:12px;"><div style="width:36px;height:36px;border-radius:10px;background:' + t.iconBg + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas ' + t.icon + '" style="font-size:13px;color:' + t.iconColor + ';"></i></div><span style="font-weight:600;">' + t.name + '</span></div></td>';
        html += '<td style="color:var(--text-secondary);">' + t.category + '</td>';
        html += '<td style="color:var(--text-secondary);">' + t.date + '</td>';
        html += '<td><span style="font-family:Space Grotesk;font-weight:600;color:' + amtColor + ';">' + amtPre + '$' + Math.abs(t.amount).toLocaleString() + '</span></td>';
        html += '<td>' + badge + '</td>';
        html += '<td><div style="display:flex;gap:6px;"><button class="btn btn-outline" style="padding:5px 10px;font-size:11px;" onclick="showToast(\'Details opened\',\'success\')"><i class="fas fa-eye"></i></button><button class="btn btn-outline" style="padding:5px 8px;font-size:11px;color:var(--danger);" onclick="deleteTransaction(' + originalIndex + ')"><i class="fas fa-trash"></i></button></div></td>';
        html += '</tr>';
    }
    tbody.innerHTML = html;
}

document.querySelectorAll('#page-transactions .filter-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
        document.querySelectorAll('#page-transactions .filter-chip').forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
        renderTransactions(this.dataset.filter);
    });
});


// ===== BUDGETS =====
function renderBudgets() {
    var container = document.getElementById('budgetList');
    var html = '';
    for (var i = 0; i < budgets.length; i++) {
        var b = budgets[i];
        var pct = Math.min((b.spent / b.limit) * 100, 100);
        var isOver = pct >= 90;
        var barClr = isOver ? 'var(--danger)' : b.color;
        var txtClr = isOver ? 'var(--danger)' : 'var(--text-secondary)';

        html += '<div style="display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid var(--border-subtle);">';
        html += '<div style="width:38px;height:38px;border-radius:10px;background:' + b.color + '15;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas ' + b.icon + '" style="color:' + b.color + ';font-size:14px;"></i></div>';
        html += '<div style="flex:1;min-width:0;"><div class="flex-between" style="margin-bottom:10px;"><span style="font-size:13px;font-weight:600;">' + b.name + '</span><span style="font-size:12px;color:' + txtClr + ';">$' + b.spent.toLocaleString() + ' / $' + b.limit.toLocaleString() + '</span></div><div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%;background:' + barClr + ';"></div></div></div>';
        html += '<div style="font-family:Space Grotesk;font-size:13px;font-weight:700;color:' + txtClr + ';min-width:38px;text-align:right;">' + Math.round(pct) + '%</div>';
        html += '<button class="btn btn-outline" style="padding:6px 10px;font-size:11px;flex-shrink:0;color:var(--danger);" onclick="deleteBudget(' + i + ')"><i class="fas fa-trash"></i></button>';
        html += '</div>';
    }
    container.innerHTML = html;
}


// ===== SAVINGS =====
function renderSavings() {
    var container = document.getElementById('savingsGoals');
    var html = '';
    for (var i = 0; i < savingsGoals.length; i++) {
        var g = savingsGoals[i];
        var pct = Math.round((g.saved / g.target) * 100);
        var circ = 2 * Math.PI * 48;
        var off = circ - (pct / 100) * circ;

        html += '<div class="card"><div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">';
        html += '<div class="savings-ring"><svg width="120" height="120"><circle cx="60" cy="60" r="48" fill="none" stroke="var(--border)" stroke-width="8"/><circle cx="60" cy="60" r="48" fill="none" stroke="' + g.color + '" stroke-width="8" stroke-dasharray="' + circ + '" stroke-dashoffset="' + off + '" stroke-linecap="round" style="transition:stroke-dashoffset 1s ease;"/></svg><div class="savings-ring-text"><span style="font-family:Space Grotesk;font-size:22px;font-weight:700;">' + pct + '%</span></div></div>';
        html += '<div style="flex:1;min-width:140px;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><i class="fas ' + g.icon + '" style="color:' + g.color + ';"></i><h4 style="font-size:15px;font-weight:600;">' + g.name + '</h4></div>';
        html += '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">$' + g.saved.toLocaleString() + ' of $' + g.target.toLocaleString() + '</div>';
        html += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">+$' + g.monthlyAdd + '/month</div>';
        html += '<div style="display:flex;gap:8px;">';
        html += '<button class="btn btn-outline" style="padding:6px 14px;font-size:12px;" onclick="addFundsGoal(' + i + ')"><i class="fas fa-plus"></i> Add Funds</button>';
        html += '<button class="btn btn-outline" style="padding:6px 10px;font-size:12px;color:var(--danger);" onclick="deleteSavingsGoal(' + i + ')"><i class="fas fa-trash"></i></button>';
        html += '</div></div></div></div>';
    }
    container.innerHTML = html;
}

// Add funds to savings goal
function addFundsGoal(index) {
    var amount = prompt('Enter amount to add:');
    if (amount && !isNaN(amount)) {
        savingsGoals[index].saved += parseFloat(amount);
        renderSavings();
        showToast('Added $' + amount + ' to ' + savingsGoals[index].name, 'success');
        addNotification('Savings Updated', 'Added $' + amount + ' to ' + savingsGoals[index].name);
    }
}


// ===== DASHBOARD CHARTS =====
function initDashboardCharts() {
    var revCtx = document.getElementById('revenueChart').getContext('2d');
    var grad = revCtx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, 'rgba(0, 230, 138, 0.2)');
    grad.addColorStop(1, 'rgba(0, 230, 138, 0.0)');

    revenueChartInstance = new Chart(revCtx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue',
                data: [1200, 1900, 1400, 2200, 1800, 2600, 2100],
                borderColor: '#00e68a',
                backgroundColor: grad,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#00e68a',
                pointBorderColor: '#0a0f1a',
                pointBorderWidth: 2,
                borderWidth: 2.5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: getChartScaleOptions(false),
            interaction: { intersect: false, mode: 'index' },
        }
    });
    registerChart(revenueChartInstance);

    var spCtx = document.getElementById('spendingChart').getContext('2d');
    spendingChartInstance = new Chart(spCtx, {
        type: 'doughnut',
        data: {
            labels: ['Housing', 'Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Health'],
            datasets: [{
                data: [890, 424, 124, 66, 130, 230, 50],
                backgroundColor: ['#ff4d6a', '#ffb84d', '#00e68a', '#4dc3ff', '#a78bfa', '#f472b6', '#34d399'],
                borderColor: 'var(--bg-card)',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: getChartLegendColor(), font: { size: 11 }, padding: 10, usePointStyle: true, pointStyleWidth: 8 }
                }
            }
        }
    });
    registerChart(spendingChartInstance);
}

// Revenue filter chips
document.querySelectorAll('#page-dashboard .filter-chip[data-range]').forEach(function(chip) {
    chip.addEventListener('click', function() {
        document.querySelectorAll('#page-dashboard .filter-chip[data-range]').forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');

        var range = this.dataset.range;
        var labels, data;
        if (range === 'week') { labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; data = [1200,1900,1400,2200,1800,2600,2100]; }
        else if (range === 'month') { labels = ['Week 1','Week 2','Week 3','Week 4']; data = [5200,6800,5900,7400]; }
        else { labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; data = [18200,21400,19800,24100,22300,25600,23900,27200,25400,28800,26100,30400]; }

        revenueChartInstance.data.labels = labels;
        revenueChartInstance.data.datasets[0].data = data;
        revenueChartInstance.update();
    });
});


// ===== ANALYTICS CHARTS =====
function initAnalyticsCharts() {
    if (analyticsInitialized) return;
    analyticsInitialized = true;

    var ieCtx = document.getElementById('incomeExpenseChart').getContext('2d');
    var c1 = new Chart(ieCtx, {
        type: 'bar',
        data: {
            labels: ['Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [
                { label: 'Income', data: [7800,8200,7900,8600,8100,8240], backgroundColor: 'rgba(0,230,138,0.7)', borderRadius: 6, barPercentage: 0.6 },
                { label: 'Expenses', data: [3200,3800,2900,3600,3100,3180], backgroundColor: 'rgba(255,77,106,0.7)', borderRadius: 6, barPercentage: 0.6 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: getChartLegendColor(), usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } } } },
            scales: getChartScaleOptions(false)
        }
    });
    registerChart(c1);

    var cfCtx = document.getElementById('cashFlowChart').getContext('2d');
    var cfGrad = cfCtx.createLinearGradient(0, 0, 0, 240);
    cfGrad.addColorStop(0, 'rgba(77,195,255,0.2)');
    cfGrad.addColorStop(1, 'rgba(77,195,255,0.0)');

    var c2 = new Chart(cfCtx, {
        type: 'line',
        data: {
            labels: ['Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [{
                label: 'Net Cash Flow',
                data: [4600,4400,5000,5000,5000,5060],
                borderColor: '#4dc3ff',
                backgroundColor: cfGrad,
                fill: true, tension: 0.4,
                pointRadius: 4, pointBackgroundColor: '#4dc3ff', pointBorderColor: '#0a0f1a', pointBorderWidth: 2, borderWidth: 2.5,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: getChartScaleOptions(false)
        }
    });
    registerChart(c2);

    var mcCtx = document.getElementById('monthlyCompChart').getContext('2d');
    var c3 = new Chart(mcCtx, {
        type: 'bar',
        data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [{
                label: 'Spending',
                data: [3180,3600,2900,3400,3100,3200,3200,3800,2900,3600,3100,3180],
                backgroundColor: function(ctx) { return ctx.raw > 3500 ? 'rgba(255,77,106,0.6)' : 'rgba(0,230,138,0.5)'; },
                borderRadius: 4,
                barPercentage: 0.5,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: getChartScaleOptions(false)
        }
    });
    registerChart(c3);
}


// ===== CARD SPENDING CHART =====
function initCardChart() {
    if (cardChartInit) return;
    cardChartInit = true;

    var ctx = document.getElementById('cardSpendingChart').getContext('2d');
    var c = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Platinum', 'Gold'],
            datasets: [{
                data: [3240, 4100],
                backgroundColor: ['rgba(0,230,138,0.8)', 'rgba(167,139,250,0.8)'],
                borderColor: 'var(--bg-card)',
                borderWidth: 4,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { color: getChartLegendColor(), usePointStyle: true, pointStyleWidth: 8, padding: 16, font: { size: 11 } } }
            }
        }
    });
    registerChart(c);
}


// ===== ACCOUNT SAVE =====
function saveAccount() {
    var name = document.getElementById('accName').value;
    var email = document.getElementById('accEmail').value;
    if (!name || !email) { showToast('Please fill in all required fields', 'error'); return; }
    showToast('Account information saved successfully', 'success');
}


// ===== TOPBAR BUTTONS =====
// Removed - now using onclick handlers in HTML

// YEH THEME BUTTON HAI — AB ACTUALLY KAAM KAREGA
document.getElementById('themeBtn').addEventListener('click', function() {
    toggleTheme();
});


// ===== BACKGROUND DOTS =====
function createBgDots() {
    var container = document.getElementById('bgDots');
    for (var i = 0; i < 25; i++) {
        var dot = document.createElement('div');
        dot.className = 'bg-dot';
        dot.style.left = Math.random() * 100 + '%';
        dot.style.animationDelay = Math.random() * 8 + 's';
        dot.style.animationDuration = (6 + Math.random() * 6) + 's';
        container.appendChild(dot);
    }
}


// ===== INIT =====
function init() {
    loadTheme();         // Theme load karo pehle
    createBgDots();
    renderRecentActivity();
    renderTransactions();
    renderBudgets();
    renderSavings();
    initDashboardCharts();
}

document.addEventListener('DOMContentLoaded', init);