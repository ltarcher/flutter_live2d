/**
 * Live2D Web Bridge
 * 提供Dart与JavaScript之间的桥接功能
 */

let live2dModel = null;
let gl = null;
let canvas = null;
let renderer = null;
let textureManager = null;
let modelHomeDir = '';
let modelSetting = null;
let cubismModel = null;
let cubismMoc = null;

// 动作和表情相关
const expressions = {};
const motions = {};

// 纹理管理器
class TextureManager {
    constructor() {
        this.textures = {};
    }

    async loadTexture(gl, url) {
        if (this.textures[url]) {
            return this.textures[url];
        }

        return new Promise((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            image.onload = () => {
                const texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.generateMipmap(gl.TEXTURE_2D);

                this.textures[url] = texture;
                resolve(texture);
            };
            image.onerror = (err) => {
                console.error("Failed to load texture:", url, err);
                reject(err);
            };
            image.src = url;
        });
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
    // 初始化Cubism Framework选项
    cubismOption = new Live2DCubismCore.Rendering.CubismRenderer.WebGL.RendererOption();
    
    // 启动Cubism Framework
    if (Live2DCubismCore.Framework.CubismFramework.startUp(cubismOption)) {
        // 初始化Cubism Framework
        Live2DCubismCore.Framework.CubismFramework.initialize();
        console.log('Live2D Framework initialized');
        return true;
    } else {
        console.error('Failed to start up Live2D Framework');
        return false;
    }
}

// 初始化Live2D
function initLive2D() {
    if (!Live2DCubismCore) {
        console.error('Live2D Core not loaded');
        return Promise.reject('Live2D Core not loaded');
    }

    // 初始化WebGL
    if (!initWebGL()) {
        return Promise.reject('Failed to initialize WebGL');
    }

    // 初始化Live2D Framework
    if (!initLive2DFramework()) {
        return Promise.reject('Failed to initialize Live2D Framework');
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
        const arrayBuffer = await response.arrayBuffer();
        modelSetting = new Live2DCubismFramework.CubismModelSettingJson(arrayBuffer, arrayBuffer.byteLength);
        console.log('Model setting loaded:', modelSetting);
        return modelSetting;
    } catch (e) {
        console.error('Error loading model setting:', e);
        throw e;
    }
}

// 加载模型moc文件
async function loadModelMoc(modelSetting) {
    const mocFileName = modelSetting.getModelFileName();
    if (!mocFileName) {
        throw new Error('MOC file name not found in model setting');
    }
    
    try {
        const response = await fetch(modelHomeDir + mocFileName);
        const arrayBuffer = await response.arrayBuffer();
        cubismMoc = Live2DCubismFramework.CubismMoc.create(arrayBuffer);
        cubismModel = cubismMoc.createModel();
        
        // 创建渲染器
        renderer = new Live2DCubismCore.Framework.CubismRenderer.WebGL.CubismShader_WebGl();
        
        console.log('Model MOC loaded');
        return cubismModel;
    } catch (e) {
        console.error('Error loading model MOC:', e);
        throw e;
    }
}

// 加载纹理
async function loadTextures(modelSetting) {
    const textureCount = modelSetting.getTextureCount();
    
    for (let i = 0; i < textureCount; i++) {
        const textureFileName = modelSetting.getTextureFileName(i);
        if (!textureFileName) {
            console.warn(`Texture file name not found for index ${i}`);
            continue;
        }
        
        try {
            // 在实际实现中，这里应该加载纹理并绑定到模型
            console.log(`Loading texture: ${textureFileName}`);
            // 纹理加载将在渲染时处理
        } catch (e) {
            console.error(`Error loading texture ${textureFileName}:`, e);
        }
    }
    
    console.log('Textures loaded');
}

// 加载动作
async function loadMotions(modelSetting) {
    // 加载默认动作组
    const motionGroupNames = ['Idle', 'TapBody'];
    
    for (const groupName of motionGroupNames) {
        const motionCount = modelSetting.getMotionCount(groupName);
        if (motionCount <= 0) continue;
        
        motions[groupName] = [];
        
        for (let i = 0; i < motionCount; i++) {
            const motionFileName = modelSetting.getMotionFileName(groupName, i);
            if (!motionFileName) continue;
            
            try {
                const response = await fetch(modelHomeDir + motionFileName);
                const arrayBuffer = await response.arrayBuffer();
                // 实际实现中应该加载动作文件
                console.log(`Loading motion: ${motionFileName}`);
                motions[groupName].push({});
                motions[groupName].push(motion);
                console.log(`Loaded motion: ${groupName}[${i}]`);
            } catch (e) {
                console.error(`Error loading motion ${motionFileName}:`, e);
            }
        }
    }
    
    console.log('Motions loaded');
}

// 加载表情
async function loadExpressions(modelSetting) {
    const expressionCount = modelSetting.getExpressionCount();
    
    for (let i = 0; i < expressionCount; i++) {
        const expressionName = modelSetting.getExpressionName(i);
        const expressionFileName = modelSetting.getExpressionFileName(i);
        
        if (!expressionName || !expressionFileName) continue;
        
        try {
            const response = await fetch(modelHomeDir + expressionFileName);
            const arrayBuffer = await response.arrayBuffer();
            // 实际实现中应该加载表情文件
            console.log(`Loading expression: ${expressionFileName}`);
            expressions[expressionName] = {};
            expressions[expressionName] = expression;
            console.log(`Loaded expression: ${expressionName}`);
        } catch (e) {
            console.error(`Error loading expression ${expressionFileName}:`, e);
        }
    }
    
    console.log('Expressions loaded');
}

// 加载模型
async function loadModel(modelPath) {
    if (!gl) {
        console.error('WebGL not initialized');
        return;
    }

    try {
        console.log('Loading model on Web platform:', modelPath);
        
        // 显示canvas
        if (canvas) {
            canvas.style.display = 'block';
        }
        
        // 加载模型设置
        await loadModelSetting(modelPath);
        
        // 加载模型MOC
        await loadModelMoc(modelSetting);
        
        // 加载纹理
        await loadTextures(modelSetting);
        
        // 加载动作
        await loadMotions(modelSetting);
        
        // 加载表情
        await loadExpressions(modelSetting);
        
        // 新版本的Framework可能在loadModelMoc中已经处理了部分初始化
        
        console.log('Model loaded successfully');
        
        // 开始渲染循环
        renderLoop();
    } catch (e) {
        console.error('Error loading model:', e);
    }
}

// 渲染循环
function renderLoop() {
    if (!gl || !cubismModel) {
        return;
    }
    
    // 清除画布
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // 更新模型
    if (cubismModel) {
        cubismModel.update();
    }
    
    // 在实际实现中，这里应该调用渲染器来绘制模型
    
    // 请求下一帧
    requestAnimationFrame(renderLoop);
}

// 设置模型缩放
function setScale(scale) {
    console.log('Setting scale on Web platform:', scale);
    // 在实际实现中，我们会修改模型的缩放参数
    if (modelMatrix) {
        modelMatrix.scale(scale, scale);
    }
}

// 设置模型位置
function setPosition(x, y) {
    console.log('Setting position on Web platform: x=' + x + ', y=' + y);
    // 在实际实现中，我们会修改模型的位置参数
    if (modelMatrix) {
        modelMatrix.translate(x, y);
    }
}

// 启动动作
function startMotion(group, index) {
    console.log('Starting motion on Web platform: group=' + group + ', index=' + index);
    // 在实际实现中，我们会播放指定的动作
    if (motions[group] && motions[group][index]) {
        // 实际播放动作的代码
        console.log(`Playing motion: ${group}[${index}]`);
    } else {
        console.warn(`Motion not found: ${group}[${index}]`);
    }
}

// 设置表情
function setExpression(expressionId) {
    console.log('Setting expression on Web platform: ' + expressionId);
    // 在实际实现中，我们会切换到指定的表情
    if (expressions[expressionId]) {
        // 实际设置表情的代码
        console.log(`Setting expression: ${expressionId}`);
    } else {
        console.warn(`Expression not found: ${expressionId}`);
    }
}

// 处理触摸事件
function handleTouchStart(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = -(event.clientY - rect.top) / rect.height * 2 + 1;
    
    console.log('Touch start at:', x, y);
    // 在实际实现中，这里会处理触摸交互
    
    // 播放随机动作作为示例
    const motionGroups = Object.keys(motions);
    if (motionGroups.length > 0) {
        const randomGroup = motionGroups[Math.floor(Math.random() * motionGroups.length)];
        const maxIndex = motions[randomGroup].length - 1;
        const randomIndex = Math.floor(Math.random() * (maxIndex + 1));
        startMotion(randomGroup, randomIndex);
    }
}

// 添加触摸事件监听器
function setupTouchEventListeners() {
    if (canvas) {
        canvas.addEventListener('click', handleTouchStart, { passive: false });
        console.log('Touch event listeners set up');
    }
}

// 将函数暴露给全局作用域，以便Dart可以通过js包调用
window.initLive2D = initLive2D;
window.loadModel = loadModel;
window.setScale = setScale;
window.setPosition = setPosition;
window.startMotion = startMotion;
window.setExpression = setExpression;
window.setupTouchEventListeners = setupTouchEventListeners;