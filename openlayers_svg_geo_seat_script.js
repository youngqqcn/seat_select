// 全局变量
let map;
let vectorLayer;
let sectionData = {};
let selectedSection = null;
let showLabels = true;
let svgLayer = null;
let showSVGBackground = true;
let svgExtent = null;
let labelLayer = null;

// 检查OpenLayers库是否加载
function checkOpenLayersLoaded() {
    if (typeof ol === "undefined") {
        console.error("OpenLayers库未正确加载，请检查CDN链接");
        alert("OpenLayers库加载失败，请检查网络连接");
        return false;
    }
    return true;
}

// 检查地图容器是否存在
function checkMapContainer() {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("地图容器元素 #map 不存在");
        alert("地图容器元素不存在，请检查HTML结构");
        return false;
    }
    return true;
}

// 初始化地图
function initMap() {
    console.log("开始初始化地图...");

    // 检查前置条件
    if (!checkOpenLayersLoaded() || !checkMapContainer()) {
        return;
    }

    try {
        // 创建地图实例，使用简单坐标系
        map = new ol.Map({
            target: "map",
            layers: [],
            view: new ol.View({
                center: [0, 0],
                zoom: 1,
            }),
            controls: [new ol.control.Zoom(), new ol.control.FullScreen()],
        });

        console.log("地图初始化成功");

        // 加载SVG背景
        loadSVGBackground();
    } catch (error) {
        console.error("地图初始化失败:", error);
        alert("地图初始化失败: " + error.message);
    }
}

