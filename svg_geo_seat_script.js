// 全局变量
let map;
let geojsonLayer;
let sectionData = {};
let selectedSection = null;
let showLabels = true;
let svgLayer = null;
let showSVGBackground = true; // 默认显示SVG背景
let svgBounds = null;

// 初始化地图
function initMap() {
    // 创建地图实例
    map = L.map("map", {
        center: [0, 0],
        zoom: 1,
        crs: L.CRS.Simple, // 使用简单坐标系
        minZoom: -2,
        maxZoom: 5,
        zoomControl: false,
    });

    // 添加缩放控件到右下角
    L.control
        .zoom({
            position: "bottomright",
        })
        .addTo(map);

    // 加载SVG背景
    loadSVGBackground();
}

// 加载SVG背景
function loadSVGBackground() {
    if (!showSVGBackground) {
        if (svgLayer) {
            map.removeLayer(svgLayer);
            svgLayer = null;
        }
        // 即使不显示SVG背景，也要加载区域数据
        loadSectionData();
        return;
    }

    // 获取SVG图片的尺寸信息
    fetch("657537.geojson")
        .then((response) => response.json())
        .then((geojsonData) => {
            // 解析viewBox信息
            const viewBox = geojsonData.metadata.viewBox.split(",").map(Number);
            // viewBox格式: [minX, minY, width, height]
            const minX = viewBox[0];
            const minY = viewBox[1];
            const width = viewBox[2];
            const height = viewBox[3];

            // 设置SVG边界
            svgBounds = L.latLngBounds(
                [minY, minX], // 西南角
                [minY + height, minX + width] // 东北角
            );

            // 创建SVG图片图层
            svgLayer = L.imageOverlay("657537.min.svg", svgBounds, {
                opacity: 0.8,
                interactive: false,
            }).addTo(map);

            // 设置地图边界
            map.setMaxBounds(svgBounds);
            map.fitBounds(svgBounds);

            // 加载区域数据
            loadSectionData();
        })
        .catch((error) => {
            console.error("加载SVG背景失败:", error);
            // 即使SVG加载失败，也继续加载GeoJSON
            loadSectionData();
        });
}

// 加载区域数据
function loadSectionData() {
    fetch("section-data.json")
        .then((response) => response.json())
        .then((data) => {
            sectionData = data;
            loadGeoJSON();
        })
        .catch((error) => {
            console.error("加载区域数据失败:", error);
            sectionData = {};
            loadGeoJSON();
        });
}

// 加载GeoJSON数据
function loadGeoJSON() {
    fetch("657537.geojson")
        .then((response) => response.json())
        .then((geojsonData) => {
            // 解析viewBox信息用于坐标转换
            const viewBox = geojsonData.metadata.viewBox.split(",").map(Number);
            const minX = viewBox[0];
            const minY = viewBox[1];
            const width = viewBox[2];
            const height = viewBox[3];

            // 坐标转换函数：将相对坐标(-1到1)转换为实际坐标
            function convertCoordinates(coords) {
                return coords.map((coord) => {
                    // 相对坐标范围是[-1, 1]，需要映射到实际SVG尺寸
                    const relativeX = coord[0]; // -1到1
                    const relativeY = coord[1]; // -1到1

                    // 将相对坐标转换为实际坐标
                    const actualX = minX + ((relativeX + 1) * width) / 2;
                    const actualY = minY + ((1 - relativeY) * height) / 2;

                    return [actualY, actualX]; // Leaflet使用[lat, lng]格式
                });
            }

            // 如果SVG背景没有加载，设置地图边界
            if (!svgLayer) {
                const bounds = L.latLngBounds(
                    [minY, minX], // 西南角
                    [minY + height, minX + width] // 东北角
                );
                map.setMaxBounds(bounds);
                map.fitBounds(bounds);
            }

            // 创建GeoJSON图层，使用转换后的坐标
            geojsonLayer = L.geoJSON(geojsonData.sources.section, {
                pointToLayer: function (feature, latlng) {
                    // 处理点数据
                    return L.circleMarker(latlng);
                },
                style: function (feature) {
                    return getSectionStyle(feature);
                },
                coordsToLatLng: function (coords) {
                    // 转换单个坐标点
                    const relativeX = coords[0];
                    const relativeY = coords[1];
                    const viewBox = geojsonData.metadata.viewBox
                        .split(",")
                        .map(Number);
                    const minX = viewBox[0];
                    const minY = viewBox[1];
                    const width = viewBox[2];
                    const height = viewBox[3];

                    const actualX = minX + ((relativeX + 1) * width) / 2;
                    const actualY = minY + ((1 - relativeY) * height) / 2;

                    return L.latLng(actualY, actualX);
                },
                onEachFeature: function (feature, layer) {
                    // 为每个区域添加交互
                    setupSectionInteraction(feature, layer);

                    // 添加标签
                    if (showLabels && feature.properties.polylabel) {
                        const label = feature.properties.polylabel[0];
                        const sectionId = feature.properties.id;
                        const displayId = extractSectionId(sectionId);

                        // 转换标签坐标
                        const viewBox = geojsonData.metadata.viewBox
                            .split(",")
                            .map(Number);
                        const minX = viewBox[0];
                        const minY = viewBox[1];
                        const width = viewBox[2];
                        const height = viewBox[3];

                        const labelX = minX + ((label[0] + 1) * width) / 2;
                        const labelY = minY + ((1 - label[1]) * height) / 2;

                        L.marker([labelY, labelX], {
                            icon: L.divIcon({
                                className: "section-label",
                                html: `<div style="
                                    background: rgba(255,255,255,0.9);
                                    border: 2px solid #3498db;
                                    border-radius: 50%;
                                    width: 40px;
                                    height: 40px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-weight: bold;
                                    color: #2c3e50;
                                    font-size: 12px;
                                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                ">${displayId}</div>`,
                                iconSize: [40, 40],
                                iconAnchor: [20, 20],
                            }),
                        }).addTo(map);
                    }
                },
            }).addTo(map);
        })
        .catch((error) => {
            console.error("加载GeoJSON数据失败:", error);
            alert("加载地图数据失败，请检查文件路径");
        });
}

