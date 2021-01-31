- 找到文件的绝对路径。

- 加载文件。

# 文件加载前提：

Module类

```js
function Module(id, parent) {
  this.id = id; //文件的确切绝对路径
  this.exports = {}; //文件导出对象
  this.parent = parent; //父文件，即写require所在的文件，是一个module
  if (parent && parent.children) {
    parent.children.push(this);
  }

  this.filename = null;
  this.loaded = false;
  this.children = [];
}
```

require 方法

```js
Module.prototype.require = function(path) {
  return Module._load(path, this);
};
```

Module._load 方法

```js

Module._load = function(request, parent, isMain) {
 
  //  计算绝对路径
  var filename = Module._resolveFilename(request, parent);
 
  //  第一步：如果有缓存，取出缓存
  var cachedModule = Module._cache[filename];
  if (cachedModule) {
    return cachedModule.exports;
 
  // 第二步：是否为内置模块
  if (NativeModule.exists(filename)) {
    return NativeModule.require(filename);
  }
 
  // 第三步：生成模块实例，存入缓存
  var module = new Module(filename, parent);
  Module._cache[filename] = module;
 
  // 第四步：加载模块
  try {
    module.load(filename);
    hadException = false;
  } finally {
    if (hadException) {
      delete Module._cache[filename];
    }
  }
 
  // 第五步：输出模块的exports属性
  return module.exports;
};
```

# 查找绝对路径：

## resolveFilename 方法

```js

Module._resolveFilename = function(request, parent) {
 
  // 第一步：如果是内置模块，不含路径返回
  if (NativeModule.exists(request)) {
    return request;
  }
 
  // 第二步：确定所有可能的路径
  var resolvedModule = Module._resolveLookupPaths(request, parent);
  var id = resolvedModule[0];
  var paths = resolvedModule[1];
 
  // 第三步：确定哪一个路径为真
  var filename = Module._findPath(request, paths);
  if (!filename) {
    var err = new Error("Cannot find module '" + request + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  }
  return filename;

```

## resolveLookupPaths 方法

```js
Module._resolveLookupPaths = function(request, parent) {
  if (NativeModule.exists(request)) {
    return [request, []];
  }
// 绝对路径，只有内建模块才会使用xx.js。
  var start = request.substring(0, 2);
  if (start !== './' && start !== '..') {
    var paths = modulePaths;
    if (parent) {
      if (!parent.paths) parent.paths = [];
      paths = parent.paths.concat(paths);
    }
    return [request, paths];
  }

//相对路径，无父模块，即直接执行某个文件 node test.js
  if (!parent || !parent.id || !parent.filename) {
    var mainPaths = ['.'].concat(modulePaths);
    mainPaths = Module._nodeModulePaths('.').concat(mainPaths);
    return [request, mainPaths];
  }

//相对路径，有父模块，a.js，b.js，在a.js require b.js，a为父模块。node a.js
  var isIndex = /^index\.\w+?$/.test(path.basename(parent.filename));
  var parentIdPath = isIndex ? parent.id : path.dirname(parent.id);
  var id = path.resolve(parentIdPath, request);
  if (parentIdPath === '.' && id.indexOf('/') === -1) {
    id = './' + id;
  }
  debug('RELATIVE: requested:' + request +
        ' set ID to: ' + id + ' from ' + parent.id);

  return [id, [path.dirname(parent.filename)]];
};
```

- 绝对路径 则获取初始化的modulePaths，concat父的paths。
- 相对路径，没有父模块，获取当前路径及以上的所有node_modules，然后concat modulePaths。
- 相对路径，有父模块，以父模块的路径为基础，获取确定的路径和确定的目录。

以上方法返回的是 [id,dirs]。id为request或者确定的文件路径，dirs是要遍历的目录。

## findPath 方法

```js
Module._findPath = function(request, paths) {
  var exts = Object.keys(Module._extensions);
 //绝对路径，则paths为空。
  if (request.charAt(0) === '/') {
    paths = [''];
  }
 //最后一个字符为/
  var trailingSlash = (request.slice(-1) === '/');

  var cacheKey = JSON.stringify({request: request, paths: paths});
  if (Module._pathCache[cacheKey]) {
    return Module._pathCache[cacheKey];
  }

  for (var i = 0, PL = paths.length; i < PL; i++) {
    var basePath = path.resolve(paths[i], request);
    var filename;
     //以文件名结尾
    if (!trailingSlash) {
      // 判断是否可达
      filename = tryFile(basePath);
      // 加上可能的后缀名，判断是否可达
      if (!filename && !trailingSlash) {
        filename = tryExtensions(basePath, exts);
      }
    }
    //路径下的package.js文件，读取其main属性作为文件名，在去判断。
    if (!filename) {
      filename = tryPackage(basePath, exts);
    }
    //拼接上index文件名，再和可能的后缀进行判断
    if (!filename) {
      // try it with each of the extensions at "index"
      filename = tryExtensions(path.resolve(basePath, 'index'), exts);
    }

    if (filename) {
      Module._pathCache[cacheKey] = filename;
      return filename;
    }
  }
  return false;
};
```



modulePaths 的初始化（3个目录）：