// 加载SVG背景
function loadSVGBackground() {
    console.log("开始加载SVG背景...");

    if (!map) {
        console.error("地图对象未初始化");
        return;
    }

    if (!showSVGBackground) {
        if (svgLayer) {
            map.removeLayer(svgLayer);
            svgLayer = null;
        }
        // 即使不显示SVG背景，也要加载区域数据
        loadSectionData();
        return;
    }

    // 使用657537.geojson文件获取尺寸信息
    fetch("657537.geojson")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((geojsonData) => {
            console.log("GeoJSON数据加载成功");

            // 解析viewBox信息
            const viewBox = geojsonData.metadata.viewBox.split(",").map(Number);
            // viewBox格式: [minX, minY, width, height]
            const minX = viewBox[0];
            const minY = viewBox[1];
            const width = viewBox[2];
            const height = viewBox[3];

            console.log("viewBox信息:", { minX, minY, width, height });

            // 设置SVG边界
            svgExtent = [minX, minY, minX + width, minY + height];
            console.log("SVG边界:", svgExtent);

            // 创建自定义投影
            const customProjection = new ol.proj.Projection({
                code: "CUSTOM",
                units: "pixels",
                extent: svgExtent,
            });

            // 注册投影
            ol.proj.addProjection(customProjection);

            // 设置地图视图
            map.setView(
                new ol.View({
                    projection: customProjection,
                    center: ol.extent.getCenter(svgExtent),
                    zoom: 0,
                    extent: svgExtent,
                })
            );

            console.log("地图视图设置成功");

            // 创建SVG图片图层
            svgLayer = new ol.layer.Image({
                source: new ol.source.ImageStatic({
                    url: "657537.min.svg",
                    imageExtent: svgExtent,
                    projection: customProjection,
                }),
                opacity: 0.8,
            });

            map.addLayer(svgLayer);
            console.log("SVG图层添加成功");

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
    console.log("开始加载区域数据...");

    fetch("section-data.json")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log("区域数据加载成功");
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
    console.log("开始加载GeoJSON数据...");

    if (!map) {
        console.error("地图对象未初始化");
        return;
    }

    // 使用657537.geojson文件
    fetch("657537.geojson")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((geojsonData) => {
            console.log("GeoJSON数据加载成功");

            // 解析viewBox信息用于坐标转换
            const viewBox = geojsonData.metadata.viewBox.split(",").map(Number);
            const minX = viewBox[0];
            const minY = viewBox[1];
            const width = viewBox[2];
            const height = viewBox[3];

            console.log("坐标转换参数:", { minX, minY, width, height });

            // 创建自定义投影
            const customProjection = new ol.proj.Projection({
                code: "CUSTOM",
                units: "pixels",
                extent: [minX, minY, minX + width, minY + height],
            });

            // 注册投影
            ol.proj.addProjection(customProjection);

            // 如果SVG背景没有加载，设置地图边界
            if (!svgLayer) {
                svgExtent = [minX, minY, minX + width, minY + height];
                map.setView(
                    new ol.View({
                        projection: customProjection,
                        center: ol.extent.getCenter(svgExtent),
                        zoom: 0,
                        extent: svgExtent,
                    })
                );
            }

            // 坐标转换函数：将相对坐标(-1到1)转换为实际坐标
            function convertCoordinates(coords) {
                return coords.map((coord) => {
                    // 相对坐标范围是[-1, 1]，需要映射到实际SVG尺寸
                    const relativeX = parseFloat(coord[0]); // -1到1
                    const relativeY = parseFloat(coord[1]); // -1到1

                    // 将相对坐标转换为实际坐标
                    const actualX = minX + ((relativeX + 1) * width) / 2;
                    const actualY = minY + ((relativeY + 1) * height) / 2;

                    return [actualX, actualY]; // OpenLayers使用[x, y]格式
                });
            }

            // 转换GeoJSON坐标
            const convertedGeoJSON = JSON.parse(JSON.stringify(geojsonData));

            // 转换sources.section中的坐标
            if (convertedGeoJSON.sources && convertedGeoJSON.sources.section) {
                convertedGeoJSON.sources.section.features.forEach((feature) => {
                    if (feature.geometry && feature.geometry.coordinates) {
                        if (feature.geometry.type === "Polygon") {
                            feature.geometry.coordinates =
                                feature.geometry.coordinates.map((ring) =>
                                    convertCoordinates(ring)
                                );
                        } else if (feature.geometry.type === "MultiPolygon") {
                            feature.geometry.coordinates =
                                feature.geometry.coordinates.map((polygon) =>
                                    polygon.map((ring) =>
                                        convertCoordinates(ring)
                                    )
                                );
                        }
                    }
                });
            }

            // 创建矢量图层
            vectorLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: new ol.format.GeoJSON().readFeatures(
                        convertedGeoJSON.sources.section,
                        {
                            dataProjection: customProjection,
                            featureProjection: customProjection,
                        }
                    ),
                }),
                style: function (feature) {
                    return getSectionStyle(feature);
                },
            });

            map.addLayer(vectorLayer);
            console.log("矢量图层添加成功");

            // 创建标签图层
            labelLayer = new ol.layer.Vector({
                source: new ol.source.Vector(),
                style: function (feature) {
                    const sectionName =
                        feature.get("text") || feature.get("name");
                    return new ol.style.Style({
                        text: new ol.style.Text({
                            text: sectionName,
                            font: "bold 12px Arial",
                            fill: new ol.style.Fill({ color: "#2c3e50" }),
                            stroke: new ol.style.Stroke({
                                color: "#ffffff",
                                width: 3,
                            }),
                            offsetY: -20,
                        }),
                    });
                },
            });

            if (showLabels) {
                map.addLayer(labelLayer);
                addLabels(convertedGeoJSON, customProjection);
                console.log("标签图层添加成功");
            }

            // 添加交互事件
            setupMapInteractions();

            // 调整视图以适应内容
            setTimeout(() => {
                if (svgExtent) {
                    map.getView().fit(svgExtent, { padding: [50, 50, 50, 50] });
                    console.log("视图调整完成");
                }
            }, 100);
        })
        .catch((error) => {
            console.error("加载GeoJSON数据失败:", error);
            alert(
                "加载地图数据失败，请检查文件路径。错误信息: " + error.message
            );
        });
}

// 获取区域样式
function getSectionStyle(feature) {
    const sectionName =
        feature.get("name") || feature.get("text") || feature.getId();
    const sectionId = extractSectionId(sectionName);
    const isSelected = selectedSection === sectionId;

    // 使用GeoJSON中的颜色信息，如果存在
    const fillColor =
        feature.get("fill") || (isSelected ? "#ff0000" : "#3388ff");
    const strokeColor = feature.get("stroke") || "#000";

    return new ol.style.Style({
        fill: new ol.style.Fill({
            color: fillColor + (isSelected ? "cc" : "4d"), // 调整透明度
        }),
        stroke: new ol.style.Stroke({
            color: strokeColor,
            width: isSelected ? 4 : 2,
        }),
    });
}

