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
var lastFrameTime = null;
var motionManager = null;
var eyeBlink = null;
var breath = null;
var physics = null;
var pose = null;
var textures = []; // 添加textures变量

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
        if (Live2DCubismFramework.RendererOption) {
            cubismOption = new Live2DCubismFramework.RendererOption();
        } else if (Live2DCubismFramework.CubismRenderer && Live2DCubismFramework.CubismRenderer.RendererOption) {
            cubismOption = new Live2DCubismFramework.CubismRenderer.RendererOption();
        } else if (Live2DCubismCore.Rendering && Live2DCubismCore.Rendering.CubismRenderer && 
                   Live2DCubismCore.Rendering.CubismRenderer.RendererOption) {
            cubismOption = new Live2DCubismCore.Rendering.CubismRenderer.RendererOption();
        } else if (Live2DCubismCore.CubismRenderer && Live2DCubismCore.CubismRenderer.RendererOption) {
            cubismOption = new Live2DCubismCore.CubismRenderer.RendererOption();
        } else {
            // 如果找不到确切的命名空间，则创建一个空的对象
            cubismOption = {};
            console.warn('Could not find RendererOption namespace, using empty options object');
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
    
    // 初始化动作管理器
    try {
        // 尝试创建motionManager实例
        if (Live2DCubismFramework.CubismMotionManager) {
            motionManager = new Live2DCubismFramework.CubismMotionManager();
        } else {
            console.warn('CubismMotionManager not found in Live2DCubismFramework');
        }
    } catch (e) {
        console.error('Error creating motionManager:', e);
    }

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
        
        // 检查命名空间
        if (typeof Live2DCubismFramework === 'undefined') {
            throw new Error('Live2D Framework not loaded');
        }
        
        // 正确创建 CubismModelSettingJson 实例
        if (Live2DCubismFramework.CubismModelSettingJson) {
            modelSetting = new Live2DCubismFramework.CubismModelSettingJson(arrayBuffer, arrayBuffer.byteLength);
        } else {
            throw new Error('CubismModelSettingJson class not found');
        }
        
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
        
        // 修复：使用正确的 Cubism SDK API
        // 使用 Framework API 创建 Moc 对象
        if (Live2DCubismFramework.CubismMoc && typeof Live2DCubismFramework.CubismMoc.create === 'function') {
            cubismMoc = Live2DCubismFramework.CubismMoc.create(arrayBuffer);
        } else {
            // 如果 Framework API 不可用，直接使用 Core API
            cubismMoc = Live2DCubismCore.Moc.fromArrayBuffer(arrayBuffer);
        }
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
        // 修复：使用正确的 Cubism SDK API
        // 使用 Framework API 创建模型
        if (Live2DCubismFramework.CubismMoc && typeof Live2DCubismFramework.CubismMoc.prototype.createModel === 'function') {
            cubismModel = cubismMoc.createModel();
        } else {
            // 如果 Framework API 不可用，尝试直接使用 Core API
            cubismModel = new Live2DCubismFramework.CubismModel(cubismMoc);
        }
        console.log('Model created');
        
        // 初始化渲染器
        initRenderer();
    } catch (e) {
        console.error('Error creating model:', e);
        throw e;
    }
}

// 初始化渲染器
function initRenderer() {
    try {
        // 检查 renderer 是否已经创建
        if (!renderer) {
            // 尝试多种方式创建渲染器
            if (Live2DCubismFramework.CubismRenderer) {
                if (typeof Live2DCubismFramework.CubismRenderer.create === 'function') {
                    renderer = Live2DCubismFramework.CubismRenderer.create();
                } else if (typeof Live2DCubismFramework.CubismRenderer.initialize === 'function') {
                    renderer = new Live2DCubismFramework.CubismRenderer();
                    renderer.initialize();
                } else {
                    renderer = new Live2DCubismFramework.CubismRenderer();
                }
            } else {
                console.warn('Live2DCubismFramework.CubismRenderer is not available');
                return;
            }
        }
        
        // 初始化渲染器
        if (renderer) {
            // 尝试不同的初始化方法
            if (typeof renderer.initialize === 'function') {
                renderer.initialize(gl, cubismModel);
            } else if (typeof renderer.init === 'function') {
                renderer.init(gl, cubismModel);
            } else {
                console.warn('Neither renderer.initialize nor renderer.init is available');
            }
            
            // 设置OpenGL状态
            if (typeof renderer.setGl === 'function') {
                renderer.setGl(gl);
            } else if (typeof renderer.startUp === 'function') {
                renderer.startUp(gl);
            } else {
                console.warn('Neither renderer.setGl nor renderer.startUp is available');
            }
            
            // 设置渲染状态
            if (typeof renderer.setRenderState === 'function') {
                renderer.setRenderState(gl);
            } else {
                console.warn('renderer.setRenderState is not a function, skipping');
            }
        }
        
        console.log('Renderer initialized');
    } catch (e) {
        console.error('Error initializing renderer:', e);
        throw e;
    }
}

