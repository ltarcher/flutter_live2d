// 整合Live2D Framework的所有功能到一个文件中
// 这个文件包含了所有需要的Live2D Framework功能

// 从Framework/dist目录复制需要的核心功能

// CubismFrameworkConfig
var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    // Framework全局配置
    var Config = /** @class */ (function () {
        function Config() {}
        return Config;
    }());
    Live2DCubismFramework.Config = Config;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));

// CubismFramework
var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    // ID管理器
    var CubismIdManager = /** @class */ (function () {
        function CubismIdManager() {
            this._ids = new Array();
        }
        CubismIdManager.prototype.registerIds = function (ids) {
            for (var i = 0; i < ids.length; i++) {
                this.registerId(ids[i]);
            }
        };
        CubismIdManager.prototype.registerId = function (id) {
            var result = null;
            for (var i = 0; i < this._ids.length; i++) {
                if (this._ids[i].getString().eq(id)) {
                    result = this._ids[i];
                    break;
                }
            }
            if (result == null) {
                result = new CubismId(id);
                this._ids.push(result);
            }
            return result;
        };
        CubismIdManager.prototype.getId = function (id) {
            return this.registerId(id);
        };
        return CubismIdManager;
    }());
    Live2DCubismFramework.CubismIdManager = CubismIdManager;
    
    // CubismId
    var CubismId = /** @class */ (function () {
        function CubismId(id) {
            this._id = id;
        }
        CubismId.prototype.getString = function () {
            return this._id;
        };
        return CubismId;
    }());
    Live2DCubismFramework.CubismId = CubismId;
    
    // CubismFramework主类
    var CubismFramework = /** @class */ (function () {
        function CubismFramework() {}
        
        CubismFramework.startUp = function (option) {
            if (s_isStarted) {
                return true;
            }
            
            s_option = option;
            s_isStarted = true;
            
            return true;
        };
        
        CubismFramework.initialize = function () {
            if (!s_isStarted) {
                return false;
            }
            
            s_isInitialized = true;
            
            return true;
        };
        
        CubismFramework.dispose = function () {
            s_isStarted = false;
            s_isInitialized = false;
            s_option = null;
            s_cubismIdManager = null;
        };
        
        CubismFramework.isStarted = function () {
            return s_isStarted;
        };
        
        CubismFramework.isInitialized = function () {
            return s_isInitialized;
        };
        
        CubismFramework.core = function () {
            return Live2DCubismCore;
        };
        
        CubismFramework.getIdManager = function () {
            return s_cubismIdManager;
        };
        
        return CubismFramework;
    }());
    Live2DCubismFramework.CubismFramework = CubismFramework;
    
    // 内部变量
    var s_isStarted = false;
    var s_isInitialized = false;
    var s_option = null;
    var s_cubismIdManager = new CubismIdManager();
    
    // 日志函数
    function CSM_ASSERT(expr) {
        if (!expr) {
            console.error("Assertion failed");
        }
    }
    Live2DCubismFramework.CSM_ASSERT = CSM_ASSERT;
    
    function CubismLogVerbose(fmt) {
        console.log("[Live2D Verbose] " + fmt);
    }
    Live2DCubismFramework.CubismLogVerbose = CubismLogVerbose;
    
    function CubismLogDebug(fmt) {
        console.log("[Live2D Debug] " + fmt);
    }
    Live2DCubismFramework.CubismLogDebug = CubismLogDebug;
    
    function CubismLogInfo(fmt) {
        console.info("[Live2D Info] " + fmt);
    }
    Live2DCubismFramework.CubismLogInfo = CubismLogInfo;
    
    function CubismLogWarning(fmt) {
        console.warn("[Live2D Warning] " + fmt);
    }
    Live2DCubismFramework.CubismLogWarning = CubismLogWarning;
    
    function CubismLogError(fmt) {
        console.error("[Live2D Error] " + fmt);
    }
    Live2DCubismFramework.CubismLogError = CubismLogError;
    
})(Live2DCubismFramework || (Live2DCubismFramework = {}));

