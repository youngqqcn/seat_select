// 1. 加载区域数据
fetch("section-data.json")
    .then((res) => res.json())
    .then((data) => {
        // 等待SVG加载完成
        const svgObject = document.getElementById("venue-map");
        const tooltip = document.getElementById("tooltip");

        svgObject.addEventListener("load", function () {
            const svgDoc = svgObject.contentDocument;

            // 2. 为每个区域绑定事件
            const paths = svgDoc.querySelectorAll("path");
            let currentSelected = null;

            paths.forEach((path) => {
                // 获取区域编号（通过查找相邻的text元素）
                const textElement = path.previousElementSibling;
                if (textElement && textElement.tagName === "text") {
                    const sectionId = textElement.textContent.trim();

                    // 移除内联样式，让CSS生效
                    path.removeAttribute("style");

                    // 添加基础样式类
                    path.classList.add("section-path");

                    path_stoke_bak = path.style.stroke;
                    path_stokeWidth_bak = path.style.strokeWidth;

                    // 鼠标进入区域
                    path.addEventListener("mouseenter", (e) => {
                        // 添加hover类
                        path.classList.add("hover");
                        path.style.stroke = "#da00f7ff";
                        path.style.strokeWidth = "11";

                        // 将文字加粗
                        textElement.style.fontWeight = "bold";

                        // 显示工具提示
                        const detail = data[sectionId];
                        if (detail) {
                            tooltip.innerHTML = `
                <strong>区域 ${sectionId}</strong><br>
                排数: ${detail.row}<br>
                价格: ${detail.price}<br>
                余票: ${detail.ticketCount}张
              `;
                            tooltip.classList.add("show");

                            // 立即更新工具提示位置到鼠标位置
                            updateTooltipPosition(e);
                        }
                    });

                    // 鼠标离开区域
                    path.addEventListener("mouseleave", () => {
                        path.classList.remove("hover");
                        tooltip.classList.remove("show");

                        // 如果是点击选中的区域，则保持选中样式
                        if (currentSelected === path) {
                            path.classList.add("selected");
                            path.style.stroke = "#ff0000";
                            path.style.strokeWidth = "11";
                            textElement.style.fontWeight = "bold";
                            return;
                        } else {
                            path.style.stroke = path_stoke_bak;
                            path.style.strokeWidth = path_stokeWidth_bak;
                            textElement.style.fontWeight = "normal";
                        }
                    });

                    // 鼠标移动时实时更新工具提示位置
                    path.addEventListener("mousemove", (e) => {
                        updateTooltipPosition(e);
                    });

                    // 为路径添加点击事件
                    path.addEventListener("click", (e) => {
                        // 移除之前选中的区域的外边框
                        if (currentSelected) {
                            currentSelected.classList.remove("selected");
                            currentSelected.classList.remove("hover");

                            currentSelected.style.stroke = "";
                            currentSelected.style.strokeWidth = "";
                            textElement.style.fontWeight = "normal";
                        }

                        // 为当前点击的区域添加选中样式
                        path.classList.add("selected");
                        path.style.stroke = "#ff0000";
                        path.style.strokeWidth = "11";
                        textElement.style.fontWeight = "bold";
                        currentSelected = path;

                        // 隐藏工具提示
                        tooltip.classList.remove("show");

                        // 3. 从JSON中读取区域详情并渲染
                        const detail = data[sectionId];
                        if (detail) {
                            document.getElementById(
                                "section-detail"
                            ).innerHTML = `
                <h3>区域：${sectionId}</h3>
                <p><strong>排数：</strong>${detail.row}</p>
                <p><strong>价格：</strong><span class="price-highlight">${detail.price}</span></p>
                <p><strong>余票：</strong>${detail.ticketCount} 张</p>
                <p><strong>描述：</strong>${detail.description}</p>
                <p style="margin-top: 15px; font-size: 0.9em; color: #7f8c8d;">
                  <em>点击其他区域可切换查看</em>
                </p>
              `;
                        } else {
                            document.getElementById(
                                "section-detail"
                            ).innerHTML = `
                <h3>区域：${sectionId}</h3>
                <p>暂无详细信息</p>
              `;
                        }
                    });
                }
            });

            // 工具提示位置更新函数
            function updateTooltipPosition(e) {
                // 获取鼠标在页面中的位置
                const mouseX = e.clientX;
                const mouseY = e.clientY;

                // 获取窗口尺寸
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // 获取工具提示尺寸
                const tooltipWidth = tooltip.offsetWidth || 200;
                const tooltipHeight = tooltip.offsetHeight || 100;

                // 计算最佳位置（鼠标右下方15px，并向右移动100px）
                let left = mouseX + 240; // 向右移动100px
                let top = mouseY + 1;

                // 检查右侧边界
                if (left + tooltipWidth > windowWidth) {
                    left = mouseX - tooltipWidth - 15;
                }

                // 检查左侧边界
                if (left < 0) {
                    left = 15;
                }

                // 检查底部边界
                if (top + tooltipHeight > windowHeight) {
                    top = mouseY - tooltipHeight - 15;
                }

                // 检查顶部边界
                if (top < 0) {
                    top = 15;
                }

                // 更新工具提示位置
                tooltip.style.left = left + "px";
                tooltip.style.top = top + "px";
            }
        });
    })
    .catch((error) => {
        console.error("加载区域数据失败:", error);
        document.getElementById("section-detail").innerHTML = `
      <h3>错误</h3>
      <p>无法加载区域数据，请检查网络连接</p>
    `;
    });

// 添加额外的样式增强
document.addEventListener("DOMContentLoaded", function () {
    // 确保SVG加载后应用样式
    const style = document.createElement("style");
    style.textContent = `
    /* 确保SVG路径样式正确应用 */
    #venue-map path {
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
      cursor: pointer !important;
    }

    /* 强制应用hover效果 */
    #venue-map path:hover {
      stroke: url(#hoverGradient) !important;
      stroke-width: 5 !important;
      transform: scale(1.03) !important;
      filter: brightness(1.15) saturate(1.3) !important;
      fill-opacity: 0.6 !important;
    }

    /* 强制应用选中效果 */
    #venue-map path.selected {
      stroke: #ff0000 !important;
      stroke-width: 6 !important;
      transform: scale(1.02) !important;
      filter: brightness(1.1) !important;
      fill-opacity: 0.7 !important;
    }
  `;
    document.head.appendChild(style);
});