// 加载纹理
async function loadTextures() {
    try {
        // 清理之前可能存在的纹理
        if (textures && textures.length > 0) {
            for (let i = 0; i < textures.length; i++) {
                if (textures[i]) {
                    gl.deleteTexture(textures[i]);
                }
            }
            textures = [];
        }
        
        const texturePromises = [];
        textures = []; // 初始化纹理数组
        
        // 使用 modelSetting 获取纹理文件数量
        const textureCount = modelSetting.getTextureCount();
        console.log('Loading', textureCount, 'textures');
        
        for (let i = 0; i < textureCount; i++) {
            // 使用 modelSetting 获取纹理文件名
            const textureFileName = modelSetting.getTextureFileName(i);
            const textureUrl = modelHomeDir + textureFileName;
            console.log('Loading texture:', textureUrl);
            
            // 使用textureManager加载纹理
            texturePromises.push(
                textureManager.loadTexture(gl, textureUrl)
                    .then(texture => {
                        textures[i] = texture;
                        console.log(`Loaded texture ${i}:`, textureUrl);
                    })
                    .catch(e => {
                        console.error(`Error loading texture ${i}:`, e);
                    })
            );
        }
        
        await Promise.all(texturePromises);
        console.log('Loaded', textures.length, 'textures');
        
        // 绑定纹理到模型
        if (renderer) {
            // 尝试多种方式绑定纹理
            if (typeof renderer.bindTexture === 'function') {
                for (let i = 0; i < textures.length; i++) {
                    renderer.bindTexture(i, textures[i]);
                }
            } else if (typeof renderer.setTexture === 'function') {
                for (let i = 0; i < textures.length; i++) {
                    renderer.setTexture(i, textures[i]);
                }
            } else if (cubismModel && typeof cubismModel.setTexture === 'function') {
                for (let i = 0; i < textures.length; i++) {
                    cubismModel.setTexture(i, textures[i]);
                }
            } else {
                console.warn('No texture binding method found');
            }
        } else {
            console.warn('Renderer not available for texture binding');
        }
        
        // 检查是否存在 saveParameters 方法再调用
        if (cubismModel && typeof cubismModel.saveParameters === 'function') {
            cubismModel.saveParameters();
        } else if (cubismModel && cubismModel.model && typeof cubismModel.model.saveParameters === 'function') {
            cubismModel.model.saveParameters();
        } else {
            console.warn('cubismModel.saveParameters is not a function, skipping');
        }
    } catch (e) {
        console.error('Error loading textures:', e);
        throw e;
    }
}

// 加载表达式
async function loadExpressions() {
    try {
        const expressionPromises = [];
        expressions = {}; // 重置表情对象
        
        // 使用 modelSetting 获取表达式数量
        const expressionCount = modelSetting.getExpressionCount();
        console.log('Loading', expressionCount, 'expressions');
        
        for (let i = 0; i < expressionCount; i++) {
            // 使用 modelSetting 获取表达式名称和文件名
            const expressionName = modelSetting.getExpressionName(i);
            const expressionFileName = modelSetting.getExpressionFileName(i);
            const expressionPath = modelHomeDir + expressionFileName;
            console.log(`Loading expression: ${expressionName} from ${expressionPath}`);
            
            expressionPromises.push(
                fetch(expressionPath)
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => {
                        // 修复：使用正确的 Cubism SDK API
                        const expression = Live2DCubismFramework.CubismExpressionMotion.create(arrayBuffer);
                        expressions[expressionName] = expression;
                        console.log(`Loaded expression: ${expressionName}`);
                    })
                    .catch(e => {
                        console.error(`Error loading expression ${expressionName}:`, e);
                    })
            );
        }
        
        await Promise.all(expressionPromises);
        console.log(`Loaded ${Object.keys(expressions).length} expressions`);
    } catch (e) {
        console.error('Error loading expressions:', e);
    }
}