// 提取区域ID用于显示
function extractSectionId(fullId) {
    // 假设ID格式为 "数字_数字"，我们取第一个数字部分
    const parts = fullId.split("_");
    return parts[0] || fullId;
}

// 获取区域样式
function getSectionStyle(feature) {
    const sectionId = extractSectionId(feature.properties.id);
    const isSelected = selectedSection === sectionId;

    return {
        fillColor: isSelected ? "#ff0000" : "#3388ff",
        weight: isSelected ? 4 : 2,
        opacity: 1,
        color: isSelected ? "#ff0000" : "#3388ff",
        fillOpacity: isSelected ? 0.7 : 0.3,
        className: isSelected ? "selected-section" : "",
    };
}

// 设置区域交互
function setupSectionInteraction(feature, layer) {
    const sectionId = extractSectionId(feature.properties.id);

    // 鼠标悬停效果
    layer.on("mouseover", function (e) {
        if (sectionId !== selectedSection) {
            layer.setStyle({
                fillColor: "#ff6b35",
                color: "#ff6b35",
                fillOpacity: 0.5,
            });
        }

        // 显示工具提示
        const detail = sectionData[sectionId] || {};
        showTooltip(e.originalEvent, sectionId, detail);
    });

    layer.on("mouseout", function (e) {
        if (sectionId !== selectedSection) {
            layer.setStyle(getSectionStyle(feature));
        }
        hideTooltip();
    });

    // 点击选择
    layer.on("click", function (e) {
        selectSection(sectionId, feature, layer);
    });
}

// 选择区域
function selectSection(sectionId, feature, layer) {
    // 取消之前选中的区域
    if (selectedSection) {
        geojsonLayer.eachLayer(function (layer) {
            const layerSectionId = extractSectionId(
                layer.feature.properties.id
            );
            if (layerSectionId === selectedSection) {
                layer.setStyle(getSectionStyle(layer.feature));
            }
        });
    }

    // 设置新选中的区域
    selectedSection = sectionId;
    layer.setStyle(getSectionStyle(feature));

    // 更新详情显示
    updateSectionDetail(sectionId);
}

// 更新区域详情
function updateSectionDetail(sectionId) {
    const detail = sectionData[sectionId] || {
        row: "未知",
        price: "未知",
        ticketCount: 0,
        description: "暂无描述",
    };

    const detailElement = document.getElementById("section-detail");
    detailElement.innerHTML = `
                <h3>区域：${sectionId}</h3>
                <p>排数：${detail.row}</p>
                <p>价格：<span class="price-highlight">${detail.price}</span></p>
                <p>余票：${detail.ticketCount} 张</p>
                <p>描述：${detail.description}</p>
            `;
}

// 显示工具提示
function showTooltip(event, sectionId, detail) {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.innerHTML = `
        <strong>区域 ${sectionId}</strong><br>
        排数: ${detail.row || "未知"}<br>
        价格: ${detail.price || "未知"}<br>
        余票: ${detail.ticketCount || 0}张
    `;

    tooltip.style.position = "fixed";
    tooltip.style.left = event.clientX + 10 + "px";
    tooltip.style.top = event.clientY + 10 + "px";

    document.body.appendChild(tooltip);

    // 保存工具提示引用以便移除
    window.currentTooltip = tooltip;
}

// 隐藏工具提示
function hideTooltip() {
    if (window.currentTooltip) {
        document.body.removeChild(window.currentTooltip);
        window.currentTooltip = null;
    }
}

// 重置视图
function resetView() {
    if (svgBounds) {
        map.fitBounds(svgBounds);
    } else if (geojsonLayer) {
        map.fitBounds(geojsonLayer.getBounds());
    }
}

// 适应区域
function fitToSections() {
    if (geojsonLayer) {
        map.fitBounds(geojsonLayer.getBounds(), { padding: [20, 20] });
    }
}

// 切换标签显示
function toggleLabels() {
    showLabels = !showLabels;
    // 重新加载地图以更新标签显示
    if (map) {
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        if (showLabels && geojsonLayer) {
            // 重新加载GeoJSON来更新标签
            loadGeoJSON();
        }
    }
}

// 切换SVG背景显示
function toggleSVG() {
    showSVGBackground = !showSVGBackground;
    // 重新加载地图
    if (map) {
        map.eachLayer((layer) => {
            map.removeLayer(layer);
        });

        // 重新初始化地图
        initMap();
    }
}

// 页面加载完成后初始化地图
document.addEventListener("DOMContentLoaded", function () {
    initMap();
});

// 窗口大小变化时调整地图
window.addEventListener("resize", function () {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
});
