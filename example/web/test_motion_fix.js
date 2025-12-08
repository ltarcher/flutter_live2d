// 测试动作加载修复的脚本
console.log('开始测试动作加载修复...');

// 模拟模型配置数据
const mockModelConfig = {
    "Version": 3,
    "FileReferences": {
        "Moc": "Wanko.moc3",
        "Textures": [
            "Wanko.1024/texture_00.png"
        ],
        "Physics": "Wanko.physics3.json",
        "DisplayInfo": "Wanko.cdi3.json",
        "Motions": {
            "Idle": [
                {
                    "File": "motions/idle_01.motion3.json"
                },
                {
                    "File": "motions/idle_03.motion3.json"
                },
                {
                    "File": "motions/idle_04.motion3.json"
                }
            ],
            "TapBody": [
                {
                    "File": "motions/touch_02.motion3.json"
                },
                {
                    "File": "motions/touch_04.motion3.json"
                }
            ]
        }
    }
};

// 创建模拟的 modelSetting 对象
function createMockModelSetting(jsonData) {
    return {
        _json: jsonData,
        getModelFileName: function() {
            return jsonData.FileReferences?.Moc || null;
        },
        getTextureCount: function() {
            return jsonData.FileReferences?.Textures?.length || 0;
        },
        getTextureFileName: function(index) {
            return jsonData.FileReferences?.Textures?.[index] || null;
        },
        // 添加动作相关的方法
        getMotionGroupCount: function() {
            return Object.keys(jsonData.FileReferences?.Motions || {}).length;
        },
        getMotionGroupName: function(index) {
            const groups = Object.keys(jsonData.FileReferences?.Motions || {});
            return groups[index] || null;
        },
        getMotionCount: function(groupName) {
            return jsonData.FileReferences?.Motions?.[groupName]?.length || 0;
        },
        getMotionFileName: function(groupName, index) {
            return jsonData.FileReferences?.Motions?.[groupName]?.[index]?.File || null;
        },
        getExpressionCount: function() {
            return jsonData.FileReferences?.Expressions?.length || 0;
        },
        getExpressionName: function(index) {
            return jsonData.FileReferences?.Expressions?.[index]?.Name || null;
        },
        getExpressionFileName: function(index) {
            return jsonData.FileReferences?.Expressions?.[index]?.File || null;
        },
        _textureFileNames: jsonData.FileReferences?.Textures || []
    };
}

// 测试动作组获取
function testMotionGroupLoading(modelSetting) {
    console.log('=== 测试动作组获取 ===');
    
    // 测试 getMotionGroupCount
    const groupCount = modelSetting.getMotionGroupCount();
    console.log(`动作组数量: ${groupCount}`);
    
    // 测试 getMotionGroupName
    for (let i = 0; i < groupCount; i++) {
        const groupName = modelSetting.getMotionGroupName(i);
        console.log(`动作组 ${i}: ${groupName}`);
    }
    
    return groupCount;
}

// 测试动作数量获取
function testMotionCountLoading(modelSetting) {
    console.log('=== 测试动作数量获取 ===');
    
    const groupCount = modelSetting.getMotionGroupCount();
    for (let i = 0; i < groupCount; i++) {
        const groupName = modelSetting.getMotionGroupName(i);
        const motionCount = modelSetting.getMotionCount(groupName);
        console.log(`动作组 ${groupName} 包含 ${motionCount} 个动作`);
    }
}

// 测试动作文件名获取
function testMotionFileNameLoading(modelSetting) {
    console.log('=== 测试动作文件名获取 ===');
    
    const groupCount = modelSetting.getMotionGroupCount();
    for (let i = 0; i < groupCount; i++) {
        const groupName = modelSetting.getMotionGroupName(i);
        const motionCount = modelSetting.getMotionCount(groupName);
        
        console.log(`动作组 ${groupName} 的文件名:`);
        for (let j = 0; j < motionCount; j++) {
            const fileName = modelSetting.getMotionFileName(groupName, j);
            console.log(`  [${j}]: ${fileName}`);
        }
    }
}

// 运行测试
function runTests() {
    console.log('创建模拟的 modelSetting 对象...');
    const modelSetting = createMockModelSetting(mockModelConfig);
    
    console.log('开始运行测试...');
    testMotionGroupLoading(modelSetting);
    testMotionCountLoading(modelSetting);
    testMotionFileNameLoading(modelSetting);
    
    console.log('=== 测试完成 ===');
    console.log('修复后的动作加载功能应该能够正确:');
    console.log('1. 获取动作组数量');
    console.log('2. 获取动作组名称');
    console.log('3. 获取每个组的动作数量');
    console.log('4. 获取每个动作的文件名');
}

// 如果在浏览器环境中，运行测试
if (typeof window !== 'undefined') {
    window.addEventListener('load', runTests);
} else {
    runTests();
}