// 1. 加载区域数据
fetch("section-data.json")
    .then((res) => res.json())
    .then((data) => {
        // 等待SVG加载完成
        const svgObject = document.getElementById("venue-map");

        svgObject.addEventListener("load", function () {
            const svgDoc = svgObject.contentDocument;

            // 2. 为每个区域绑定点击事件
            const paths = svgDoc.querySelectorAll("path");
            let currentSelected = null;

            paths.forEach((path) => {
                // 获取区域编号（通过查找相邻的text元素）
                const textElement = path.previousElementSibling;
                if (textElement && textElement.tagName === "text") {
                    const sectionId = textElement.textContent.trim();

                    // 为路径添加点击事件
                    path.addEventListener("click", () => {
                        // 移除之前选中的区域的外边框
                        if (currentSelected) {
                            currentSelected.classList.remove("selected");
                        }

                        // 为当前点击的区域添加选中样式
                        path.classList.add("selected");
                        currentSelected = path;

                        // 3. 从JSON中读取区域详情并渲染
                        const detail = data[sectionId];
                        if (detail) {
                            document.getElementById(
                                "section-detail"
                            ).innerHTML = `
                <h3>区域：${sectionId}</h3>
                <p><strong>排数：</strong>${detail.row}</p>
                <p><strong>价格：</strong><span style="color: #e74c3c; font-weight: bold;">${detail.price}</span></p>
                <p><strong>余票：</strong>${detail.ticketCount} 张</p>
                <p><strong>描述：</strong>${detail.description}</p>
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

                    // 添加hover效果
                    path.addEventListener("mouseenter", () => {
                        path.classList.add("hover");
                    });

                    path.addEventListener("mouseleave", () => {
                        path.classList.remove("hover");
                    });
                }
            });
        });
    });
