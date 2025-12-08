// 修改为全局变量
var live2dModel = null;
var gl = null;
var canvas = null;
var renderer = null;
var textureManager = null;
var modelHomeDir = '';
var modelSetting = null;
var cubismModel = null;
var cubismMoc = null;
var modelMatrix = null;
var animationFrameId = null;
var lastTime = null;

// 动作和表情相关
var expressions = {};
var motions = {};

// 纹理管理器
class TextureManager {
    constructor() {
        this.textures = new Map(); // 使用Map代替普通对象
    }

    async loadTexture(gl, url) {
        // 标准化URL以用作键值
        const normalizedUrl = url.replace(/\\/g, '/');
        
        // 如果纹理已经加载，直接返回
        if (this.textures.has(normalizedUrl)) {
            return this.textures.get(normalizedUrl);
        }

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => {
                try {
                    const texture = gl.createTexture();
                    if (!texture) {
                        reject(new Error('Failed to create WebGL texture'));
                        return;
                    }
                    
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                    gl.generateMipmap(gl.TEXTURE_2D);

                    this.textures.set(normalizedUrl, texture);
                    resolve(texture);
                } catch (e) {
                    reject(new Error(`Failed to process texture ${url}: ${e.message}`));
                }
            };
            image.onerror = (err) => {
                console.error("Failed to load texture:", url, err);
                reject(new Error(`Failed to load texture ${url}: ${err.message}`));
            };
            image.src = url;
        });
    }
    
    // 释放所有纹理
    releaseTextures(gl) {
        for (const texture of this.textures.values()) {
            gl.deleteTexture(texture);
        }
        this.textures.clear();
    }
    
    // 获取已加载的纹理数量
    getTextureCount() {
        return this.textures.size;
    }
}

// 初始化WebGL上下文
function initWebGL() {
    canvas = document.getElementById('live2d-canvas');
    if (!canvas) {
        console.error('Cannot find live2d-canvas element');
        return false;
    }

    try {
        gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.error('Unable to initialize WebGL');
            return false;
        }
        
        // 设置WebGL视口
        gl.viewport(0, 0, canvas.width, canvas.height);
        return true;
    } catch (e) {
        console.error('Error initializing WebGL:', e);
        return false;
    }
}

// 初始化Live2D Framework
function initLive2DFramework() {
    // 检查命名空间
    if (typeof Live2DCubismCore === 'undefined') {
        console.error('Live2D Core not loaded');
        return false;
    }
    
    if (typeof Live2DCubismFramework === 'undefined') {
        console.error('Live2D Framework not loaded');
        return false;
    }
    
    // 初始化Cubism Framework选项
    // 注意：需要根据实际的SDK版本调整命名空间
    let cubismOption;
    try {
        // 尝试不同的可能命名空间
        if (Live2DCubismFramework.Option) {
            cubismOption = new Live2DCubismFramework.Option();
        } else if (Live2DCubismCore.Rendering && Live2DCubismCore.Rendering.CubismRenderer) {
            cubismOption = new Live2DCubismCore.Rendering.CubismRenderer.RendererOption();
        } else if (Live2DCubismCore.CubismRenderer) {
            cubismOption = new Live2DCubismCore.CubismRenderer.RendererOption();
        } else {
            // 如果找不到确切的命名空间，则创建一个空的对象
            cubismOption = {};
            console.warn('Could not find CubismRenderer namespace, using empty options object');
        }
    } catch (e) {
        cubismOption = {};
        console.warn('Error creating RendererOption, using empty options object:', e);
    }
    
    // 启动Cubism Framework
    try {
        // 尝试不同的启动方式
        let startupResult = false;
        if (Live2DCubismFramework.CubismFramework && Live2DCubismFramework.CubismFramework.startUp) {
            startupResult = Live2DCubismFramework.CubismFramework.startUp(cubismOption);
        } else {
            console.warn('CubismFramework.startUp not found, assuming framework is ready');
            startupResult = true;
        }
        
        if (startupResult) {
            // 初始化Cubism Framework
            if (Live2DCubismFramework.CubismFramework && Live2DCubismFramework.CubismFramework.initialize) {
                Live2DCubismFramework.CubismFramework.initialize();
            }
            console.log('Live2D Framework initialized');
            return true;
        } else {
            console.error('Failed to start up Live2D Framework');
            return false;
        }
    } catch (e) {
        console.error('Error during Live2D Framework initialization:', e);
        return false;
    }
}

