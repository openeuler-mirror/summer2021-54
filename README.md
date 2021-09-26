# Summer2021-No.54 开发Linux内核结构体关联关系分析工具

### 介绍
https://gitee.com/openeuler-competition/summer-2021/issues/I3EIK7

### 软件架构
#### 关联关系提取
该部分提供了两种不同的实现。

基于 DWARF4 解析的版本支持 GCC 编译的、带有 debug info 的内核二进制程序。使用 `pyelftools` 解析 DWARF 中的 DIE 树，从中获得结构体列表及其成员信息，转换为 JSON 格式的关系图。

基于 IR 的版本对内核的 Bitcode 进行处理，将 C 代码库经编译、IR 转换、关联分析，获得结构体列表及依赖关系。

#### 可视化
支持使用基于 Web 的可视化工具，动态查看依赖关系图。

### 依赖安装
```shell
(Arch Linux)
# pacman -S base-devel python python-pip clang graphviz
$ pip3 install wllvm networkx pyelftools

(Debian)
# apt install build-essential clang python3 python3-pip graphviz
$ pip3 install wllvm networkx pyelftools
```

### 使用说明（DWARF4 解析版本）

#### Step 1 编译内核

使用 GCC 编译内核即可，需要打开内核 Debug Info 选项，同时指定输出格式为 DWARF4：
```
CONFIG_DEBUG_INFO=y
CONFIG_DEBUG_INFO_DWARF4=y
```

#### Step 2 运行 Web 可视化工具

运行本项目的 `run_dwarf.sh`，启动 Web 可视化工具。脚本支持带 DWARF4 数据的 ELF 文件输入，具体参数可以查看 `./run.sh -h`。


### 使用说明（IR 解析版本）

#### Step 1 编译内核

首先使用 [wllvm](https://github.com/travitch/whole-program-llvm) 编译内核
```shell
$ cd linux-openeuler-4.19/
$ export LLVM_COMPILER=clang    # 指定 LLVM 编译器
$ make CC=wllvm defconfig       # 可以进行更多配置
$ make CC=wllvm -j$(nproc)      # 使用 wllvm 编译内核
```

#### Step 2 生成 JSON 结构体关联数据

1. 使用 wllvm 编译后，内核各驱动、模块的 .o 文件中，均已包含了 LLVM Bitcode。以 `net/ipv4/tcp_ipv4.o` 为例，使用以下命令提取 LLVM IR：
```shell
$ extract-bc net/ipv4/tcp_ipv4.o    # 获得 tcp_ipv4.o.bc
$ llvm-dis net/ipv4/tcp_ipv4.o.bc   # 将 Bitcode 反汇编为 IR
$ ls net/ipv4/tcp_ipv4.o*
net/ipv4/tcp_ipv4.o  net/ipv4/tcp_ipv4.o.bc  net/ipv4/tcp_ipv4.o.ll
```

2. 使用本项目提供的 Python 脚本，解析 IR 并获得 JSON 格式的关系数据
```shell
$ python3 ir_parser/main.py net/ipv4/tcp_ipv4.o.ll --json_dir output/
Dependency graph has 626 nodes and 1664 edges
```