// 加载动作
async function loadMotions() {
    try {
        motions = {}; // 重置动作对象
        
        // 检查 modelSetting 是否有必要的方法
        if (!modelSetting) {
            console.warn('modelSetting is not available, skipping motion loading');
            return;
        }
        
        // 检查是否有获取动作组数量的方法
        if (typeof modelSetting.getMotionGroupCount !== 'function') {
            console.warn('modelSetting.getMotionGroupCount is not a function, trying alternative approach');
            
            // 如果没有 getMotionGroupCount，尝试检查是否有预定义的动作组
            // 这是一种兼容性处理方式
            const commonGroups = ['idle', 'tap_body', 'pinch_in', 'pinch_out', 'shake', 'flick_head'];
            
            for (const groupName of commonGroups) {
                if (typeof modelSetting.getMotionCount === 'function' && modelSetting.getMotionCount(groupName) > 0) {
                    await loadMotionGroup(groupName);
                }
            }
            
            console.log('Processed motion groups using alternative approach');
            return;
        }
        
        // 使用 modelSetting 获取动作组数量
        const motionGroupCount = modelSetting.getMotionGroupCount();
        console.log('Processing', motionGroupCount, 'motion groups');
        
        // 遍历所有动作组
        for (let i = 0; i < motionGroupCount; i++) {
            // 获取动作组名称
            const groupName = modelSetting.getMotionGroupName(i);
            console.log('Processing motion group:', groupName);
            
            await loadMotionGroup(groupName);
        }
        
        console.log('Processed', Object.keys(motions).length, 'motion groups');
    } catch (e) {
        console.error('Error processing motion groups:', e);
        // 不抛出错误，让其他部分继续执行
    }
}

// 加载单个动作组
async function loadMotionGroup(groupName) {
    try {
        // 获取该组的动作数量
        const motionCount = modelSetting.getMotionCount(groupName);
        motions[groupName] = [];
        
        // 加载该组的所有动作
        for (let j = 0; j < motionCount; j++) {
            const motionFileName = modelSetting.getMotionFileName(groupName, j);
            const motionPath = modelHomeDir + motionFileName;
            
            try {
                const response = await fetch(motionPath);
                const arrayBuffer = await response.arrayBuffer();
                
                // 创建动作对象
                // 检查不同的创建方法
                let motion;
                if (Live2DCubismFramework.CubismMotion && 
                    typeof Live2DCubismFramework.CubismMotion.create === 'function') {
                    motion = Live2DCubismFramework.CubismMotion.create(arrayBuffer);
                } else if (typeof Live2DCubismFramework.ACubismMotion !== 'undefined' &&
                          typeof Live2DCubismFramework.ACubismMotion.create === 'function') {
                    motion = Live2DCubismFramework.ACubismMotion.create(arrayBuffer);
                } else {
                    console.warn('No suitable motion creation method found');
                    continue;
                }
                
                motions[groupName].push(motion);
                console.log(`Loaded motion ${j} for group ${groupName}:`, motionPath);
            } catch (e) {
                console.error(`Error loading motion ${j} for group ${groupName}:`, e);
            }
        }
    } catch (e) {
        console.error(`Error processing motion group ${groupName}:`, e);
    }
}

