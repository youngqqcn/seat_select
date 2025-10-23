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

                    // 鼠标进入区域
                    path.addEventListener("mouseenter", (e) => {
                        path.classList.add("hover");

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

                            // 更新工具提示位置
                            const rect = path.getBoundingClientRect();
                            const svgRect = svgObject.getBoundingClientRect();
                            tooltip.style.left =
                                rect.left + rect.width / 2 - 100 + "px";
                            tooltip.style.top = rect.top - 50 + "px";
                        }
                    });

                    // 鼠标离开区域
                    path.addEventListener("mouseleave", () => {
                        path.classList.remove("hover");
                        tooltip.classList.remove("show");
                    });

                    // 鼠标移动时更新工具提示位置
                    path.addEventListener("mousemove", (e) => {
                        const rect = path.getBoundingClientRect();
                        const svgRect = svgObject.getBoundingClientRect();
                        tooltip.style.left = e.clientX + 15 + "px";
                        tooltip.style.top = e.clientY - 50 + "px";
                    });

                    // 为路径添加点击事件
                    path.addEventListener("click", (e) => {
                        // 移除之前选中的区域的外边框
                        if (currentSelected) {
                            currentSelected.classList.remove("selected");
                        }

                        // 为当前点击的区域添加选中样式
                        path.classList.add("selected");
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
        });
    })
    .catch((error) => {
        console.error("加载区域数据失败:", error);
        document.getElementById("section-detail").innerHTML = `
      <h3>错误</h3>
      <p>无法加载区域数据，请检查网络连接</p>
    `;
    });