// 提取区域ID用于显示
function extractSectionId(fullId) {
    if (typeof fullId === "string" && fullId.includes("_")) {
        const parts = fullId.split("_");
        return parts[0] || fullId;
    }
    return fullId || "Unknown";
}

// 添加标签
function addLabels(geojsonData, projection) {
    const features = geojsonData.sources.section.features;
    const labelSource = labelLayer.getSource();

    features.forEach((feature) => {
        if (feature.properties && feature.properties.polylabel) {
            const label = feature.properties.polylabel[0];
            const sectionId = feature.properties.id;
            const displayId = extractSectionId(sectionId);

            // 转换标签坐标
            const viewBox = geojsonData.metadata.viewBox.split(",").map(Number);
            const minX = viewBox[0];
            const minY = viewBox[1];
            const width = viewBox[2];
            const height = viewBox[3];

            const labelX = minX + ((parseFloat(label[0]) + 1) * width) / 2;
            const labelY = minY + ((parseFloat(label[1]) + 1) * height) / 2;

            const pointFeature = new ol.Feature({
                geometry: new ol.geom.Point([labelX, labelY]),
                text: displayId,
                name: displayId,
            });
            labelSource.addFeature(pointFeature);
        }
    });
}

// 设置地图交互
function setupMapInteractions() {
    // 添加点击事件
    map.on("click", function (evt) {
        const feature = map.forEachFeatureAtPixel(
            evt.pixel,
            function (feature) {
                return feature;
            }
        );

        if (feature && feature.getGeometry().getType() === "Polygon") {
            const sectionName =
                feature.get("name") || feature.get("text") || feature.getId();
            const sectionId = extractSectionId(sectionName);

            // 清除之前的选择
            if (selectedSection) {
                vectorLayer
                    .getSource()
                    .getFeatures()
                    .forEach((f) => {
                        f.setStyle(getSectionStyle(f));
                    });
            }

            // 设置新的选择
            selectedSection = sectionId;
            feature.setStyle(getSectionStyle(feature));

            // 显示区域详情
            showSectionDetail(sectionId, sectionName);
        }
    });

    // 添加鼠标悬停效果
    map.on("pointermove", function (evt) {
        const feature = map.forEachFeatureAtPixel(
            evt.pixel,
            function (feature) {
                return feature;
            }
        );

        if (feature) {
            map.getTargetElement().style.cursor = "pointer";
        } else {
            map.getTargetElement().style.cursor = "";
        }
    });
}

// 显示区域详情
function showSectionDetail(sectionId, sectionName) {
    const detailDiv = document.getElementById("section-detail");
    const sectionInfo = sectionData[sectionId] || {};

    detailDiv.innerHTML = `
        <h3>${sectionName}</h3>
        <p><strong>区域ID:</strong> ${sectionId}</p>
        ${
            sectionInfo.description
                ? `<p><strong>描述:</strong> ${sectionInfo.description}</p>`
                : ""
        }
        ${
            sectionInfo.capacity
                ? `<p><strong>容量:</strong> ${sectionInfo.capacity}人</p>`
                : ""
        }
        ${
            sectionInfo.price
                ? `<p class="price-highlight"><strong>价格:</strong> ¥${sectionInfo.price}</p>`
                : ""
        }
    `;
}

// 控制函数
function resetView() {
    if (svgExtent && map) {
        map.getView().fit(svgExtent, { padding: [50, 50, 50, 50] });
    }
}

function fitToSections() {
    if (vectorLayer && map) {
        const extent = vectorLayer.getSource().getExtent();
        map.getView().fit(extent, { padding: [50, 50, 50, 50] });
    }
}

function toggleLabels() {
    showLabels = !showLabels;
    if (labelLayer && map) {
        if (showLabels) {
            map.addLayer(labelLayer);
        } else {
            map.removeLayer(labelLayer);
        }
    }
}

function toggleSVG() {
    showSVGBackground = !showSVGBackground;
    // 重新加载地图
    if (svgLayer && map) {
        map.removeLayer(svgLayer);
        svgLayer = null;
    }
    if (vectorLayer && map) {
        map.removeLayer(vectorLayer);
        vectorLayer = null;
    }
    if (labelLayer && map) {
        map.removeLayer(labelLayer);
        labelLayer = null;
    }
    loadSVGBackground();
}

// 页面加载完成后初始化地图
document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM加载完成，开始初始化地图");
    initMap();
});