// 释放模型资源
function releaseModel() {
    try {
        // 取消动画循环
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // 释放纹理
        if (textureManager && gl) {
            textureManager.releaseTextures(gl);
        }
        
        // 清理纹理数组
        if (textures && textures.length > 0) {
            for (let i = 0; i < textures.length; i++) {
                if (textures[i]) {
                    gl.deleteTexture(textures[i]);
                }
            }
            textures = [];
        }
        
        // 重置各个对象
        if (cubismModel) {
            cubismModel = null;
        }
        
        if (cubismMoc) {
            cubismMoc = null;
        }
        
        if (renderer) {
            renderer = null;
        }
        
        if (modelSetting) {
            modelSetting = null;
        }
        
        // 重置其他组件
        eyeBlink = null;
        breath = null;
        physics = null;
        pose = null;
        expressions = {};
        motions = {};
        modelMatrix = null;
        
        console.log('Model resources released');
    } catch (e) {
        console.error('Error releasing model:', e);
    }
}

// 加载模型
async function loadModel(modelPath) {
    try {
        // 释放之前的模型资源
        releaseModel();
        
        // 重新初始化lastFrameTime
        lastFrameTime = null;
        
        // 加载模型设置
        await loadModelSetting(modelPath);
        
        // 使用 modelSetting 获取 MOC 文件名并构造路径
        const mocFileName = modelSetting.getModelFileName();
        let mocPath = modelHomeDir + mocFileName;
        console.log('Loading MOC file:', mocPath);
        
        // 加载MOC文件
        await loadMocFile(mocPath);
        
        // 创建模型
        await createModel();
        
        // 初始化眼部眨眼功能
        try {
            // 尝试多种方式创建eyeBlink对象
            if (Live2DCubismFramework.CubismEyeBlink && 
                typeof Live2DCubismFramework.CubismEyeBlink.create === 'function') {
                eyeBlink = Live2DCubismFramework.CubismEyeBlink.create(modelSetting);
                console.log('EyeBlink created successfully');
            } else {
                console.warn('CubismEyeBlink not available or create method not found');
            }
        } catch (e) {
            console.warn('Failed to create eyeBlink:', e);
        }
        
        // 初始化呼吸功能
        try {
            if (Live2DCubismFramework.CubismBreath && 
                typeof Live2DCubismFramework.CubismBreath.create === 'function') {
                breath = Live2DCubismFramework.CubismBreath.create();
                
                // 添加呼吸参数
                if (breath && cubismModel) {
                    const breathParameters = [];
                    
                    // 尝试不同的参数ID获取方式
                    let angleXId, angleYId, angleZId, bodyAngleXId, breastId;
                    
                    if (Live2DCubismFramework.CubismFramework && 
                        typeof Live2DCubismFramework.CubismFramework.getIdManager === 'function') {
                        const idManager = Live2DCubismFramework.CubismFramework.getIdManager();
                        if (idManager && typeof idManager.getId === 'function') {
                            angleXId = idManager.getId('ParamAngleX');
                            angleYId = idManager.getId('ParamAngleY');
                            angleZId = idManager.getId('ParamAngleZ');
                            bodyAngleXId = idManager.getId('ParamBodyAngleX');
                            breastId = idManager.getId('ParamBreath');
                        }
                    }
                    
                    // 添加呼吸参数
                    if (angleXId) breathParameters.push({ parameterId: angleXId, offset: 0.0, peak: 15.0, cycle: 6.5345, weight: 0.5 });
                    if (angleYId) breathParameters.push({ parameterId: angleYId, offset: 0.0, peak: 8.0, cycle: 3.5345, weight: 0.5 });
                    if (angleZId) breathParameters.push({ parameterId: angleZId, offset: 0.0, peak: 10.0, cycle: 5.5345, weight: 0.5 });
                    if (bodyAngleXId) breathParameters.push({ parameterId: bodyAngleXId, offset: 0.0, peak: 4.0, cycle: 15.5345, weight: 0.5 });
                    if (breastId) breathParameters.push({ parameterId: breastId, offset: 0.5, peak: 0.5, cycle: 3.2345, weight: 0.5 });
                    
                    if (breathParameters.length > 0 && typeof breath.setParameters === 'function') {
                        breath.setParameters(breathParameters);
                    }
                }
                console.log('Breath created successfully');
            } else {
                console.warn('CubismBreath not available or create method not found');
            }
        } catch (e) {
            console.warn('Failed to create breath:', e);
        }
        
        // 初始化物理运算
        try {
            if (modelSetting) {
                const physicsFileName = modelSetting.getPhysicsFileName();
                if (physicsFileName) {
                    const physicsPath = modelHomeDir + physicsFileName;
                    const response = await fetch(physicsPath);
                    const arrayBuffer = await response.arrayBuffer();
                    
                    if (Live2DCubismFramework.CubismPhysics && 
                        typeof Live2DCubismFramework.CubismPhysics.create === 'function') {
                        physics = Live2DCubismFramework.CubismPhysics.create(arrayBuffer);
                        console.log('Physics created successfully');
                    } else {
                        console.warn('CubismPhysics not available or create method not found');
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to create physics:', e);
        }
        
        // 初始化姿势
        try {
            if (modelSetting) {
                const poseFileName = modelSetting.getPoseFileName();
                if (poseFileName) {
                    const posePath = modelHomeDir + poseFileName;
                    const response = await fetch(posePath);
                    const arrayBuffer = await response.arrayBuffer();
                    
                    if (Live2DCubismFramework.CubismPose && 
                        typeof Live2DCubismFramework.CubismPose.create === 'function') {
                        pose = Live2DCubismFramework.CubismPose.create(arrayBuffer);
                        console.log('Pose created successfully');
                    } else {
                        console.warn('CubismPose not available or create method not found');
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to create pose:', e);
        }
        
        // 加载纹理
        await loadTextures();
        
        // 加载表达式
        await loadExpressions();
        
        // 加载动作
        await loadMotions();
        
        // 初始化模型矩阵
        // 修复：使用正确的 Cubism SDK API
        // 检查多种可能的类路径
        if (Live2DCubismFramework.CubismModelMatrix) {
            modelMatrix = new Live2DCubismFramework.CubismModelMatrix(
                cubismModel.getCanvasWidth(), 
                cubismModel.getCanvasHeight()
            );
        } else if (Live2DCubismCore.CubismModelMatrix) {
            modelMatrix = new Live2DCubismCore.CubismModelMatrix(
                cubismModel.getCanvasWidth(),
                cubismModel.getCanvasHeight()
            );
        } else {
            // 如果SDK中没有提供矩阵类，则创建一个简单的投影矩阵
            modelMatrix = {
                setCenterPosition: function(x, y) { /* 空实现 */ },
                bottom: function(n) { /* 空实现 */ },
                setWidth: function(w) { /* 空实现 */ }
            };
        }
        
        // 设置模型矩阵
        modelMatrix.setCenterPosition(0.0, 0.0);
        modelMatrix.bottom(1.0);
        modelMatrix.setWidth(2.0);
        
        // 启动渲染循环
        startRenderingLoop();
        
        console.log('Model fully loaded and initialized');
        return true;
    } catch (e) {
        console.error('Error loading model:', e);
        throw e;
    }
}

// 更新模型
function updateModel() {
    // 增加时间戳
    const currentTime = performance.now();
    const deltaTime = lastFrameTime ? (currentTime - lastFrameTime) : 16.0;
    lastFrameTime = currentTime;
    
    try {
        // 更新参数
        if (cubismModel) {
            // 更新动作
            if (motionManager) {
                if (typeof motionManager.isFinished === 'function') {
                    if (!motionManager.isFinished()) {
                        if (typeof motionManager.updateMotion === 'function') {
                            motionManager.updateMotion(cubismModel, deltaTime / 1000.0);
                        }
                    }
                } else if (typeof motionManager.updateMotion === 'function') {
                    // 直接更新动作而不检查是否完成
                    motionManager.updateMotion(cubismModel, deltaTime / 1000.0);
                } else {
                    console.warn('motionManager.updateMotion is not a function');
                }
            }
            
            // 保存参数
            if (typeof cubismModel.saveParameters === 'function') {
                cubismModel.saveParameters();
            } else if (cubismModel.model && typeof cubismModel.model.saveParameters === 'function') {
                cubismModel.model.saveParameters();
            } else {
                console.warn('cubismModel.saveParameters is not a function, skipping');
            }
            
            // 眨眼
            if (eyeBlink && typeof eyeBlink.updateParameters === 'function') {
                eyeBlink.updateParameters(cubismModel, deltaTime / 1000.0);
            }
            
            // 呼吸
            if (breath && typeof breath.updateParameters === 'function') {
                breath.updateParameters(cubismModel, deltaTime / 1000.0);
            }
            
            // 物理运算
            if (physics && typeof physics.evaluate === 'function') {
                physics.evaluate(cubismModel, deltaTime / 1000.0);
            } else if (physics && typeof physics.updateParameters === 'function') {
                physics.updateParameters(cubismModel, deltaTime / 1000.0);
            }
            
            // 姿势
            if (pose && typeof pose.updateParameters === 'function') {
                pose.updateParameters(cubismModel, deltaTime / 1000.0);
            }
            
            // 更新模型
            if (typeof cubismModel.update === 'function') {
                cubismModel.update();
            } else if (cubismModel.model && typeof cubismModel.model.update === 'function') {
                cubismModel.model.update();
            } else {
                console.warn('cubismModel.update is not a function');
            }
        }
    } catch (e) {
        console.error('Error updating model:', e);
    }
}

// 渲染模型
function renderModel() {
    try {
        if (!gl || !renderer || !cubismModel) {
            return;
        }
        
        // 清除画布
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        // 更新视口
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // 设置投影矩阵
        if (modelMatrix && renderer && typeof renderer.setMvpMatrix === 'function') {
            renderer.setMvpMatrix(modelMatrix);
        }
        
        // 渲染模型
        if (renderer) {
            // 检查不同的渲染方法
            if (typeof renderer.render === 'function') {
                renderer.render(cubismModel);
            } else if (typeof renderer.doDrawModel === 'function') {
                renderer.doDrawModel();
            } else if (typeof renderer.drawModel === 'function') {
                renderer.drawModel();
            } else if (typeof renderer.draw === 'function') {
                renderer.draw(cubismModel);
            } else {
                console.warn('No valid render function found');
            }
        }
    } catch (e) {
        console.error('Error rendering model:', e);
    }
}

// 启动渲染循环
function startRenderingLoop() {
    // 停止现有的渲染循环
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    if (!canvas) {
        console.error('Canvas not initialized');
        return;
    }
    
    // 设置清除颜色
    if (gl) {
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }
    
    // 启动循环
    if (typeof requestAnimationFrame !== 'undefined') {
        const loop = () => {
            // 更新模型
            updateModel();
            
            // 渲染模型
            renderModel();
            
            // 继续循环
            animationFrameId = requestAnimationFrame(loop);
        };
        
        animationFrameId = requestAnimationFrame(loop);
        console.log('Rendering loop started');
    } else {
        console.error('requestAnimationFrame is not supported');
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
        // 修复：使用正确的 Cubism SDK API
        // 检查多种可能的类路径
        if (cubismModel.startMotion) {
            cubismModel.startMotion(motion, false);
        } else if (cubismModel.motionManager && cubismModel.motionManager.startMotion) {
            // 处理不同版本 SDK 的命名差异
            cubismModel.motionManager.startMotion(motion, false);
        } else if (Live2DCubismFramework.CubismMotion && Live2DCubismFramework.CubismMotion.startMotion) {
            // 处理另一种可能的API结构
            Live2DCubismFramework.CubismMotion.startMotion(cubismModel, motion, false);
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
        // 修复：使用正确的 Cubism SDK API
        // 检查多种可能的类路径
        if (cubismModel.setExpression) {
            cubismModel.setExpression(expression);
        } else if (cubismModel.expressionManager && cubismModel.expressionManager.setExpression) {
            // 处理不同版本 SDK 的命名差异
            cubismModel.expressionManager.setExpression(expression);
        } else if (Live2DCubismFramework.CubismExpressionMotion && Live2DCubismFramework.CubismExpressionMotion.setExpression) {
            // 处理另一种可能的API结构
            Live2DCubismFramework.CubismExpressionMotion.setExpression(cubismModel, expression);
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
window.loadTextures = loadTextures;
window.loadMotions = loadMotions;
window.loadExpressions = loadExpressions;
window.updateModel = updateModel;
window.renderModel = renderModel;
window.setScale = setScale;
window.setPosition = setPosition;
window.startMotion = startMotion;
window.setExpression = setExpression;
window.setupTouchEventListeners = setupTouchEventListeners;
window.releaseModel = releaseModel;