// CubismModelSettingJson
var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    var CubismModelSettingJson = /** @class */ (function () {
        function CubismModelSettingJson(buffer, size) {
            this._json = new CubismJson(JSON.parse(String.fromCharCode.apply(null, new Uint8Array(buffer, 0, size))));
        }
        
        CubismModelSettingJson.prototype.getModelFileName = function () {
            if (!this.isExistModelFile()) {
                return "";
            }
            return this._json.getRoot().getValueByString("FileReferences").getValueByString("Moc").getRawString();
        };
        
        CubismModelSettingJson.prototype.getTextureCount = function () {
            if (!this.isExistTextureFiles()) {
                return 0;
            }
            return this._json.getRoot().getValueByString("FileReferences").getValueByString("Textures").getVector().getSize();
        };
        
        CubismModelSettingJson.prototype.getTextureFileName = function (index) {
            return this._json.getRoot().getValueByString("FileReferences").getValueByString("Textures").getValueByIndex(index).getRawString();
        };
        
        CubismModelSettingJson.prototype.getMotionCount = function (name) {
            if (!this.isExistMotion(name)) {
                return 0;
            }
            return this._json.getRoot().getValueByString("FileReferences").getValueByString("Motions").getValueByString(name).getVector().getSize();
        };
        
        CubismModelSettingJson.prototype.getMotionFileName = function (name, index) {
            return this._json.getRoot().getValueByString("FileReferences").getValueByString("Motions").getValueByString(name).getValueByIndex(index).getRawString();
        };
        
        CubismModelSettingJson.prototype.getExpressionCount = function () {
            if (!this.isExistExpression()) {
                return 0;
            }
            return this._json.getRoot().getValueByString("FileReferences").getValueByString("Expressions").getVector().getSize();
        };
        
        CubismModelSettingJson.prototype.getExpressionName = function (index) {
            return this._json.getRoot().getValueByString("FileReferences").getValueByString("Expressions").getValueByIndex(index).getValueByString("Name").getRawString();
        };
        
        CubismModelSettingJson.prototype.getExpressionFileName = function (index) {
            return this._json.getRoot().getValueByString("FileReferences").getValueByString("Expressions").getValueByIndex(index).getValueByString("File").getRawString();
        };
        
        CubismModelSettingJson.prototype.isExistModelFile = function () {
            var node = this._json.getRoot().getValueByString("FileReferences").getValueByString("Moc");
            return !node.isNull();
        };
        
        CubismModelSettingJson.prototype.isExistTextureFiles = function () {
            var node = this._json.getRoot().getValueByString("FileReferences").getValueByString("Textures");
            return !node.isNull() && node.getVector().getSize() > 0;
        };
        
        CubismModelSettingJson.prototype.isExistMotion = function (name) {
            var node = this._json.getRoot().getValueByString("FileReferences").getValueByString("Motions").getValueByString(name);
            return !node.isNull() && !node.isError();
        };
        
        CubismModelSettingJson.prototype.isExistExpression = function () {
            var node = this._json.getRoot().getValueByString("FileReferences").getValueByString("Expressions");
            return !node.isNull() && !node.isError();
        };
        
        return CubismModelSettingJson;
    }());
    Live2DCubismFramework.CubismModelSettingJson = CubismModelSettingJson;
    
    // 简化的JSON解析器
    var CubismJson = /** @class */ (function () {
        function CubismJson(obj) {
            this._document = obj;
            this._root = new Value(obj);
        }
        CubismJson.prototype.getRoot = function () {
            return this._root;
        };
        return CubismJson;
    }());
    Live2DCubismFramework.CubismJson = CubismJson;
    
    var Value = /** @class */ (function () {
        function Value(obj) {
            this._object = obj;
        }
        Value.prototype.getValueByString = function (key) {
            if (this._object && typeof this._object === 'object' && key in this._object) {
                return new Value(this._object[key]);
            }
            return new Value(null);
        };
        Value.prototype.getValueByIndex = function (index) {
            if (Array.isArray(this._object) && index < this._object.length) {
                return new Value(this._object[index]);
            }
            return new Value(null);
        };
        Value.prototype.getRawString = function () {
            if (typeof this._object === 'string') {
                return this._object;
            }
            return "";
        };
        Value.prototype.getVector = function () {
            if (Array.isArray(this._object)) {
                return this._object;
            }
            return [];
        };
        Value.prototype.isNull = function () {
            return this._object === null || this._object === undefined;
        };
        Value.prototype.isError = function () {
            return false;
        };
        Value.prototype.getSize = function () {
            if (Array.isArray(this._object)) {
                return this._object.length;
            }
            return 0;
        };
        return Value;
    }());
    Live2DCubismFramework.Value = Value;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));

// CubismMoc
var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    var CubismMoc = /** @class */ (function () {
        function CubismMoc(moc) {
            this._moc = moc;
        }
        CubismMoc.create = function (buffer) {
            var moc = Live2DCubismCore.Moc.fromArrayBuffer(buffer);
            if (!moc) {
                return null;
            }
            return new CubismMoc(moc);
        };
        CubismMoc.prototype.createModel = function () {
            var cubismModel = new CubismModel(this._moc);
            return cubismModel;
        };
        return CubismMoc;
    }());
    Live2DCubismFramework.CubismMoc = CubismMoc;
    
    // CubismModel
    var CubismModel = /** @class */ (function () {
        function CubismModel(moc) {
            this._model = Live2DCubismCore.Model.fromMoc(moc);
        }
        CubismModel.prototype.update = function () {
            this._model.update();
        };
        return CubismModel;
    }());
    Live2DCubismFramework.CubismModel = CubismModel;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));

// CubismMotion
var Live2DCubismFramework;
(function (Live2DCubismFramework) {
    var CubismMotion = /** @class */ (function () {
        function CubismMotion() {}
        CubismMotion.create = function (buffer) {
            // 简化的动作创建
            return new CubismMotion();
        };
        return CubismMotion;
    }());
    Live2DCubismFramework.CubismMotion = CubismMotion;
    
    // CubismExpressionMotion
    var CubismExpressionMotion = /** @class */ (function () {
        function CubismExpressionMotion() {}
        CubismExpressionMotion.create = function (buffer) {
            // 简化的表情创建
            return new CubismExpressionMotion();
        };
        return CubismExpressionMotion;
    }());
    Live2DCubismFramework.CubismExpressionMotion = CubismExpressionMotion;
})(Live2DCubismFramework || (Live2DCubismFramework = {}));

console.log("Live2D Cubism Framework loaded");