```js
Module._initPaths = function() {
  //1. process.execPath：node的安装目录
  var paths = [path.resolve(process.execPath, '..', '..', 'lib', 'node')];
  //2. 根据操作系统获取用户路径
  var isWindows = process.platform === 'win32';
  if (isWindows) {
    var homeDir = process.env.USERPROFILE;
  } else {
    var homeDir = process.env.HOME;
  }
  if (homeDir) {
    paths.unshift(path.resolve(homeDir, '.node_libraries'));
    paths.unshift(path.resolve(homeDir, '.node_modules'));
  }
  //3. 环境路径
  var nodePath = process.env['NODE_PATH'];
  if (nodePath) {
    paths = nodePath.split(path.delimiter).concat(paths);
  }
  modulePaths = paths;
  Module.globalPaths = modulePaths.slice(0);
};
```

- node安装目录（使用where node查看）的基础上拼接。
- 用户目录
- node_path配置的目录

_nodeModulePaths：相对路径且无父路径

```js
Module._nodeModulePaths = function(from) {
  // guarantee that 'from' is absolute.
  from = path.resolve(from);

  // note: this approach *only* works when the path is guaranteed
  // to be absolute.  Doing a fully-edge-case-correct path.split
  // that works on both Windows and Posix is non-trivial.
  var splitRe = process.platform === 'win32' ? /[\/\\]/ : /\//;
  var paths = [];
  var parts = from.split(splitRe);

  for (var tip = parts.length - 1; tip >= 0; tip--) {
    // don't search in .../node_modules/node_modules
    if (parts[tip] === 'node_modules') continue;
    var dir = parts.slice(0, tip + 1).concat('node_modules').join(path.sep);
    paths.push(dir);
  }

  return paths;
};
```



# 加载文件：

## load方法

每个文件都会new module(filename,parent)，然后module.load(filename);

```js
Module.prototype.load = function(filename) {
  debug('load ' + JSON.stringify(filename) +
        ' for module ' + JSON.stringify(this.id));

  assert(!this.loaded);
  this.filename = filename;
  this.paths = Module._nodeModulePaths(path.dirname(filename));

  var extension = path.extname(filename) || '.js';
  if (!Module._extensions[extension]) extension = '.js';
  Module._extensions[extension](this, filename);
  this.loaded = true;
};
```

## _extensions['.js']

加载不同类型文件的不同方法：（主要看js文件）

```js
// Native extension for .js
Module._extensions['.js'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  module._compile(stripBOM(content), filename);
};


// Native extension for .json
Module._extensions['.json'] = function(module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  try {
    module.exports = JSON.parse(stripBOM(content));
  } catch (err) {
    err.message = filename + ': ' + err.message;
    throw err;
  }
};


//Native extension for .node
Module._extensions['.node'] = process.dlopen;
```

## stripBOM

```js
function stripBOM(content) {
  // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
  // because the buffer-to-string conversion in `fs.readFileSync()`
  // translates it to FEFF, the UTF-16 BOM.
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}
```

## compile 编译js文件

```js
Module.prototype._compile = function(content, filename) {
  var self = this;
  // remove shebang
  content = content.replace(/^\#\!.*/, '');

  function require(path) {
    return self.require(path);
  }

  require.resolve = function(request) {
    return Module._resolveFilename(request, self);
  };

  Object.defineProperty(require, 'paths', { get: function() {
    throw new Error('require.paths is removed. Use ' +
                    'node_modules folders, or the NODE_PATH ' +
                    'environment variable instead.');
  }});

  require.main = process.mainModule;

  // Enable support to add extra extension types
  require.extensions = Module._extensions;
  require.registerExtension = function() {
    throw new Error('require.registerExtension() removed. Use ' +
                    'require.extensions instead.');
  };

  require.cache = Module._cache;

  var dirname = path.dirname(filename);

  if (Module._contextLoad) {
    if (self.id !== '.') {
      debug('load submodule');
      // not root module
      var sandbox = {};
      for (var k in global) {
        sandbox[k] = global[k];
      }
      sandbox.require = require;
      sandbox.exports = self.exports;
      sandbox.__filename = filename;
      sandbox.__dirname = dirname;
      sandbox.module = self;
      sandbox.global = sandbox;
      sandbox.root = root;

      return runInNewContext(content, sandbox, { filename: filename });
    }

    debug('load root module');
    // root module
    global.require = require;
    global.exports = self.exports;
    global.__filename = filename;
    global.__dirname = dirname;
    global.module = self;

    return runInThisContext(content, { filename: filename });
  }

  // create wrapper function
  var wrapper = Module.wrap(content);

  var compiledWrapper = runInThisContext(wrapper, { filename: filename });
  if (global.v8debug) {
    if (!resolvedArgv) {
      // we enter the repl if we're not given a filename argument.
      if (process.argv[1]) {
        resolvedArgv = Module._resolveFilename(process.argv[1], null);
      } else {
        resolvedArgv = 'repl';
      }
    }

    // Set breakpoint on module start
    if (filename === resolvedArgv) {
      global.v8debug.Debug.setBreakPoint(compiledWrapper, 0, 0);
    }
  }
  var args = [self.exports, require, self, filename, dirname];
  return compiledWrapper.apply(self.exports, args);
};
```

每个module 都注入了 exports、require、module、filename、dirname。