// 初始化Live2D
function initLive2D() {
    console.log('Initializing Live2D...');
    
    // 检查核心库是否加载
    if (typeof Live2DCubismCore === 'undefined') {
        const errorMsg = 'Live2D Core not loaded';
        console.error(errorMsg);
        return Promise.reject(errorMsg);
    }

    // 初始化WebGL
    if (!initWebGL()) {
        const errorMsg = 'Failed to initialize WebGL';
        console.error(errorMsg);
        return Promise.reject(errorMsg);
    }

    // 初始化Live2D Framework
    if (!initLive2DFramework()) {
        const errorMsg = 'Failed to initialize Live2D Framework';
        console.error(errorMsg);
        return Promise.reject(errorMsg);
    }

    // 初始化纹理管理器
    textureManager = new TextureManager();

    console.log('Live2D initialized on Web platform');
    return Promise.resolve();
}

// 加载模型设置文件
async function loadModelSetting(modelPath) {
    modelHomeDir = modelPath.substring(0, modelPath.lastIndexOf('/') + 1);
    const modelFileName = modelPath.substring(modelPath.lastIndexOf('/') + 1);
    
    try {
        const response = await fetch(modelPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        modelSetting = await response.json();
        console.log('Model setting loaded:', modelSetting);
        return modelSetting;
    } catch (e) {
        console.error('Error loading model setting:', e);
        throw e;
    }
}

// 加载MOC文件
async function loadMocFile(mocPath) {
    try {
        const response = await fetch(mocPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const mocByteArray = new Int8Array(arrayBuffer);
        cubismMoc = Live2DCubismFramework.CubismMoc.create(mocByteArray);
        console.log('MOC file loaded');
        return cubismMoc;
    } catch (e) {
        console.error('Error loading MOC file:', e);
        throw e;
    }
}

// 创建模型
function createModel() {
    try {
        cubismModel = cubismMoc.createModel();
        console.log('Model created');
        
        // 创建渲染器
        // 修复：使用正确的 Cubism SDK 5.1 API
        if (Live2DCubismFramework.CubismRenderer_WebGL) {
            renderer = new Live2DCubismFramework.CubismRenderer_WebGL();
        } else if (Live2DCubismFramework.CubismRenderer && Live2DCubismFramework.CubismRenderer.WebGL) {
            // 处理不同版本 SDK 的命名差异
            renderer = new Live2DCubismFramework.CubismRenderer.WebGL();
        } else {
            // fallback 方案
            console.error('Cannot find CubismRenderer_WebGL class');
            throw new Error('Cannot find CubismRenderer_WebGL class');
        }
        
        renderer.initialize(cubismModel);
        renderer.setGl(gl);
        
        // 设置画布大小
        const viewport = [0, 0, canvas.width, canvas.height];
        renderer.setRenderState(gl.getParameter(gl.FRAMEBUFFER_BINDING), viewport);
        
        console.log('Renderer initialized');
        return cubismModel;
    } catch (e) {
        console.error('Error creating model:', e);
        throw e;
    }
}

// 加载纹理
async function loadTextures() {
    if (!modelSetting.FileReferences || !modelSetting.FileReferences.Textures) {
        throw new Error('No textures found in model setting');
    }
    
    const texturePaths = modelSetting.FileReferences.Textures;
    const texturePromises = [];
    
    for (let i = 0; i < texturePaths.length; i++) {
        const texturePath = modelHomeDir + texturePaths[i];
        console.log(`Loading texture: ${texturePath}`);
        texturePromises.push(textureManager.loadTexture(gl, texturePath));
    }
    
    try {
        const textures = await Promise.all(texturePromises);
        console.log(`Loaded ${textures.length} textures`);
        
        // 将纹理绑定到模型
        for (let i = 0; i < textures.length; i++) {
            renderer.bindTexture(i, textures[i]);
        }
        
        cubismModel.saveParameters();
        return textures;
    } catch (e) {
        console.error('Error loading textures:', e);
        throw e;
    }
}

// 加载表达式
async function loadExpressions() {
    if (!modelSetting.FileReferences || !modelSetting.FileReferences.Expressions) {
        console.log('No expressions found in model setting');
        return;
    }
    
    const expressionSettings = modelSetting.FileReferences.Expressions;
    const expressionPromises = [];
    
    for (let i = 0; i < expressionSettings.length; i++) {
        const expressionName = expressionSettings[i].Name;
        const expressionPath = modelHomeDir + expressionSettings[i].File;
        console.log(`Loading expression: ${expressionName} from ${expressionPath}`);
        
        expressionPromises.push(
            fetch(expressionPath)
                .then(response => response.json())
                .then(jsonData => {
                    const expression = Live2DCubismFramework.CubismExpressionMotion.create(jsonData);
                    expressions[expressionName] = expression;
                    console.log(`Loaded expression: ${expressionName}`);
                })
                .catch(e => {
                    console.error(`Error loading expression ${expressionName}:`, e);
                })
        );
    }
    
    try {
        await Promise.all(expressionPromises);
        console.log(`Loaded ${Object.keys(expressions).length} expressions`);
    } catch (e) {
        console.error('Error loading expressions:', e);
    }
}

// 加载动作
async function loadMotions() {
    if (!modelSetting.FileReferences || !modelSetting.FileReferences.Motions) {
        console.log('No motions found in model setting');
        return;
    }
    
    const motionGroups = modelSetting.FileReferences.Motions;
    const motionPromises = [];
    
    for (const groupName in motionGroups) {
        if (motionGroups.hasOwnProperty(groupName)) {
            const groupMotions = motionGroups[groupName];
            
            for (let i = 0; i < groupMotions.length; i++) {
                const motionPath = modelHomeDir + groupMotions[i].File;
                const motionName = `${groupName}_${i}`;
                console.log(`Loading motion: ${motionName} from ${motionPath}`);
                
                motionPromises.push(
                    fetch(motionPath)
                        .then(response => response.arrayBuffer())
                        .then(arrayBuffer => {
                            const motion = Live2DCubismFramework.CubismMotion.createFromArrayBuffer(arrayBuffer);
                            if (!motions[groupName]) {
                                motions[groupName] = [];
                            }
                            motions[groupName][i] = motion;
                            console.log(`Loaded motion: ${motionName}`);
                        })
                        .catch(e => {
                            console.error(`Error loading motion ${motionName}:`, e);
                        })
                );
            }
        }
    }
    
    try {
        await Promise.all(motionPromises);
        console.log(`Loaded motions for ${Object.keys(motions).length} groups`);
    } catch (e) {
        console.error('Error loading motions:', e);
    }
}

// 加载模型
async function loadModel(modelPath) {
    try {
        // 停止之前的动画循环
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // 加载模型设置
        await loadModelSetting(modelPath);
        
        // 构造MOC文件路径
        let mocPath = modelHomeDir + modelSetting.FileReferences.Moc;
        console.log('Loading MOC file:', mocPath);
        
        // 加载MOC文件
        await loadMocFile(mocPath);
        
        // 创建模型
        await createModel();
        
        // 加载纹理
        await loadTextures();
        
        // 加载表达式
        await loadExpressions();
        
        // 加载动作
        await loadMotions();
        
        // 初始化模型矩阵
        // 修复：使用正确的 Cubism SDK 5.1 API
        if (Live2DCubismFramework.CubismModelMatrix) {
            modelMatrix = new Live2DCubismFramework.CubismModelMatrix(
                cubismModel.getCanvasWidth(), 
                cubismModel.getCanvasHeight()
            );
        } else if (Live2DCubismFramework.CubismMath && Live2DCubismFramework.CubismMath.CubismModelMatrix) {
            // 处理不同版本 SDK 的命名差异
            modelMatrix = new Live2DCubismFramework.CubismMath.CubismModelMatrix(
                cubismModel.getCanvasWidth(),
                cubismModel.getCanvasHeight()
            );
        } else {
            // fallback 到简单矩阵操作
            console.warn('CubismModelMatrix not found, using basic positioning');
            modelMatrix = {
                setCenterPosition: function(x, y) {
                    console.log('Set center position:', x, y);
                },
                setWidth: function(width) {
                    console.log('Set width:', width);
                },
                getMvpMatrix: function() {
                    // 返回单位矩阵
                    return [
                        1, 0, 0, 0,
                        0, 1, 0, 0,
                        0, 0, 1, 0,
                        0, 0, 0, 1
                    ];
                }
            };
        }
        
        modelMatrix.setCenterPosition(0.0, 0.0);
        modelMatrix.setWidth(2.0);
        
        // 启动渲染循环
        startRenderingLoop();
        
        console.log('Model loaded successfully');
        return Promise.resolve();
    } catch (e) {
        console.error('Error loading model:', e);
        return Promise.reject(e);
    }
}

// 渲染循环
function rendering() {
    if (!gl || !cubismModel || !renderer) {
        return;
    }
    
    // 计算时间差
    const currentTime = new Date().getTime();
    if (lastTime === null) {
        lastTime = currentTime;
    }
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // 更新模型
    cubismModel.loadParameters();
    cubismModel.update();
    cubismModel.saveParameters();
    
    // 清除画布
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // 渲染模型
    renderer.setMvpMatrix(modelMatrix.getMvpMatrix());
    renderer.drawModel();
    
    // 请求下一帧
    animationFrameId = requestAnimationFrame(rendering);
}

// 启动渲染循环
function startRenderingLoop() {
    if (!animationFrameId) {
        lastTime = null;
        animationFrameId = requestAnimationFrame(rendering);
        console.log('Rendering loop started');
    }
}

// 设置缩放
function setScale(scale) {
    if (modelMatrix) {
        modelMatrix.setWidth(scale * 2.0);
        console.log(`Scale set to ${scale}`);
    }
}

// 设置位置
function setPosition(x, y) {
    if (modelMatrix) {
        modelMatrix.setCenterPosition(x, y);
        console.log(`Position set to (${x}, ${y})`);
    }
}

// 启动动作
function startMotion(group, index) {
    if (motions[group] && motions[group][index]) {
        const motion = motions[group][index];
        // 修复：使用正确的 Cubism SDK 5.1 API
        if (cubismModel.startMotion) {
            cubismModel.startMotion(motion, false);
        } else if (cubismModel.motionManager) {
            // 处理不同版本 SDK 的命名差异
            cubismModel.motionManager.startMotion(motion, false);
        }
        console.log(`Started motion: ${group}[${index}]`);
    } else {
        console.warn(`Motion not found: ${group}[${index}]`);
    }
}

// 设置表情
function setExpression(expressionName) {
    if (expressions[expressionName]) {
        const expression = expressions[expressionName];
        // 修复：使用正确的 Cubism SDK 5.1 API
        if (cubismModel.setExpression) {
            cubismModel.setExpression(expression);
        } else if (cubismModel.expressionManager) {
            // 处理不同版本 SDK 的命名差异
            cubismModel.expressionManager.setExpression(expression);
        }
        console.log(`Set expression: ${expressionName}`);
    } else {
        console.warn(`Expression not found: ${expressionName}`);
    }
}

// 设置触摸事件监听器
function setupTouchEventListeners() {
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    console.log('Touch event listeners set up');
}

// 鼠标按下处理
function handleMouseDown(event) {
    // TODO: 实现触摸交互逻辑
    console.log('Mouse down at:', event.offsetX, event.offsetY);
}

// 鼠标移动处理
function handleMouseMove(event) {
    // TODO: 实现触摸交互逻辑
    console.log('Mouse move at:', event.offsetX, event.offsetY);
}

// 鼠标抬起处理
function handleMouseUp(event) {
    // TODO: 实现触摸交互逻辑
    console.log('Mouse up at:', event.offsetX, event.offsetY);
}

// 将函数暴露给全局作用域，以便Dart可以通过js包调用
window.initLive2D = initLive2D;
window.loadModel = loadModel;
window.loadModelSetting = loadModelSetting;
window.loadModelMoc = loadModelMoc;
window.loadTextures = loadTextures;
window.loadMotions = loadMotions;
window.loadExpressions = loadExpressions;
window.renderLoop = renderLoop;
window.setScale = setScale;
window.setPosition = setPosition;
window.startMotion = startMotion;
window.setExpression = setExpression;
window.setupTouchEventListeners = setupTouchEventListeners;