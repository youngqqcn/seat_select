// 1. 加载区域数据
fetch("section-data.json")
    .then((res) => res.json())
    .then((data) => {
        // 2. 为每个区域绑定点击事件
        const sections = document.querySelectorAll("#venue-map g");
        let currentSelected = null;

        sections.forEach((section) => {
            const sectionId = section.getAttribute("data-section-id");

            section.addEventListener("click", () => {
                // 移除之前选中的区域的外边框
                if (currentSelected) {
                    currentSelected.classList.remove("selected");
                }

                // 为当前点击的区域添加选中样式
                section.classList.add("selected");
                currentSelected = section;

                // 3. 从JSON中读取区域详情并渲染
                const detail = data[sectionId];
                document.getElementById("section-detail").innerHTML = `
          <h3>区域：${sectionId}</h3>
          <p>排数：${detail.row}</p>
          <p>价格：${detail.price}</p>
          <p>余票：${detail.ticketCount} 张</p>
          <p>描述：${detail.description}</p>
        `;
            });
        });
    });
