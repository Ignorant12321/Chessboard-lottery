// 初始化
    let loaded_first = true;    // 是否是第一次加载
    let rows = 5;        // 行数
    let cols = 5;    // 列数
    let board = [];    // 棋盘数组
    let weights = [];    // 权重数组

    let drawnCount = 0; // 成功抽中次数
    let currentActions = 0; // 当前行动次数

    let maxActions = 250;    // 最大行动次数
    let firstWeight = 1;    // 先手权重
    let secondWeight = 4;    // 后手权重
    let settingsEnabled = true; // 设置是否可用

    let times = 10; // 模拟次数
    let geo_prob = 0.5; // 几何分布成功概率
    let draw_total_target = 28; // 目标抽签数量
    let winning_total_target = 19;  // 目标抽中数量
    let totalCells = 25;        // 总格子数

    // 元素组件
    const rows_element = document.getElementById('rows');
    const cols_element = document.getElementById('cols');
    const firstWeight_element = document.getElementById('first-weight');
    const secondWeight_element = document.getElementById('second-weight');
    const maxActions_element = document.getElementById('max-actions');
    const times_element = document.getElementById('times');
    const geo_meanDisplay = document.getElementById('geo-mean-val');
    const geo_varDisplay = document.getElementById('geo-var-val');
    const draw_total_element = document.getElementById('draw_total');
    const winning_total_element = document.getElementById('winning_total');
    const themeButton_element = document.getElementById('theme-toggle');

    // 滑块元素 & 输入框元素
    const lineChart_slider_element = document.getElementById('lineChart_slider');
    const lineChart_sliderTooltip_element = document.getElementById('lineChart_sliderTooltip');
    const lineChart_input_element = document.getElementById('lineChart_input');

    const success_prob_slider_element = document.getElementById('success_prob_slider');
    const success_prob_sliderTooltip_element = document.getElementById('success_prob_sliderTooltip');
    const success_prob_input_element = document.getElementById('success_prob_input');

    const pieChart_slider_element = document.getElementById("pieChart_slider");
    const pieChart_sliderTooltip_element = document.getElementById("pieChart_sliderTooltip");

    const densityChart_slider_element = document.getElementById("densityChart_slider");
    const densityChart_sliderTooltip_element = document.getElementById("densityChart_sliderTooltip");

    // 图表实例
    let lineChart = null;
    let pmf_Chart = null;
    let cdf_Chart = null;
    let scatterChart = null;
    let pieChart = null;
    let densityChart = null;

    // 图表上下文
    const ctx_lineChart = document.getElementById('lineChart').getContext('2d');
    const ctx_pmf = document.getElementById('pmf_Chart').getContext('2d');
    const ctx_cdf = document.getElementById('cdf_Chart').getContext('2d');
    const ctx_scatterChart = document.getElementById('scatterChart_tab3').getContext('2d');
    const ctx_pieChart = document.getElementById('pieChart_draw').getContext('2d');
    const ctx_densityChart = document.getElementById('scatterChart_winning').getContext('2d');

    // 数据存储
    let data_single = [{ x: 0, y: 0 }];
    let data_multiple_brief = [{ x: 0, y: 0 }];
    let data_multiple_full = [{ x: 0, y: 0 }];
    let data3_endPoint = [];

    // 初始化
    document.addEventListener("DOMContentLoaded", () => {
        initTheme(); // 初始化主题
        initEvents();   // 初始化事件监听
        resetBoard();   // 重置棋盘
        drawChart_line(); // 初始绘制折线图
        renderHeatmap(); // 初始绘制热力图
        resizeBoard(); // 初始缩放
        geo_init(); // 初始几何分布

        // 初始化输入值
        rows_element.value = rows;
        cols_element.value = cols;
        firstWeight_element.value = firstWeight;
        secondWeight_element.value = secondWeight;
        maxActions_element.value = maxActions;
        success_prob_input_element.value = geo_prob;
        draw_total_element.value = draw_total_target;
        winning_total_element.value = winning_total_target;


        // 移动端适配处理文案
        if (/Mobi|Android/i.test(navigator.userAgent)) {
            document.querySelectorAll('.tab-button').forEach(btn => {
                const text = btn.textContent;
                if (text.includes('设置')) btn.textContent = '⚙️设置';
                if (text.includes('分析')) btn.textContent = '✒️分析';
                if (text.includes('统计')) btn.textContent = '📈统计';
                if (text.includes('关于')) btn.textContent = 'ℹ️关于';
            });
        }
    });

    // 监听窗口大小改变，触发棋盘缩放
    window.addEventListener('resize', resizeBoard);

    /* =========================================
       主题控制
       ========================================= */
    function initTheme() {
        document.body.classList.remove('dark-mode');
        updateThemeUI();
        updateChartTheme();
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');

        updateThemeUI();
        updateChartTheme();

        // 强制重绘图表以应用新颜色
        if (lineChart) lineChart.update();
        if (pmf_Chart) pmf_Chart.update();
        if (cdf_Chart) cdf_Chart.update();
        if (scatterChart) scatterChart.update();
        if (pieChart) pieChart.update();
        if (densityChart) densityChart.update();
        renderHeatmap(); // 更新热力图颜色
    }

    function updateThemeUI() {
        const isDark = document.body.classList.contains('dark-mode');
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            themeBtn.textContent = isDark ? '🌙' : '☀'; // 切换图标
        }
    }

    function updateChartTheme() {
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#a0aec0' : '#666';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;
        Chart.defaults.scale.grid.color = gridColor;
    }

    function initEvents() {
        // 输入监听
        [rows_element, cols_element, firstWeight_element, secondWeight_element, maxActions_element].forEach(el => {
            el.addEventListener('input', () => {
                updateValue();
                updateLimit(); // 限制更新需要重新计算
                renderHeatmap(); // 重新渲染
                geo_update();
            });
        });

        // 棋盘规格变化时也要重新缩放
        rows_element.addEventListener('input', () => setTimeout(resizeBoard, 100));
        cols_element.addEventListener('input', () => setTimeout(resizeBoard, 100));

        times_element.addEventListener('input', updateValue);

        // 为所有 type="number" 的输入框添加滚轮支持
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('wheel', function (e) {
                e.preventDefault(); // 防止页面滚动

                const step = parseFloat(this.step) || 1;
                const min = parseFloat(this.min);
                const max = parseFloat(this.max);
                let val = parseFloat(this.value) || 0;

                const precision = (step.toString().split('.')[1] || '').length;

                if (e.deltaY < 0) {
                    val += step; // 向上滚动增加
                } else {
                    val -= step; // 向下滚动减少
                }

                // 解决浮点数精度问题 (核心修复)
                // 将结果格式化为指定小数位，再转回数字
                val = parseFloat(val.toFixed(precision));

                // 检查范围
                if (!isNaN(min) && val < min) val = min;
                if (!isNaN(max) && val > max) val = max;

                this.value = val;

                this.dispatchEvent(new Event('input'));
            }, { passive: false });
        });

        // 选项卡切换
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');

                if (tabId === 'tab-stats' && loaded_first) {
                    getdata_3_mul(times);
                    loaded_first = false;
                }
                // 平滑滚动
                document.querySelector(".tabs-section").scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'      // 滚动到选项卡的顶部
                });
                toggle_sponsorImg(true);
            });
        });

        // =======================
        // 折线图滑块逻辑 (Line)
        // =======================
        lineChart_slider_element.addEventListener('input', function () {
            let val = Math.round(this.value);
            lineChart_input_element.value = Math.round(this.value);
            updateSliderTooltip(this, lineChart_sliderTooltip_element, this.value);
            drawChart_line_update(lineChart, data_single.slice(0, val + 1));
        });

        // 折线图输入框逻辑
        lineChart_input_element.addEventListener('input', function () {
            let val = parseInt(this.value);
            lineChart_slider_element.value = val;
            drawChart_line_update(lineChart, data_single.slice(0, val + 1));
        });


        // =======================
        // 几何分布滑块逻辑 (Geo)
        // =======================
        success_prob_slider_element.addEventListener('input', function () {
            geo_prob = parseFloat(this.value).toFixed(4);
            success_prob_input_element.value = geo_prob;
            updateSliderTooltip(this, success_prob_sliderTooltip_element, this.value);
            success_prob_sliderTooltip_element.textContent = (geo_prob * 100).toFixed(2) + '%';
            geo_update();
        });

        success_prob_input_element.addEventListener('input', function () {
            geo_prob = parseFloat(this.value).toFixed(4);
            success_prob_slider_element.value = geo_prob;
            geo_update();
        });

        // =======================
        // 饼图滑块逻辑 (Pie)
        // =======================
        pieChart_slider_element.addEventListener('input', function () {
            draw_total_target = Math.round(this.value);
            draw_total_element.value = draw_total_target;
            updateSliderTooltip(this, pieChart_sliderTooltip_element, this.value);
            drawChart_pie();
        });

        draw_total_element.addEventListener('input', function () {
            draw_total_target = parseInt(this.value);
            pieChart_slider_element.value = draw_total_target;
            drawChart_pie();
        });

        // =======================
        // 密度图滑块逻辑 (Density)
        // =======================
        densityChart_slider_element.addEventListener('input', function () {
            winning_total_target = Math.round(this.value);
            winning_total_element.value = winning_total_target;
            updateSliderTooltip(this, densityChart_sliderTooltip_element, this.value);
            drawChart_density();
        });

        winning_total_element.addEventListener('input', function () {
            winning_total_target = parseInt(this.value);
            densityChart_slider_element.value = winning_total_target;
            drawChart_density();
        });
    }

    /* =========================================
       游戏核心逻辑
       ========================================= */

    const table = document.getElementById("chessboard");

    function createBoard() {
        table.innerHTML = "";
        for (let i = 0; i < rows; i++) {
            const row = document.createElement("tr");
            board[i] = [];
            for (let j = 0; j < cols; j++) {
                const cell = document.createElement("td");
                cell.id = `cell-${i}-${j}`;
                cell.dataset.value = "0";
                row.appendChild(cell);
                board[i][j] = 0;
            }
            table.appendChild(row);
        }
        // 重建后立即计算缩放
        setTimeout(resizeBoard, 0);
    }

    // 棋盘缩放核心逻辑
    function resizeBoard() {
        const table = document.getElementById('chessboard');
        const container = document.querySelector('.board-panel');

        if (!container || !table) return; // 确保元素存在

        // 1. 先重置 transform，获取原始尺寸
        table.style.transform = 'none';

        let naturalWidth = table.offsetWidth;
        let naturalHeight = table.offsetHeight;
        let naturalSize = Math.min(naturalWidth, naturalHeight);

        // 2. 获取容器尺寸（不再使用 viewport 尺寸）
        const cw = container.clientWidth;
        const ch = container.clientHeight;

        // 3. 计算目标尺寸
        // 需求："基于距离容器的最短长或宽" -> 目标是 80% 的最短边
        const shortestSide = Math.min(cw, ch);
        const targetSize = shortestSide * 0.8;

        // 4. 计算缩放比例
        const scale = targetSize / naturalSize;

        // 5. 应用缩放
        table.style.transform = `scale(${scale})`;

    }

    function performAction() {
        if (drawnCount >= totalCells) return;

        const [row, col] = selectCell(board);
        const cellElement = document.getElementById(`cell-${row}-${col}`);
        board[row][col]++;
        currentActions++;
        cellElement.textContent = board[row][col];

        if (board[row][col] === 1) {
            drawnCount++;
        }

        // 格子颜色逻辑
        if (board[row][col] <= 5) {
            let alpha = Math.min(0.2 + board[row][col] * 0.1, 1);
            cellElement.style.backgroundColor = `rgba(255, 235, 59, ${alpha})`; // 黄
            cellElement.style.color = '#333'; // 确保浅色背景下文字可见
        } else if (board[row][col] <= 10) {
            let alpha = Math.min(0.2 + (board[row][col] - 5) * 0.1, 1);
            cellElement.style.backgroundColor = `rgba(255, 165, 0, ${alpha})`; // 橙
            cellElement.style.color = '#333';
        } else {
            let alpha = Math.min(0.2 + (board[row][col] - 10) * 0.1, 1);
            cellElement.style.backgroundColor = `rgba(255, 87, 34, ${alpha})`; // 红
            cellElement.style.color = '#fff'; // 深色背景下文字变白
        }

        // 动画
        cellElement.classList.remove("red-border");
        void cellElement.offsetWidth;
        cellElement.classList.add("red-border");

        updateStats();
        disableSettings();
        push_data_single(currentActions, drawnCount);

        // 更新折线图范围
        lineChart_slider_element.max = currentActions;
        lineChart_slider_element.value = currentActions;
        lineChart_input_element.max = currentActions;
        lineChart_input_element.value = currentActions;

        drawChart_line();
        checkGameEnd();
    }

    function selectCell(array) {
        weights = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                weights.push(array[i][j] === 0 ? firstWeight : secondWeight);
            }
        }

        let totalWeight = weights.reduce((acc, cur) => acc + cur, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                random -= weights[i * cols + j];
                if (random <= 0) {
                    return [i, j];
                }
            }
        }
        console.error("未找到合适的格子");
        return [0, 0];
    }

    function resetBoard() {
        board = [];
        drawnCount = 0;
        currentActions = 0;
        updateValue(); // 确保使用当前设置
        init_data_single();
        createBoard();
        markGenerate(1, totalCells, 6);
        updateStats();
        enableSettings();

        // 重置折线图滑块
        lineChart_slider_element.max = 0.1; // 重置为小值
        lineChart_slider_element.value = 0;
        lineChart_input_element.max = 0;
        lineChart_input_element.value = 0;

        drawChart_line();
    }

    function checkGameEnd() {
        if (drawnCount === totalCells) {
            showCustomDialog("恭喜：", ["所有方格已翻转！"]);
        } else if (currentActions >= maxActions) {
            // 强制翻开
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (board[i][j] === 0) {
                        // board[i][j] = 1;
                        const el = document.getElementById(`cell-${i}-${j}`);
                        el.textContent = "-";
                        el.style.backgroundColor = "rgba(45, 206, 137, 0.3)";
                        el.style.color = "var(--text-main)";
                    }
                }
            }
            drawnCount = totalCells;
            updateStats();
            showCustomDialog("提示：", ["行动次数已达到上限", "已强制翻转剩余格子"]);
        }
    }

    function nextProb(drawnCount) {
        const uncollected = totalCells - drawnCount;
        // 总权重 = 未收集个数 * 未收集权重 + 已收集个数 * 已收集权重
        let totalW = (uncollected * firstWeight) + (drawnCount * secondWeight);
        // 抽中新格子概率 = 所有未收集格子的权重之和 / 总权重
        let prob = (uncollected * firstWeight) / totalW;
        return prob;
    }

    function toggleProbDisp() {
        const el = document.getElementById("prob-badge");
        el.style.visibility = (el.style.visibility === 'visible') ? 'hidden' : 'visible';
    }

    function updateStats() {
        document.getElementById("drawn-count").textContent = drawnCount;
        document.getElementById("current-actions").textContent = currentActions;
        document.getElementById("progress-value").textContent = parseInt(drawnCount / totalCells * 100) + "%";
        document.getElementById('next-prob').textContent = (nextProb(drawnCount) * 100).toFixed(2) + "%";
        updateProgress();
    }

    function updateValue() {
        rows = parseInt(rows_element.value);
        cols = parseInt(cols_element.value);
        totalCells = rows * cols;
        firstWeight = parseInt(firstWeight_element.value);
        secondWeight = parseInt(secondWeight_element.value);
        maxActions = parseInt(maxActions_element.value);
        times = parseInt(times_element.value);
        renderHeatmap();
        geo_update();
    }

    function updateLimit() {
        // 更新统计图表的滑块上限
        loaded_first = true;
        draw_total_element.max = maxActions;
        pieChart_slider_element.max = maxActions;

        winning_total_element.max = totalCells;
        densityChart_slider_element.max = totalCells;

        // 强制重绘
        if (!settingsEnabled) return; // 如果正在游戏中，不强制刷新图表以免影响
    }

    function toggleSettings(object, flag) {
        object.disabled = flag;
        object.style.opacity = flag ? 0.5 : 1;
    }
    function enableSettings() {
        [rows_element, cols_element, firstWeight_element, secondWeight_element, maxActions_element].forEach(el => toggleSettings(el, false));
        settingsEnabled = true;
    }
    function disableSettings() {
        if (settingsEnabled) {
            [rows_element, cols_element, firstWeight_element, secondWeight_element, maxActions_element].forEach(el => toggleSettings(el, true));
            settingsEnabled = false;
        }
    }

    // =========================================
    // 热力图渲染函数 (Heatmap Logic)
    // =========================================
    function renderHeatmap() {
        const container = document.getElementById('heatmap-container');
        if (!container) return;
        container.innerHTML = '';
        let cumulativeExpectation = 0;

        // 设置 Grid 列数
        container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        for (let step = 1; step <= totalCells; step++) {
            const countFound = step - 1;
            const countUnfound = totalCells - countFound;
            const prob = nextProb(countFound);  // 当前步成功概率
            let expectedVal = prob > 0 ? (1 / prob) : 0;    // 当前步期望值
            cumulativeExpectation += expectedVal;   // 累计期望值

            // 格式化数据
            const probFull = (prob * 100).toFixed(2);
            const expStr = expectedVal.toFixed(1);
            const cumStr = cumulativeExpectation.toFixed(1);

            // 3. 颜色算法 (Morandi 风格优化)
            // ratio: 0 (低概率, 蓝/灰) -> 1 (高概率, 红/橙)
            // 使用开根号让颜色分布更均匀，避免大部分都是同一种颜色
            // 色相: 215(灰蓝) -> 10(暖红)
            // 饱和度: 低概率时低饱和(15%) -> 高概率时中高饱和(65%)
            // 亮度: 保持在 85% -> 75% 之间，看起来柔和
            // 自动计算文字颜色 (根据背景深浅，这里背景偏亮，统一用深色字，特定色相加深)
            const ratio = Math.pow(prob, 0.6);
            const hue = 215 - (ratio * 205);
            const sat = 15 + (ratio * 50);
            const light = 85 - (ratio * 10);
            const bgColor = `hsl(${hue}, ${sat}%, ${light}%)`;
            const textHue = hue;
            const textColor = `hsl(${textHue}, 40%, 30%)`;

            // 4. 创建 DOM 元素
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.style.backgroundColor = bgColor;
            cell.style.color = textColor;

            // 添加入场动画延迟 (stagger animation)
            // 每个格子延迟 5ms，形成波浪效果
            cell.style.animationDelay = `${step * 5}ms`;

            // 绑定点击事件：更新几何分布
            cell.onclick = function () {
                geo_prob = prob.toFixed(4);
                geo_update();

                // 滚动到几何分布区域
                const geoSection = document.getElementById('geo');
                if (geoSection) {
                    geoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // 添加高亮闪烁效果
                    geoSection.style.transition = 'box-shadow 0.3s';
                    geoSection.style.boxShadow = '0 0 15px rgba(94, 114, 228, 0.5)';
                    setTimeout(() => {
                        geoSection.style.boxShadow = 'none';
                    }, 1000);
                }
            };

            cell.innerHTML = `
            <span class="cell-idx">${step}</span>
            <span class="cell-prob">${probFull}%</span>
            
            <div class="heatmap-tooltip">
                <div class="tooltip-header">
                    <span>目标位置</span>
                    <span class="step-highlight">#${step}</span>
                </div>

                <div class="tooltip-stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">未中项</span>
                        <span class="stat-value">${countUnfound}</span>
                    </div>
                    <div class="tooltip-divider"></div>
                    <div class="stat-item">
                        <span class="stat-label">已中中项</span>
                        <span class="stat-value">${countFound}</span>
                    </div>
                </div>

                <div class="tooltip-stats-grid" style="margin-bottom:0;">
                    <div class="stat-item">
                        <span class="stat-label">当前期望</span>
                        <span class="stat-value">${expStr}</span>
                    </div>
                    <div class="tooltip-divider"></div>
                    <div class="stat-item">
                        <span class="stat-label">累计期望</span>
                        <span class="stat-value">${cumStr}</span>
                    </div>
                </div>

                <div class="tooltip-footer">
                    <span>成功率</span>
                    <b>${probFull}%</b>
                </div>
            </div>
        `;
            container.appendChild(cell);
        }
    }

    /* =========================================
   几何分布
   ========================================= */
    function geo_init() {
        geo_update();
    }

    function geo_calculateDistribution(p) {
        const labels = [];
        const pmfData = [];
        const cdfData = [];

        let currentCDF = 0;
        let k = 1;

        // 【核心修复】：动态循环
        // 条件：当累计概率小于 99.99% 时继续生成
        // 安全熔断：k <= 10000 (防止 p 极小时死循环卡死浏览器)
        while (currentCDF < 0.9999 && k <= 10000) {
            // 几何分布公式: P(X=k) = (1-p)^(k-1) * p
            const prob = Math.pow(1 - p, k - 1) * p;

            currentCDF += prob;

            // 修正浮点数可能导致的微小溢出 (e.g. 1.00000000002)
            if (currentCDF > 1) currentCDF = 1;

            labels.push(k);
            pmfData.push(prob);
            cdfData.push(currentCDF);

            k++;
        }

        return { labels, pmfData, cdfData };
    }

    function geo_updateStats(p) {
        const mean = 1 / p;
        const variance = (1 - p) / Math.pow(p, 2);
        geo_meanDisplay.textContent = mean.toFixed(2);
        geo_varDisplay.textContent = variance.toFixed(2);
        // 确保输入框显示的值与实际计算值一致
        if (document.activeElement !== success_prob_input_element) {
            success_prob_input_element.value = parseFloat(p);
        }
    }

    function geo_update() {
        const p = geo_prob; // 假设 geo_prob 是全局变量或已正确获取
        geo_updateStats(p);
        const data = geo_calculateDistribution(p);

        // 通用的 Tooltip 回调配置
        const tooltipCallbacks = {
            title: (ctx) => `试验次数: ${ctx[0].label}`,
            label_pmf: (context) => "概率质量：" + (context.raw * 100).toFixed(2) + '%',
            label_cdf: (context) => "累计概率：" + (context.raw * 100).toFixed(2) + '%'
        };

        // --- PMF Chart ---
        if (pmf_Chart) {
            pmf_Chart.data.labels = data.labels;
            pmf_Chart.data.datasets[0].data = data.pmfData;
            // 确保更新配置以免 Tooltip 格式失效
            pmf_Chart.options.plugins.tooltip.callbacks.title = tooltipCallbacks.title;
            pmf_Chart.options.plugins.tooltip.callbacks.label = tooltipCallbacks.label_pmf;
            // 更新 Y 轴刻度逻辑
            pmf_Chart.options.scales.y.max = p > 0.5 ? 1.0 : undefined;
            pmf_Chart.update();
        } else {
            pmf_Chart = new Chart(ctx_pmf, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.pmfData,
                        backgroundColor: 'rgba(94, 114, 228, 0.7)',
                        borderColor: 'rgba(94, 114, 228, 1)',
                        borderWidth: 1,
                        barPercentage: 0.6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: tooltipCallbacks.title,
                                label: tooltipCallbacks.label_pmf
                            },
                        },
                        legend: { display: false },
                    },
                    scales: {
                        y: { beginAtZero: true, max: p > 0.5 ? 1.0 : undefined },
                        x: { display: true }
                    }
                }
            });
        }

        // --- CDF Chart ---
        if (cdf_Chart) {
            cdf_Chart.data.labels = data.labels;
            cdf_Chart.data.datasets[0].data = data.cdfData;
            // 确保更新配置以免 Tooltip 格式失效
            cdf_Chart.options.plugins.tooltip.callbacks.title = tooltipCallbacks.title;
            cdf_Chart.options.plugins.tooltip.callbacks.label = tooltipCallbacks.label_cdf;
            cdf_Chart.update();
        } else {
            cdf_Chart = new Chart(ctx_cdf, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.cdfData,
                        borderColor: 'rgba(45, 206, 137, 1)',
                        backgroundColor: 'rgba(45, 206, 137, 0.1)',
                        borderWidth: 2,
                        pointRadius: 2,
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: tooltipCallbacks.title,
                                label: tooltipCallbacks.label_cdf
                            },
                        },
                        legend: { display: false },
                    },
                    scales: {
                        y: { beginAtZero: true, max: 1.05 },
                        x: { display: true }
                    }
                }
            });
        }
    }

    /* =========================================
   进度条与烟花
   ========================================= */
    let marks_elements = [];

    function markGenerate(min, max, num) {
        const container = document.querySelector('.progress-marks');
        container.innerHTML = '';

        const step = (max - min) / (num - 1);
        const marks = [];
        for (let i = 0; i < num; i++) marks.push(Math.round(min + i * step));
        if (!marks.includes(max)) marks[marks.length - 1] = max;

        const uniqueMarks = [...new Set(marks)].sort((a, b) => a - b);

        marks_elements = uniqueMarks.map(val => {
            const mark = document.createElement('div');
            mark.className = 'mark';
            mark.dataset.value = val;
            mark.textContent = val; // 新增：圆点内部显示数字

            const fw = document.createElement('div');
            fw.className = 'firework';
            mark.appendChild(fw);

            // 位置计算 (0% - 100%)
            const leftPct = (val / max) * 100;
            mark.style.left = `${leftPct}%`;

            container.appendChild(mark);
            return mark;
        });
    }

    function updateProgress() {
        const pct = (drawnCount / totalCells) * 100;
        document.getElementById('progress-fill').style.width = `${pct}%`;

        let currentActiveVal = -1;

        // 找到小于等于当前进度的最大标记值
        marks_elements.forEach(mark => {
            const val = parseInt(mark.dataset.value);
            if (drawnCount >= val) {
                if (val > currentActiveVal) currentActiveVal = val;
            }
        });

        marks_elements.forEach(mark => {
            const val = parseInt(mark.dataset.value);

            if (val === currentActiveVal) {
                // 这是当前"正在激活/最新达成"的点 -> 样式：active (橙色+烟花)
                mark.classList.remove('passed'); // 移除 passed 状态
                mark.classList.add('active'); // 添加 active 状态

                // 只有当它之前不是active时才触发烟花（防止每次update都触发）
                // 但由于reset会清空，这里简单判断即可。
                // 为了保证烟花动画能重播，可以检测元素状态
                // 这里简化处理：每次进入Active状态都尝试触发
                const fw = mark.querySelector('.firework');
                if (fw.innerHTML === '') {
                    createFireworks(fw);
                }
            } else if (val < currentActiveVal) {
                // 这是以前达成过的点 -> 样式：passed (绿色，无烟花)
                mark.classList.remove('active'); // 移除 active 状态
                mark.classList.add('passed'); // 添加 passed 状态
                mark.querySelector('.firework').innerHTML = ''; // 清除烟花
            } else {
                // 未来的点 -> 默认样式 (灰色)
                mark.classList.remove('active', 'passed');
                mark.querySelector('.firework').innerHTML = '';
            }
        });
    }

    // 烟花
    function createFireworks(container) {
        container.innerHTML = '';
        const colors = ['#f56565', '#4299e1', '#48bb78', '#ed8936', '#9f7aea'];
        for (let i = 0; i < 16; i++) {
            const p = document.createElement('div');
            p.className = 'firework-particle';
            const size = 3 + Math.random() * 5;
            p.style.width = size + 'px'; p.style.height = size + 'px';
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.left = '50%'; p.style.top = '50%';

            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 40;

            const anim = p.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(1.5)`, opacity: 0 }
            ], { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(0, .9, .57, 1)' });

            container.appendChild(p);
        }
    }

    /* =========================================
       数据管理
       ========================================= */

    // 单次统计
    function init_data_single() { data_single = [{ x: 0, y: 0 }]; }
    function push_data_single(x, y) { data_single.push({ x, y }); }
    function init_data_multiple() {
        data_multiple_brief = [{ x: 0, y: 0 }];
        data_multiple_full = [{ x: 0, y: 0 }];
        data3_endPoint = [];
    }

    // 运行统计函数
    function runStats() {
        const N = parseInt(document.getElementById('times').value);
        getdata_3_mul(N);
    }

    // 统计函数
    function getdata_3_mul(N) {
        init_data_multiple();

        for (let round = 0; round < N; round++) {

            let tempBoard = Array.from({ length: rows }, () => new Array(cols).fill(0));
            let uniqueFound = 0, currentStep = 0;
            let ended = false;

            while (!ended) {

                let totalW = 0;
                // 第一次遍历：计算总权重
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        totalW += (tempBoard[r][c] === 0 ? firstWeight : secondWeight);
                    }
                }

                let rand = Math.random() * totalW;
                let r = 0, c = 0;

                // 第二次遍历：根据随机数确定位置
                // 使用 label 跳出双层循环
                searchLoop:
                for (r = 0; r < rows; r++) {
                    for (c = 0; c < cols; c++) {
                        let weight = (tempBoard[r][c] === 0 ? firstWeight : secondWeight);
                        rand -= weight;
                        if (rand <= 0) {
                            break searchLoop;
                        }
                    }
                }
                // 边界保护：如果浮点数精度问题导致没选到，默认选最后一个（虽极罕见）
                if (r === rows) { r = rows - 1; c = cols - 1; }

                tempBoard[r][c]++;
                currentStep++;
                if (tempBoard[r][c] === 1) uniqueFound++;

                data_multiple_full.push({ x: currentStep, y: uniqueFound });

                if (tempBoard[r][c] === 1) data_multiple_brief.push({ x: currentStep, y: uniqueFound });

                // 结束条件
                if (uniqueFound === totalCells) {
                    data3_endPoint.push(currentStep);
                    ended = true;
                } else if (currentStep >= maxActions) {
                    data_multiple_brief.push({ x: currentStep, y: totalCells });
                    data_multiple_full.push({ x: currentStep, y: totalCells });
                    ended = true;
                }
            }
        }

        // 绘制所有高级图表
        drawChart_scatter();
        drawChart_pie();
        drawChart_density();
    }

    /* =========================================
   数据处理
   ========================================= */

    // 气泡图数据处理
    function getBubbleChartData(data) {
        const countMap = {};
        data.forEach(item => {
            const key = `${item.x},${item.y}`;
            countMap[key] = (countMap[key] || 0) + 1;
        });
        return Object.keys(countMap).map(key => {
            const [x, y] = key.split(',');
            return { x: parseFloat(x), y: parseFloat(y), r: countMap[key] };
        });
    }
    // 散点图数据处理
    function getScatterChartData(data, p = false) {
        const countMap = {};
        data.forEach(item => { countMap[item] = (countMap[item] || 0) + 1; });
        const totalCount = data.length;
        return Object.keys(countMap).map(key => {
            let x = parseInt(key);
            let y = p ? (countMap[key] / totalCount * 100) : countMap[key];
            return { x, y };
        });
    }
    // 饼图数据处理
    function getPieChartData(data) {
        const countMap = getScatterChartData(data);
        const probabilities = countMap.map(item => ({
            y: item.x,
            count: item.y,
            probability: (item.y / data.length) * 100
        })).sort((a, b) => b.probability - a.probability);

        const yValues = probabilities.map(item => item.count);
        const labels = probabilities.map(item => `index: ${item.y}`);
        const colors = probabilities.map(() => getRandomColor([0, 360], [30, 70], [70, 90]));

        return {
            labels: labels,
            datasets: [{
                label: 'Value Distribution',
                data: yValues,
                backgroundColor: colors,
                borderColor: ['#fff'],
                borderWidth: 1,
                extra: probabilities
            }]
        };
    }
    // 累计概率数据处理
    function accumulatedProbability(data) {
        const sortedData = [...data].sort((a, b) => a.x - b.x);
        let cumulative = 0;
        return sortedData.map(item => {
            cumulative += item.y;
            return { x: item.x, y: item.y, r: cumulative };
        });
    }

    function filterData(data, targetValue, keyChecked, keySelected) {
        return data.filter(item => item[keyChecked] == targetValue).map(item => item[keySelected]);
    }

    function supplementData_draw(data, targetValue) {
        data3_endPoint.forEach(value => { if (targetValue > value) data.push(totalCells); });
    }

    function supplementData_winning(data, targetValue) {
        let supplementCount = targetValue - data.length;
        for (let i = 0; i < supplementCount; i++) data.push(maxActions);
    }

    function calculateStatistics(data) {
        if (data.length === 0) return { min: null, median: null, max: null };
        data.sort((a, b) => a - b);
        const medianValue = data.length % 2 === 0
            ? (data[data.length / 2 - 1] + data[data.length / 2]) / 2
            : data[Math.floor(data.length / 2)];
        return { min: data[0], median: medianValue, max: data[data.length - 1] };
    }

    // 生成随机颜色（HSL）
    function getRandomColor(hRange = [0, 360], sRange = [0, 100], lRange = [0, 100]) {
        const h = Math.floor(Math.random() * (hRange[1] - hRange[0])) + hRange[0];
        const s = Math.floor(Math.random() * (sRange[1] - sRange[0])) + sRange[0];
        const l = Math.floor(Math.random() * (lRange[1] - lRange[0])) + lRange[0];
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    /* =========================================
   图表绘制
   ========================================= */

    // 销毁图例
    function destroyChart(chartInstance) {
        if (chartInstance) chartInstance.destroy();
    }

    // 折线图绘制
    function drawChart_line() {
        if (!lineChart) {
            lineChart = drawChart_line_init("", ctx_lineChart, lineChart, data_single);
        } else {
            drawChart_line_update(lineChart, data_single);
        }
    }
    function drawChart_line_update(chartInstance, data) {
        chartInstance.data.labels = data.map(item => `(${item.x}, ${item.y})`);
        chartInstance.data.datasets[0].data = data;
        chartInstance.update();
    }
    function drawChart_line_init(titleName, ctx, chartInstance, data) {
        destroyChart(chartInstance);
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => `(${item.x}, ${item.y})`),
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(0, 120, 212,0.1)',
                    borderColor: 'rgba(0, 120, 212,0.6)',
                    borderWidth: 1,
                    radius: 3,
                    fill: true,
                    tension: 0.3,
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (ctx) => `Index: ${ctx[0].label}`,
                            label: (item) => 'Total: ' + item.raw.y.toFixed(0)
                        }
                    },
                    title: { display: !!titleName, text: titleName, position: 'bottom', font: { size: 14 } }
                },
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', position: 'bottom', ticks: { stepSize: 1, beginAtZero: true } },
                    y: { ticks: { stepSize: 1, beginAtZero: true, callback: (v) => v.toFixed(0) } }
                }
            }
        });
    }

    // 散点图绘制
    function drawChart_scatter() {
        let data = getBubbleChartData(data_multiple_brief);
        scatterChart = drawChart_scatter_init("", ctx_scatterChart, scatterChart, data);
    }
    function drawChart_scatter_init(titleName, ctx, chartInstance, data) {
        destroyChart(chartInstance);
        return new Chart(ctx, {
            type: 'scatter',
            data: {
                labels: data.map(item => `(${item.x}, ${item.y})`),
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(0, 120, 212,0.4)',
                    borderColor: 'rgba(0, 120, 212,0.6)',
                    borderWidth: 1,
                    radius: 3,
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (ctx) => ctx[0].label,
                            label: (item) => 'Count: ' + item.raw.r.toFixed(0)
                        }
                    },
                    title: { display: !!titleName, text: titleName, position: 'bottom', font: { size: 14 } }
                },
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', position: 'bottom', ticks: { stepSize: 1, beginAtZero: true } },
                    y: { ticks: { stepSize: 1, beginAtZero: true, callback: (v) => v.toFixed(0) } }
                }
            }
        });
    }
    // 饼图绘制
    let pieChart_data;
    function drawChart_pie_getData() {
        pieChart_data = filterData(data_multiple_full, draw_total_target, 'x', 'y');
        supplementData_draw(pieChart_data, draw_total_target);
    }
    function drawChart_pie() {
        drawChart_pie_getData();
        drawChart_pie_textUpdate();
        let data = getPieChartData(pieChart_data);
        if (!pieChart) {
            pieChart = drawChart_pie_init("", ctx_pieChart, pieChart, data);
        } else {
            drawChart_pie_update(pieChart, data);
        }
    }
    function drawChart_pie_update(chartInstance, data) {
        chartInstance.data = data;
        chartInstance.update();
    }
    function drawChart_pie_textUpdate() {
        let data = calculateStatistics(pieChart_data);
        document.getElementById('d_min').textContent = `🔷最小值: ${data.min}`;
        document.getElementById('d_median').textContent = `⚖️中位数: ${data.median}`;
        document.getElementById('d_max').textContent = `🔶最大值: ${data.max}`;
    }
    function drawChart_pie_init(titleName, ctx, chartInstance, data, topN = 15) {
        destroyChart(chartInstance);
        return new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                plugins: {
                    legend: {
                        display: true, position: 'right',
                        labels: { filter: (item, data) => data.labels.indexOf(item.text) < topN }
                    },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                let d = item.dataset.extra[item.dataIndex];
                                let prob = d.probability % 1 === 0 ? d.probability.toFixed(1) : parseFloat(d.probability.toFixed(4));
                                return `Probability: ${prob}%`;
                            }
                        }
                    },
                    title: { display: !!titleName, text: titleName, position: 'bottom', font: { size: 14 } }
                },
                responsive: true, maintainAspectRatio: false
            }
        });
    }

    // 密度图绘制
    let densityChart_data;
    function drawChart_density_getData() {
        densityChart_data = filterData(data_multiple_brief, winning_total_target, 'y', 'x');
        supplementData_winning(densityChart_data, times);
    }
    function drawChart_density() {
        drawChart_density_getData();
        drawChart_density_textUpdate();
        let sData = getScatterChartData(densityChart_data, true);
        let data = accumulatedProbability(sData);
        if (!densityChart) {
            densityChart = drawChart_density_init("", ctx_densityChart, densityChart, data);
        } else {
            drawChart_density_update(densityChart, data);
        }
    }
    function drawChart_density_update(chartInstance, data) {
        chartInstance.data.datasets[0].data = data;
        chartInstance.data.labels = data.map(item => `(${item.x}, ${item.y})`);
        chartInstance.update();
    }
    function drawChart_density_textUpdate() {
        let data = calculateStatistics(densityChart_data);
        document.getElementById('w_min').textContent = `🔷最小值: ${data.min}`;
        document.getElementById('w_median').textContent = `⚖️中位数: ${data.median}`;
        document.getElementById('w_max').textContent = `🔶最大值: ${data.max}`;
    }
    function drawChart_density_init(titleName, ctx, chartInstance, data) {
        destroyChart(chartInstance);
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => `(${item.x}, ${item.y})`),
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(0, 120, 212,0.4)',
                    borderColor: 'rgba(0, 120, 212,0.6)',
                    borderWidth: 1,
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        displayColors: false, // 隐藏图例颜色块
                        callbacks: {
                            title: (ctx) => `Index: ${ctx[0].label}`,
                            label: (item) => [`🌟P: ${item.raw.y.toFixed(2)}%`, `🎡ACC: ${item.raw.r.toFixed(2)}%`]
                        }
                    },
                    title: { display: !!titleName, text: titleName, position: 'bottom', font: { size: 14 } }
                },
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', position: 'bottom', ticks: { stepSize: 1, beginAtZero: true } },
                    y: { ticks: { beginAtZero: true, callback: (v) => v.toFixed(0) + '%' } }
                }
            }
        });
    }

    // 滑块 Tooltip 逻辑
    const tooltipTimeouts = {}; // 用于存储每个滑块的定时器ID

    function updateSliderTooltip(slider, tooltip, val) {
        // 清除之前的定时器，防止在拖动过程中隐藏
        if (tooltipTimeouts[slider.id]) {
            clearTimeout(tooltipTimeouts[slider.id]);
        }

        tooltip.style.display = 'block';
        tooltip.textContent = Math.round(val);
        const pct = (val - slider.min) / (slider.max - slider.min);

        // 计算 left 位置 (让其跟随滑块移动)
        tooltip.style.left = `calc(${pct * 100}% + ${(0.5 - pct) * 18}px)`; // 18px 是 thumb 宽度

        // 设置新的定时器，停止操作2秒后隐藏
        tooltipTimeouts[slider.id] = setTimeout(() => {
            tooltip.style.display = 'none';
        }, 2000);
    }

    /* =========================================
        杂项
        ========================================= */

    function showCustomDialog(title, texts) {
        document.getElementById('headSpan').textContent = title;
        const container = document.getElementById('info_container');
        container.innerHTML = '';
        texts.forEach(t => {
            const p = document.createElement('p');
            p.textContent = t;
            container.appendChild(p);
        });
        document.getElementById('customDialog').style.display = 'flex';
    }

    document.getElementById('confirmButton').onclick = () => document.getElementById('customDialog').style.display = 'none';
    document.getElementById('retryButton').onclick = () => {
        document.getElementById('customDialog').style.display = 'none';
        resetBoard();
    };

    function toggle_sponsorImg(flag) {
        const img = document.getElementById('sponsorImg');
        if (flag === undefined) {
            flag = img.style.display === 'block';
        }
        img.style.display = flag ? 'none' : 'block';
    }
