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
                            currentSelected.style.stroke = "";
                            currentSelected.style.strokeWidth = "";
                        }

                        // 为当前点击的区域添加选中样式
                        path.style.stroke = "#ff0000";
                        path.style.strokeWidth = "3";
                        currentSelected = path;

                        // 3. 从JSON中读取区域详情并渲染
                        const detail = data[sectionId];
                        if (detail) {
                            document.getElementById(
                                "section-detail"
                            ).innerHTML = `
                <h3>区域：${sectionId}</h3>
                <p>排数：${detail.row}</p>
                <p>价格：${detail.price}</p>
                <p>余票：${detail.ticketCount} 张</p>
                <p>描述：${detail.description}</p>
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
                        path.style.stroke = "#333";
                        path.style.strokeWidth = "3";
                    });

                    path.addEventListener("mouseleave", () => {
                        if (path !== currentSelected) {
                            path.style.stroke = "";
                            path.style.strokeWidth = "";
                        }
                    });
                }
            });
        });
    });
